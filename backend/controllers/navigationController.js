const getRoute = async (req, res) => {
    const { start, end, profile } = req.body;

    // Parse coordinates
    const startCoords = typeof start === 'object' ? [start.lat, start.lng] : [20.5937, 78.9629];
    const endCoords = typeof end === 'object' ? [end.lat, end.lng] : [20.6000, 78.9700];

    // Fetch Real Route from LocationIQ
    let routeGeometry = null;
    let routeDuration = 0;
    let routeDistance = 0;

    const apiKey = process.env.LOCATIONIQ_KEY;

    if (apiKey) {
        try {
            // LocationIQ expects lng,lat ; lng,lat for all points including stops
            let coordsString = `${startCoords[1]},${startCoords[0]}`;

            // Append stops if available
            if (req.body.stops && Array.isArray(req.body.stops)) {
                req.body.stops.forEach(stop => {
                    coordsString += `;${stop.lng},${stop.lat}`;
                });
            }

            coordsString += `;${endCoords[1]},${endCoords[0]}`;

            // Simple profile map: Wheelchair/Walker -> walking, others -> driving (or could be walking too)
            const profileMode = (profile === 'Wheelchair' || profile === 'Walker' || profile === 'Temporary' || profile === 'Fatigue') ? 'walking' : 'driving';

            const url = `https://us1.locationiq.com/v1/directions/${profileMode}/${coordsString}?key=${apiKey}&overview=full&geometries=geojson&steps=true`;

            // Note: We need to use native fetch (Node 18+) or axios. Assuming native fetch is available.
            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const bestRoute = data.routes[0];
                routeGeometry = bestRoute.geometry;
                routeDuration = bestRoute.duration;
                routeDistance = bestRoute.distance;
            } else {
                console.warn("LocationIQ API returned no routes or error:", data);
            }
        } catch (err) {
            console.error("LocationIQ Fetch failed in backend:", err.message);
        }
    } else {
        console.warn("LocationIQ Key missing in backend environment.");
    }

    // Fallback if API fails or no key
    if (!routeGeometry) {
        routeGeometry = {
            type: "Feature",
            properties: {},
            geometry: {
                type: "LineString",
                coordinates: [
                    [startCoords[1], startCoords[0]], // GeoJSON is [lng, lat]
                    [startCoords[1] + 0.001, startCoords[0] + 0.001],
                    [endCoords[1], endCoords[0]]
                ]
            }
        };
    } else {
        // Ensure it's wrapped in a Feature for consistency
        if (routeGeometry.type !== 'Feature') {
            routeGeometry = {
                type: "Feature",
                properties: {
                    duration: routeDuration,
                    distance: routeDistance
                },
                geometry: routeGeometry
            };
        }
    }

    // Helper to get a point along the route for placing alerts
    const getRoutePoint = (percentage) => {
        // routeGeometry.geometry.coordinates has the path
        const coords = routeGeometry.geometry.coordinates; // [lng, lat]
        if (!coords || coords.length === 0) return null;

        const index = Math.floor(coords.length * percentage);
        const point = coords[Math.min(index, coords.length - 1)];
        return { lat: point[1], lng: point[0] };
    };

    const alerts = [];
    const guidance = [];

    // Generate Profile-Specific Logic with Intelligent Placement
    switch (profile) {
        case 'Wheelchair':
            const p1 = getRoutePoint(0.2) || { lat: startCoords[0] + 0.0005, lng: startCoords[1] + 0.0005 };
            const p2 = getRoutePoint(0.6) || { lat: startCoords[0] + 0.0015, lng: startCoords[1] + 0.0015 };

            alerts.push({
                type: 'Construction',
                message: 'Curb ramp ahead is blocked. Rerouting via accessible sidewalk.',
                lat: p1.lat,
                lng: p1.lng,
            });
            alerts.push({
                type: 'Obstacle',
                message: 'Narrow footpath detected. Avoid this section.',
                lat: p2.lat,
                lng: p2.lng,
            });
            guidance.push("Turn left to avoid construction zone.");
            break;

        case 'Walker': // Walker / Crutches
            const w1 = getRoutePoint(0.3) || { lat: startCoords[0] + 0.001, lng: startCoords[1] + 0.001 };
            const w2 = getRoutePoint(0.7) || { lat: startCoords[0] + 0.002, lng: startCoords[1] + 0.002 };

            alerts.push({
                type: 'Crowd',
                message: 'Crowded path ahead. Switching to a safer route with benches.',
                lat: w1.lat,
                lng: w1.lng,
            });
            alerts.push({
                type: 'Slope',
                message: 'Steep slope ahead. Rerouting to flatter terrain.',
                lat: w2.lat,
                lng: w2.lng,
            });
            guidance.push("Keep right for flatter surface.");
            break;

        case 'Temporary': // Temporary Mobility Impairments
            const t1 = getRoutePoint(0.5) || { lat: startCoords[0] + 0.001, lng: startCoords[1] + 0.001 };
            alerts.push({
                type: 'Info',
                message: 'This route is longer but has fewer steps and smoother surface.',
                lat: t1.lat,
                lng: t1.lng,
            });
            guidance.push("Follow the green path for step-free access.");
            break;

        case 'Fatigue': // Chronic Conditions
            const f1 = getRoutePoint(0.25) || { lat: startCoords[0] + 0.0008, lng: startCoords[1] + 0.0008 };
            const f2 = getRoutePoint(0.75) || { lat: startCoords[0] + 0.0025, lng: startCoords[1] + 0.0025 };

            alerts.push({
                type: 'Rest',
                message: 'You’ve been moving for 10 minutes. A rest spot is 30 meters ahead.',
                lat: f1.lat,
                lng: f1.lng,
            });
            alerts.push({
                type: 'Rest',
                message: 'Bench available here.',
                lat: f2.lat,
                lng: f2.lng,
            });
            guidance.push("Take a break at the upcoming bench.");
            break;

        case 'Cognitive': // Cognitive Disabilities
            const c1 = getRoutePoint(0.1) || { lat: startCoords[0], lng: startCoords[1] };
            alerts.push({
                type: 'Info',
                message: 'Simple Route Mode Active. Avoiding crowded areas.',
                lat: c1.lat,
                lng: c1.lng,
            });
            guidance.push("Go straight for 20 steps.", "Then turn left."); // Simplified instructions
            break;

        case 'Elderly':
            const e1 = getRoutePoint(0.4) || { lat: startCoords[0] + 0.0012, lng: startCoords[1] + 0.0012 };
            alerts.push({
                type: 'Info',
                message: 'Busy area ahead. Please wait while we find a safer route.',
                lat: e1.lat,
                lng: e1.lng,
            });
            // Metadata for frontend to increase font size/audio
            res.set('X-Sim-Profile-Meta', JSON.stringify({ largeText: true, slowerAudio: true }));
            break;

        default:
            // Standard route
            break;
    }

    res.json({
        routeGeometry,
        alerts,
        guidance,
        profile,
        status: 'success'
    });
};

module.exports = { getRoute };

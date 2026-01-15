const { pool } = require('../config/db');

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

    let alerts = [];
    let guidance = [];

    // --- 1. Fetch REAL Community Reported Alerts ---
    // In a real app with PostGIS, we'd use ST_DWithin(route, alert_location).
    // Here we'll just fetch recent alerts and filter by a simple bounding box or distance in JS.
    try {
        // Get all active alerts (limit 100 for performance)
        const realAlertsResult = await pool.query('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 100');
        const realAlerts = realAlertsResult.rows;

        // Fetch Community Reports (High Trust Only)
        const reportsResult = await pool.query("SELECT * FROM reports WHERE status = 'active' AND trust_score > 0.3 ORDER BY created_at DESC LIMIT 50");
        const communityReports = reportsResult.rows;

        // Combine
        const allHazards = [...realAlerts, ...communityReports];

        // Filter alerts close to the route (Simple approach: within ~0.01 deg of start or end)
        // A better approach would be checking distance to any point on the route line.
        // For this hackathon scope: Include alerts that are generally in the "city" area of the route.

        // Let's filter alerts that are close to start, end, or mid-points.
        // Or simpler: just pass all recent local alerts to frontend for display? 
        // Let's filter slightly to avoid global spam if we had multiple cities.
        const relevantAlerts = allHazards.filter(a => {
            const latDiff = Math.abs(a.location_lat - startCoords[0]);
            const lngDiff = Math.abs(a.location_lng - startCoords[1]);
            return latDiff < 0.1 && lngDiff < 0.1; // Within ~10km
        });

        relevantAlerts.forEach(a => {
            alerts.push({
                type: a.type,
                message: `${a.message} (Trust: ${Math.round((a.trust_score || 1) * 100)}%)`,
                lat: parseFloat(a.location_lat),
                lng: parseFloat(a.location_lng),
                trust_score: a.trust_score || 1.0,
                photo_url: a.photo_url,
                id: a.id,
                isReal: true
            });
        });

    } catch (dbErr) {
        console.error("Failed to fetch real alerts:", dbErr);
    }

    // --- 2. Generate Simulated Profile-Specific Logic ---
    // Only add simulated alerts if we don't have enough real data, or to demonstrate specific use cases.

    switch (profile) {
        case 'Wheelchair':
            // Logic: Avoid stairs, narrow paths, construction
            if (alerts.length === 0) { // Fallback if no real alerts
                const p1 = getRoutePoint(0.2) || { lat: startCoords[0] + 0.0005, lng: startCoords[1] + 0.0005 };
                alerts.push({
                    type: 'Construction',
                    message: 'Curb ramp ahead is blocked. Rerouting via accessible sidewalk.',
                    lat: p1.lat,
                    lng: p1.lng,
                });
            }
            guidance.push("Turn left to avoid construction zone.", "Use the ramp on the right.");
            break;

        case 'Walker': // Walker / Crutches
            // Logic: Avoid slopes, crowds, uneven terrain
            if (alerts.length < 2) {
                const w1 = getRoutePoint(0.3) || { lat: startCoords[0] + 0.001, lng: startCoords[1] + 0.001 };
                alerts.push({
                    type: 'Slope',
                    message: 'Steep slope ahead. Rerouting to flatter terrain.',
                    lat: w1.lat,
                    lng: w1.lng,
                });
            }
            guidance.push("Keep right for flatter surface.", "Avoid the cobblestone path.");
            break;

        case 'Temporary': // Temporary Mobility Impairments (Injury, Pregnant)
            // Logic: Low impact, few steps, frequent stops
            if (alerts.length < 1) {
                const t1 = getRoutePoint(0.5) || { lat: startCoords[0] + 0.001, lng: startCoords[1] + 0.001 };
                alerts.push({
                    type: 'Info',
                    message: 'This route is longer but has fewer steps and smoother surface.',
                    lat: t1.lat,
                    lng: t1.lng,
                });
            }
            guidance.push("Follow the green path for step-free access.");
            break;

        case 'Fatigue': // Chronic Conditions (MS, Arthritis)
            // Logic: Rest spots, minimizing total exertion
            const f1 = getRoutePoint(0.25) || { lat: startCoords[0] + 0.0008, lng: startCoords[1] + 0.0008 };
            const f2 = getRoutePoint(0.60) || { lat: startCoords[0] + 0.0020, lng: startCoords[1] + 0.0020 };

            alerts.push({
                type: 'Rest',
                message: 'You’ve been moving for 10 minutes. A rest spot is 30 meters ahead.',
                lat: f1.lat,
                lng: f1.lng,
            });
            alerts.push({
                type: 'Rest',
                message: 'Public bench available here.',
                lat: f2.lat,
                lng: f2.lng,
            });
            guidance.push("Take a break at the upcoming bench.");
            break;

        case 'Cognitive': // Cognitive Disabilities (Autism, ADHD)
            // Logic: Simple instructions, avoid crowds, sensory overload
            const c1 = getRoutePoint(0.1) || { lat: startCoords[0], lng: startCoords[1] };
            alerts.push({
                type: 'Info',
                message: 'Simple Route Mode Active. Avoiding crowded areas.',
                lat: c1.lat,
                lng: c1.lng,
            });
            guidance.push("Go straight for 20 steps.", "Then turn left."); // Hyper-simplified
            break;

        case 'Elderly':
            // Logic: Larger text (meta), slow pace, safety, avoidance of busy roads
            const e1 = getRoutePoint(0.4) || { lat: startCoords[0] + 0.0012, lng: startCoords[1] + 0.0012 };
            alerts.push({
                type: 'Info',
                message: 'Busy crossing ahead. Please wait for the signal.',
                lat: e1.lat,
                lng: e1.lng,
            });
            // Metadata for frontend to increase font size/audio
            res.set('X-Sim-Profile-Meta', JSON.stringify({ largeText: true, slowerAudio: true }));
            guidance.push("Walk slowly. Busy area ahead.", "Cross strictly at the zebra crossing.");
            break;

        case 'Caregiver':
            // Logic: Remote monitoring view (mostly frontend), safe routes
            // Maybe alert about a "Safe Zone" or "Assistance Point"
            alerts.push({
                type: 'Info',
                message: 'Route mostly sidewalks. High visibility area.',
                lat: startCoords[0],
                lng: startCoords[1]
            });
            guidance.push("Route shared with caregiver.");
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

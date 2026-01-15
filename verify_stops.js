// Native fetch (Node 18+)
const testStops = async (profile) => {
    try {
        const response = await fetch('http://localhost:5000/api/navigation/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                start: 'Start Loc (Nagpur)',
                startCoords: { lat: 21.1458, lng: 79.0882 }, // Nagpur
                end: 'End Loc (Mumbai)',
                endCoords: { lat: 19.0760, lng: 72.8777 }, // Mumbai
                stops: [
                    { lat: 19.9975, lng: 73.7898 } // Nashik (Way point)
                ],
                profile: profile
            })
        });
        const data = await response.json();
        console.log(`\n=== Testing Multi-Stop Profile: ${profile} ===`);
        if (data.status === 'success') {
            if (data.routeGeometry) {
                console.log('✅ Route Geometry received');
                // We can check if distance corresponds to a detour via Nashik?
                // But for now just receiving geometry implies success of the API call format.
            } else {
                console.log('⚠️ No geometry received (check API key or limit)');
            }
            if (data.alerts.length > 0) {
                console.log('✅ Alerts received along path');
            }
        } else {
            console.log('❌ API Error:', data);
        }

    } catch (err) {
        console.error(`❌ Failed to test ${profile}:`, err.message);
    }
};

testStops('Wheelchair');

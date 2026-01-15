// Native fetch is available in Node 18+

const testProfile = async (profile) => {
    try {
        const response = await fetch('http://localhost:5000/api/navigation/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                start: 'Start Loc',
                end: 'End Loc',
                profile: profile
            })
        });
        const data = await response.json();
        console.log(`\n=== Testing Profile: ${profile} ===`);
        if (data.alerts && data.alerts.length > 0) {
            console.log('✅ Alerts received:', data.alerts.map(a => `${a.type}: ${a.message}`));
        } else {
            console.log('⚠️ No alerts received (Expected for Standard, but check logic)');
        }
        if (data.routeGeometry) {
            console.log('✅ Route Geometry received');
        }
    } catch (err) {
        console.error(`❌ Failed to test ${profile}:`, err.message);
    }
};

const runTests = async () => {
    await testProfile('Wheelchair');
    await testProfile('Walker');
    await testProfile('Fatigue');
    await testProfile('Cognitive');
    await testProfile('Standard');
};

runTests();

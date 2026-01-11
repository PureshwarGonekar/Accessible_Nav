const API_KEY = import.meta.env.VITE_LOCATIONIQ_KEY;
const BASE_URL = 'https://us1.locationiq.com/v1';

export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
        } else {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        display_name: 'Current Location'
                    });
                },
                (error) => {
                    reject(error);
                }
            );
        }
    });
};

export const searchAddress = async (query, lat = null, lon = null) => {
    if (!query || query.length < 3) return [];
    if (!API_KEY) {
        console.warn('LocationIQ Key missing');
        return [];
    }

    try {
        let url = `${BASE_URL}/autocomplete.php?key=${API_KEY}&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&countrycodes=in`;
        if (lat && lon) {
            url += `&lat=${lat}&lon=${lon}`; // LocationIQ uses lat/lon for biasing results
        }

        const response = await fetch(url);
        if (!response.ok) {
            console.warn('LocationIQ search failed:', response.statusText);
            return [];
        }
        const data = await response.json();
        if (!Array.isArray(data)) return [];
        return data.map(item => {
            // detailed address construction
            const address = item.address || {};
            const mainText = address.name || address.road || item.display_name.split(',')[0];
            const secondaryText = [
                address.city,
                address.state,
                address.country
            ].filter(Boolean).join(', ');

            return {
                display_name: item.display_name,
                main_text: mainText,
                secondary_text: secondaryText || item.display_name,
                lat: item.lat,
                lng: item.lon,
                type: item.type
            };
        });
    } catch (error) {
        console.error('Error searching address:', error);
        return [];
    }
};

export const getRoute = async (startCoords, endCoords, profile = 'foot') => {
    // profile: driving, walking/foot, cycling
    // LocationIQ Directions API uses different profiles, let's map 'em
    // However, the free tier often limits Directions. Let's try standard driving or foot.
    // LocationIQ docs: /v1/directions/driving/

    if (!API_KEY || !startCoords || !endCoords) return null;

    try {
        const coordsString = `${startCoords.lng},${startCoords.lat};${endCoords.lng},${endCoords.lat}`;
        const url = `${BASE_URL}/directions/driving/${coordsString}?key=${API_KEY}&overview=full&geometries=geojson&steps=true`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Route fetch failed');

        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
            return data.routes[0]; // Returns geometry, duration, distance
        }
        return null;
    } catch (error) {
        console.error('Error fetching route:', error);
        return null;
    }
};

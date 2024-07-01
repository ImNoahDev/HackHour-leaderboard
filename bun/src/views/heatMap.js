import Logger from "louis-log";
import fs from 'fs';

const logger = new Logger("hackhour-leaderboard", "getHack", {
    logWebook: {
        enable: true,
        url: process.env.DISCORD_WEBHOOK,
        form: "discord"
    }
});

const peopleCounts = [
  { "tz": "America/New_York", "count": 1660 },
  { "tz": "Asia/Kolkata", "count": 583 },
  { "tz": null, "count": 532 },
  { "tz": "America/Los_Angeles", "count": 380 },
  { "tz": "Europe/Amsterdam", "count": 296 },
  { "tz": "America/Chicago", "count": 215 },
  { "tz": "Europe/London", "count": 210 },
  { "tz": "America/Denver", "count": 71 },
  { "tz": "Pacific/Auckland", "count": 69 },
  { "tz": "Europe/Belgrade", "count": 69 },
  { "tz": "Asia/Chongqing", "count": 68 },
  { "tz": "Australia/Canberra", "count": 64 },
  { "tz": "Asia/Kuala_Lumpur", "count": 64 },
  { "tz": "Europe/Brussels", "count": 49 },
  { "tz": "Asia/Bangkok", "count": 42 },
  { "tz": "Europe/Warsaw", "count": 41 },
  { "tz": "Asia/Karachi", "count": 39 },
  { "tz": "Europe/Athens", "count": 37 },
  { "tz": "Africa/Algiers", "count": 29 },
  { "tz": "Africa/Monrovia", "count": 24 },
  { "tz": "Asia/Taipei", "count": 17 },
  { "tz": "Asia/Muscat", "count": 17 },
  { "tz": "Asia/Katmandu", "count": 17 },
  { "tz": "America/Sao_Paulo", "count": 17 },
  { "tz": "America/Phoenix", "count": 17 },
  { "tz": "Asia/Jerusalem", "count": 16 },
  { "tz": "Asia/Colombo", "count": 16 },
  { "tz": "Africa/Cairo", "count": 16 },
  { "tz": "Asia/Dhaka", "count": 15 },
  { "tz": "America/Bogota", "count": 15 },
  { "tz": "America/Mexico_City", "count": 14 },
  { "tz": "Europe/Moscow", "count": 13 },
  { "tz": "Australia/Adelaide", "count": 12 },
  { "tz": "Asia/Tokyo", "count": 12 },
  { "tz": "Asia/Istanbul", "count": 12 },
  { "tz": "Asia/Seoul", "count": 11 },
  { "tz": "Australia/Perth", "count": 10 },
  { "tz": "Australia/Brisbane", "count": 10 },
  { "tz": "America/Indiana/Indianapolis", "count": 10 },
  { "tz": "Africa/Harare", "count": 9 },
  { "tz": "Asia/Kuwait", "count": 7 },
  { "tz": "America/Manaus", "count": 6 },
  { "tz": "Africa/Nairobi", "count": 6 },
  { "tz": "Africa/Casablanca", "count": 6 },
  { "tz": "America/Halifax", "count": 5 },
  { "tz": "America/Buenos_Aires", "count": 5 },
  { "tz": "America/Anchorage", "count": 5 },
  { "tz": "Australia/Hobart", "count": 4 },
  { "tz": "America/Regina", "count": 4 },
  { "tz": "Pacific/Honolulu", "count": 3 },
  { "tz": "Asia/Tehran", "count": 2 },
  { "tz": "Asia/Tbilisi", "count": 2 },
  { "tz": "Asia/Beirut", "count": 2 },
  { "tz": "Asia/Baku", "count": 2 },
  { "tz": "America/Tijuana", "count": 2 },
  { "tz": "America/Havana", "count": 2 },
  { "tz": "Pacific/Fiji", "count": 1 },
  { "tz": "Indian/Mauritius", "count": 1 },
  { "tz": "Europe/Helsinki", "count": 1 },
  { "tz": "Asia/Ulaanbaatar", "count": 1 },
  { "tz": "Asia/Tashkent", "count": 1 },
  { "tz": "Asia/Krasnoyarsk", "count": 1 },
  { "tz": "Asia/Gaza", "count": 1 },
  { "tz": "Asia/Amman", "count": 1 },
  { "tz": "Asia/Almaty", "count": 1 },
  { "tz": "America/Santiago", "count": 1 },
  { "tz": "America/Montevideo", "count": 1 },
  { "tz": "America/Cancun", "count": 1 },
  { "tz": "America/Belize", "count": 1 },
  { "tz": "America/Bahia", "count": 1 },
  { "tz": "Africa/Tripoli", "count": 1 }
]


async function getCoordinates(timezone) {
    if (!timezone) return null;

    const url = `https://nominatim.openstreetmap.org/search.php?q=${encodeURIComponent(timezone)}&format=json`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch coordinates');
        }
        const data = await response.json();
        if (data.length === 0) {
            throw new Error('No coordinates found for the timezone');
        }
        
        const { lat, lon } = data[0];
        return { lat: parseFloat(lat), lng: parseFloat(lon) };
    } catch (error) {
        console.error(`Error fetching coordinates for ${timezone}:`, error.message);
        return null;
    }
}

function calculateCirclePoints(center, radius, count) {
    const points = [];
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI;
        const lat = center.lat + radius * Math.cos(angle);
        const lng = center.lng + radius * Math.sin(angle);
        points.push({ lat, lng });
    }
    return points;
}
async function generateAndSaveMap() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const mapWidth = 1280; 
    const mapHeight = 960;
    const center = '0,0';

    const allMarkers = [];

    for (const { tz, user_count } of peopleCounts) {
        if (!tz) continue; 

        const count = user_count || 0;
        const markerSize = 'small'; 
        const spreadRadius = 0.001; 


        const coordinates = await getCoordinates(tz);
        if (!coordinates) continue;

        const circlePoints = calculateCirclePoints(coordinates, spreadRadius, count);

        circlePoints.forEach(point => {
            allMarkers.push(`size:${markerSize}|color:red|${point.lat},${point.lng}`);
        });

        const randomOffset = () => (Math.random() - 0.5) * spreadRadius * 5;
        const latOffset = randomOffset();
        const lngOffset = randomOffset();
        allMarkers.push(`size:${markerSize}|color:red|${coordinates.lat + latOffset},${coordinates.lng + lngOffset}`);
    }

    const markersQuery = allMarkers.join('&markers=');


    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center}&size=${mapWidth}x${mapHeight}&markers=${markersQuery}&key=${apiKey}`;
    logger.log(mapUrl)

    const response = await fetch(mapUrl);
    if (!response.ok) {
        throw new Error('Failed to fetch map image from Google Maps Static API');
    }
    const buffer = await response.arrayBuffer();


    fs.writeFileSync('timezone_map.png', Buffer.from(buffer));
    console.log('Map saved as timezone_map.png');
}

generateAndSaveMap().catch(err => {
    console.error('Error generating map:', err);
});

import Logger from "louis-log";
import fetch from 'node-fetch';
import fs from 'fs';

// Initialize the logger (assuming louis-log is set up correctly)
const logger = new Logger("hackhour-leaderboard", "getHack", {
    logWebook: {
        enable: true,
        url: process.env.DISCORD_WEBHOOK,
        form: "discord"
    }
});

// List of timezones
const timezones = [
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Asia/Tokyo'
    // Add more timezones as needed
];

// Simulated data: Replace with actual data retrieval logic
const peopleCounts = {
    'America/New_York': 50,
    'America/Los_Angeles': 30,
    'Europe/London': 20,
    'Asia/Tokyo': 40
    // Add more as per your actual data structure
};

// Function to fetch coordinates using Nominatim (OpenStreetMap) API
async function getCoordinates(timezone) {
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
        
        // Extract latitude and longitude from the first result
        const { lat, lon } = data[0];
        return { lat: parseFloat(lat), lng: parseFloat(lon) };
    } catch (error) {
        console.error(`Error fetching coordinates for ${timezone}:`, error.message);
        return null;
    }
}

// Function to generate map using Google Maps Static API and save as PNG
async function generateAndSaveMap() {
    const apiKey = 'AIzaSyB43QJzOobtylipLBa9KQjmFah8CBP_1wA'; // Replace with your Google Maps API key
    const mapWidth = 1280; // Increased map dimensions
    const mapHeight = 960;
    const center = '0,0'; // Default center coordinates

    // Prepare markers based on timezones and people counts
    const markers = timezones.map(async (timezone) => {
        const coordinates = await getCoordinates(timezone);
        if (coordinates) {
            const count = peopleCounts[timezone] || 0;
            const markerColor = 'red'; // Adjust marker color as needed
            const markerSize = 'medium'; // Adjust marker size as needed
            return `size:${markerSize}|color:${markerColor}|label:${count}|${coordinates.lat},${coordinates.lng}`;
        }
    });

    const markersQuery = (await Promise.all(markers)).join('&markers=');

    // Generate static map URL
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center}&size=${mapWidth}x${mapHeight}&markers=${markersQuery}&key=${apiKey}`;

    // Fetch the static map image
    const response = await fetch(mapUrl);
    if (!response.ok) {
        throw new Error('Failed to fetch map image from Google Maps Static API');
    }
    const buffer = await response.arrayBuffer();

    // Save the image to a file
    fs.writeFileSync('timezone_map.png', Buffer.from(buffer));
    console.log('Map saved as timezone_map.png');
}

// Example usage: Generate and save the map
generateAndSaveMap().catch(err => {
    console.error('Error generating map:', err);
});

// TIMEZONES
/*
// [{"tz":"America/New_York","user_count":1659},{"tz":"Asia/Kolkata","user_count":582},{"tz":null,"user_count":532},{"tz":"America/Los_Angeles","user_count":379},{"tz":"Europe/Amsterdam","user_count":296},{"tz":"America/Chicago","user_count":214},{"tz":"Europe/London","user_count":210},{"tz":"America/Denver","user_count":73},{"tz":"Pacific/Auckland","user_count":69},{"tz":"Europe/Belgrade","user_count":69},{"tz":"Asia/Chongqing","user_count":69},{"tz":"Australia/Canberra","user_count":64},{"tz":"Asia/Kuala_Lumpur","user_count":64},{"tz":"Europe/Brussels","user_count":49},{"tz":"Asia/Bangkok","user_count":42},{"tz":"Europe/Warsaw","user_count":41},{"tz":"Asia/Karachi","user_count":39},{"tz":"Europe/Athens","user_count":37},{"tz":"Africa/Algiers","user_count":29},{"tz":"Africa/Monrovia","user_count":25},{"tz":"Asia/Taipei","user_count":17},{"tz":"Asia/Muscat","user_count":17},{"tz":"Asia/Katmandu","user_count":17},{"tz":"America/Sao_Paulo","user_count":17},{"tz":"America/Phoenix","user_count":17},{"tz":"Asia/Jerusalem","user_count":16},{"tz":"Asia/Colombo","user_count":16},{"tz":"Africa/Cairo","user_count":16},{"tz":"Asia/Dhaka","user_count":15},{"tz":"America/Bogota","user_count":15},{"tz":"America/Mexico_City","user_count":14},{"tz":"Europe/Moscow","user_count":13},{"tz":"Australia/Adelaide","user_count":12},{"tz":"Asia/Tokyo","user_count":12},{"tz":"Asia/Istanbul","user_count":12},{"tz":"Asia/Seoul","user_count":11},{"tz":"Australia/Perth","user_count":10},{"tz":"Australia/Brisbane","user_count":10},{"tz":"America/Indiana/Indianapolis","user_count":10},{"tz":"Africa/Harare","user_count":9},{"tz":"Asia/Kuwait","user_count":7},{"tz":"America/Manaus","user_count":6},{"tz":"Africa/Nairobi","user_count":6},{"tz":"Africa/Casablanca","user_count":6},{"tz":"America/Halifax","user_count":5},{"tz":"America/Buenos_Aires","user_count":5},{"tz":"America/Anchorage","user_count":5},{"tz":"Australia/Hobart","user_count":4},{"tz":"America/Regina","user_count":4},{"tz":"Pacific/Honolulu","user_count":3},{"tz":"Asia/Tehran","user_count":2},{"tz":"Asia/Tbilisi","user_count":2},{"tz":"Asia/Beirut","user_count":2},{"tz":"Asia/Baku","user_count":2},{"tz":"America/Tijuana","user_count":2},{"tz":"America/Havana","user_count":2},{"tz":"Pacific/Fiji","user_count":1},{"tz":"Indian/Mauritius","user_count":1},{"tz":"Europe/Helsinki","user_count":1},{"tz":"Asia/Ulaanbaatar","user_count":1},{"tz":"Asia/Tashkent","user_count":1},{"tz":"Asia/Krasnoyarsk","user_count":1},{"tz":"Asia/Gaza","user_count":1},{"tz":"Asia/Amman","user_count":1},{"tz":"Asia/Almaty","user_count":1},{"tz":"America/Santiago","user_count":1},{"tz":"America/Montevideo","user_count":1},{"tz":"America/Cancun","user_count":1},{"tz":"America/Belize","user_count":1},{"tz":"America/Bahia","user_count":1},{"tz":"Africa/Tripoli","user_count":1}]
*/

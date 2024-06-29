const { loadModules } = require('@arcgis/core');
const fetch = require('node-fetch');
const fs = require('fs');

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
        return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
    } catch (error) {
        console.error(`Error fetching coordinates for ${timezone}:`, error.message);
        return null;
    }
}

async function createDotDensityMap(timezonesData) {
    try {
        // Load necessary ArcGIS modules
        const [DotDensityRenderer, MapView, GraphicsLayer, Graphic] = await loadModules([
            'esri/renderers/DotDensityRenderer',
            'esri/views/MapView',
            'esri/layers/GraphicsLayer',
            'esri/Graphic'
        ]);

        // Initialize map and renderer
        const renderer = new DotDensityRenderer({
            dotValue: 100, // Number of people per dot
            attributes: [{
                field: 'population', // Population field
                color: '#4287f5' // Dot color
            }]
        });

        // Placeholder for adding graphics to map
        const graphicsLayer = new GraphicsLayer();

        // Loop through timezones data
        for (const timezoneData of timezonesData) {
            const { timezone, population } = timezoneData;
            const coordinates = await getCoordinates(timezone);

            if (coordinates) {
                // Create a graphic point for each timezone
                const point = {
                    type: 'point',
                    longitude: coordinates.longitude,
                    latitude: coordinates.latitude
                };

                const pointGraphic = new Graphic({
                    geometry: point,
                    attributes: {
                        population: population // Attach population data to the graphic
                    }
                });

                graphicsLayer.add(pointGraphic);
            }
        }

        // Example map view setup
        const mapView = new MapView({
            container: null, // set container to null for headless environment
            map: {
                layers: [graphicsLayer]
            },
            renderer: renderer
        });

        // Wait for map to load
        await mapView.when();

        // Save the map view as HTML
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Dot Density Map</title>
                <style>
                    html, body, #viewDiv {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                        overflow: hidden;
                    }
                </style>
                <script src="https://js.arcgis.com/4.24/"></script>
            </head>
            <body>
                <div id="viewDiv"></div>
                <script>
                    require([
                        "esri/Map",
                        "esri/views/MapView",
                        "esri/layers/GraphicsLayer",
                        "esri/Graphic",
                        "esri/renderers/DotDensityRenderer"
                    ], function(Map, MapView, GraphicsLayer, Graphic, DotDensityRenderer) {
                        const map = new Map({
                            basemap: "topo-vector"
                        });

                        const view = new MapView({
                            container: "viewDiv",
                            map: map,
                            zoom: 2
                        });

                        const renderer = new DotDensityRenderer({
                            dotValue: 100, // Number of people per dot
                            attributes: [{
                                field: "population",
                                color: "#4287f5"
                            }]
                        });

                        const graphicsLayer = new GraphicsLayer();

                        // Loop through your timezonesData and add graphics to graphicsLayer

                        map.add(graphicsLayer);
                        view.when().then(function() {
                            view.goTo(graphicsLayer.graphics); // Zoom to extent of graphics
                        });
                    });
                </script>
            </body>
            </html>
        `;

        // Write HTML content to file
        fs.writeFileSync('dot_density_map.html', htmlContent);

        console.log('Dot density map saved as dot_density_map.html');
        console.log('Open dot_density_map.html in a web browser to save it as PNG.');

    } catch (error) {
        console.error('Error creating dot density map:', error);
    }
}

// Example usage
const timezonesData = [
    { timezone: 'America/New_York', population: 10000 },
    { timezone: 'Europe/London', population: 8000 },
    // Add more timezones as needed
];

createDotDensityMap(timezonesData);

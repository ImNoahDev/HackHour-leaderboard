import { createCanvas, Canvas } from 'canvas';
import * as moment from 'moment-timezone';

// Define the type for input locations
type Location = string;

// Function to generate heat map from locations
export async function generateHeatMap(locations: Location[]): Promise<Buffer> {
  const width = 800;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Draw a blank background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // Function to map timezone offsets to x coordinates
  const mapOffsetToX = (offset: number) => {
    const minOffset = -12;
    const maxOffset = 14;
    const totalOffsets = maxOffset - minOffset;
    return ((offset - minOffset) / totalOffsets) * width;
  };

  // Define colors for the heat map
  const heatMapColors = [
    '#00f', // Blue
    '#0ff', // Cyan
    '#0f0', // Green
    '#ff0', // Yellow
    '#f00'  // Red
  ];

  // Create a map to count occurrences of each timezone offset
  const timezoneCounts: Record<number, number> = {};

  // Calculate counts of timezones
  locations.forEach(location => {
    const offset = moment.tz(location).utcOffset() / 60;
    if (!timezoneCounts[offset]) {
      timezoneCounts[offset] = 0;
    }
    timezoneCounts[offset]++;
  });

  // Find the maximum count to normalize the heat map
  const maxCount = Math.max(...Object.values(timezoneCounts));

  // Draw the heat map
  Object.entries(timezoneCounts).forEach(([offset, count]) => {
    const x = mapOffsetToX(parseInt(offset));
    const colorIndex = Math.min(Math.floor((count / maxCount) * (heatMapColors.length - 1)), heatMapColors.length - 1);
    ctx.fillStyle = heatMapColors[colorIndex];
    ctx.fillRect(x, 0, 10, height);
  });

  // Return the generated image as a buffer
  return canvas.toBuffer();
}

// Example usage
(async () => {
  const locations = [
    'Europe/London',
    'America/New_York',
    'Asia/Tokyo',
    'Europe/Paris',
    'America/Los_Angeles',
    // Add more locations as needed
  ];

  const heatMapImage = await generateHeatMap(locations);

  // Save the image to a file (for testing purposes)
  const fs = require('fs');
  fs.writeFileSync('heatmap.png', heatMapImage);
})();

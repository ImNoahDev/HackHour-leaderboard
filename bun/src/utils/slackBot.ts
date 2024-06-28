// TODO: INTEGRATE WITH MAIN ROUTER

import { Bun, Request, Response } from 'bun';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize Bun server
const server = new Bun();

// Define the Slack command handler
server.route('/slack/command/leaderboard', async (req: Request, res: Response) => {
  try {
    // Acknowledge receipt of command (optional in Bun, but useful for Slack)
    res.json({ text: 'Processing...' });

    // Respond with a message containing a link to the leaderboard website
    const message = {
      text: `Here is the leaderboard website: <https://leaderboard.imnoah.com>`,
    };
    res.json(message);
  } catch (error) {
    console.error('Error responding to command:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Bun server is running on port ${port}`);
});

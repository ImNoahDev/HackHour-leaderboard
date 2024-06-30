import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.post('/', (req, res) => {
  const { token, command, user_id, response_url } = req.body;

  // Verify Slack token for security
  if (token !== process.env.SLACK_VERIFICATION_TOKEN) {
    res.status(403).send('Access forbidden');
    return;
  }

  // Handle /leaderboard command
  if (command === '/supersecretcommand') {
    // Construct the URL with user_id
    const leaderboardURL = `https://leaderboard.imnoah.com/?${user_id}`;

    // Prepare the payload for the interactive message
    const payload = {
      text: 'Click the button to view the leaderboard:',
      attachments: [{
        text: 'Leaderboard',
        fallback: 'Leaderboard',
        actions: [{
          type: 'button',
          text: 'View Leaderboard',
          url: leaderboardURL
        }]
      }]
    };

    // Send the interactive message to Slack
    fetch(response_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    .then(() => res.status(200).send())
    .catch((error) => {
      console.error('Error sending message to Slack:', error);
      res.status(500).send('Failed to send message to Slack');
    });
  } else {
    res.status(200).send('Command not supported');
  }
});

export  {router};

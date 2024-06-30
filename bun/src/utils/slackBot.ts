import express from 'express';
<<<<<<< HEAD
import { App } from '@slack/bolt';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN;
const SLACK_BOT_TOKEN = process.env.SLACK_TOKEN;
const SLACK_SIGN = process.env.SLACK_SIGN

const boltApp = new App({
  appToken: SLACK_APP_TOKEN,
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGN
});

export const slackRouter = express.Router();

slackRouter.post('/supersecretcommand', async (req, res) => {
  const { command, user_id, trigger_id } = req.body;
  if (command === "/supersecretcommand") {
    try {
      await boltApp.client.views.open({
        trigger_id,
        view: {
          type: "modal",
          title: {
            type: "plain_text",
            text: "Leaderboard",
          },
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "*Welcome to the Arcade Leaderboard!*",
              },
              accessory: {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "View Leaderboard",
                },
                url: `https://leaderboard.imnoah.com/?user_id=${user_id}`,
                action_id: "view_leaderboard_button",
              },
              block_id: "header_block",

            },
            // Add context block for the footer-like text
            {
              type: "context",
              elements: [
                {
                  type: "plain_text",
                  text: "© 2024 ImLouis and ImNoahDev. All rights reserved.",
                },
              ],
              block_id: "footer_block",
            },
          ],
        },
      });
      res.status(200).send();
    } catch (error) {
      console.error("Error opening modal:", error);
      res.status(500).send("Failed to open modal");
    }
  } else {
    res.status(404).send("Command not supported");
  }
});


(async () => {
  try {
    await boltApp.start();
    console.log('Bolt app is running!');
  } catch (error) {
    console.error('Failed to start Bolt app:', error);
    process.exit(1);
  }
})();
=======
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
>>>>>>> 2e8045a2bab37c3fd514b3eb0eb28e944e9cdf46

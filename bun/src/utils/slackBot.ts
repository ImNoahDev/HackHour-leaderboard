import express from 'express';
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

slackRouter.post('/arcade-leaderboard', async (req, res) => {
  const { command, user_id, trigger_id } = req.body;
  if (command === "/arcade-leaderboard") {
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
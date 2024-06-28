 
import Logger from "louis-log";

// Initialize the logger
const logger = new Logger("hackhour-leaderboard", "leaderbot", {
    logWebook: {
        enable: true,
        url: process.env.DISCORD_WEBHOOK,
        form: "discord"
    }
});

const channelId = 'C06SBHMQU8G';
const token = process.env.SLACK_TOKEN;


// Function to fetch user information by user ID
async function getUserInfo(userId: string) {
  const url = `https://slack.com/api/users.info?user=${userId}`;

  try {
     fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {
      return Promise.resolve(response.json());

      })
    // logger.debug(await response.json())
    // if (response.ok) {
   
    //   if (data.ok) {
    //     logger.debug("Made it past ok")
    //     return data.user.profile.display_name;
    //   } else {
    //     throw new Error(`Error from Slack API: ${data.error}`);
    //   }
    // } else {
    //   throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    // }
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}

async function getAllChannelMembers() {
  let allMembers: string[] = [];
  let cursor = '';

  try {
    do {
      const url = `https://slack.com/api/conversations.members?channel=${channelId}&cursor=${cursor}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        allMembers.push(...data.members);

        // Check if there are more members to fetch
        cursor = data.response_metadata.next_cursor || '';
      } else {
        logger.error('Error fetching channel members:', await response.text());
        break;
      }
    } while (cursor);

    logger.log(`User IDs in channel ${channelId}:`);
    logger.log("members:",allMembers);
    logger.debug("members count:",allMembers.length)
    return allMembers;
  } catch (error) {
    logger.error('An error occurred:', error);
    return [];
  }
}

// Main execution


if (!token) {
  logger.fatal('SLACK_TOKEN environment variable is not set');
  process.exit(1);
}

// console.log(getUserInfo("U0735FTMS3V"))

async function Main() {
  console.log(await getUserInfo("U0735FTMS3V"))
}
// export default getAllChannelMembers;
Main()
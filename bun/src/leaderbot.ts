 
import Logger from "louis-log";

// Initialize the logger
const logger = new Logger("hackhour-leaderboard", "leaderbot", {
    logWebook: {
        enable: true,
        url: process.env.DISCORD_WEBHOOK,
        form: "discord"
    }
});


async function getAllChannelMembers() {
    const channelId = 'C06SBHMQU8G';
    const token = process.env.SLACK_TOKEN;
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

getAllChannelMembers().then(() => {
  logger.log('Finished fetching channel members');
});

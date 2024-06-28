// https://api.slack.com/methods/conversations.members
import { WebClient } from '@slack/web-api';
import Logger from "louis-log"

const logger = new Logger("hackhour-leaderboard","leaderbot",{
    logWebook:  {
        enable: true, 
        url: process.env.DISCORD_WEBHOOK, 
        form: "discord"
    }
    }
)

const token = process.env.SLACK_TOKEN!;

const client = new WebClient(token);

async function getChannelId(channelName: string): Promise<string | null | undefined> {
    return "C06SBHMQU8G";
}

async function getChannelMembers(channelId: string): Promise<string[] | null> {
    logger.debug("Entered getChannelMembers")
  try {
    const response = await client.conversations.members({ channel: channelId });
    logger.debug("response from members")
    if (response.ok && response.members) {
      return response.members;
    }
    return null;
  } catch (error) {
    logger.error('Error fetching channel members:', error);
    return null;
  }
}

async function main() {
    logger.debug("Entered main")
  const channelName = 'arcade';
  const channelId = await getChannelId(channelName);

  logger.debug("channelId",channelId)


  if (!channelId) {
    logger.error(`Channel "${channelName}" not found`);
    return;
  }

  const members = await getChannelMembers(channelId);

  logger.debug("got members")

  if (members) {
    logger.log(`Members of #${channelName}:`, members);
  } else {
    logger.error(`Failed to get members of channel "${channelName}"`);
  }
}

main().catch(error => {
  logger.error('Error in main function:', error);
});










/*

// You probably want to use a database to store any user information ;)
let usersStore = {};

try {
  // Call the users.list method using the WebClient
  const result = await client.users.list();

  saveUsers(result.members);
}
catch (error) {
  console.error(error);
}

// Put users into the JavaScript object
function saveUsers(usersArray) {
  let userId = '';
  usersArray.forEach(function(user){
    // Key user info on their unique user ID
    userId = user["id"];
    
    // Store the entire user object (you may not need all of the info)
    usersStore[userId] = user;
  });
}
*/




 
import Logger from "louis-log";

// Initialize the logger
const logger = new Logger("hackhour-leaderboard", "getHack", {
    logWebook: {
        enable: true,
        url: process.env.DISCORD_WEBHOOK,
        form: "discord"
    }
});

//Function to fetch number of sessions
export async function getStatsForUser(slackId: string): Promise<object | null> {
    const url = `https://hackhour.hackclub.com/api/stats/${slackId}`;
    
    try {
        logger.debug(url)
        const response = await fetch(url);
        if (!response.ok) {
            
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (data.data) {
            return data.data;
        } else {
            throw new Error('Failed to retrieve sessions');
        }
    } catch (error) {
        logger.error('Error fetching sessions:', error);
        return null
    }
}

// Example usage
async function main() {
    const userId = ""; // Get user id from command line argument
    if (!userId) {
        logger.error('Please provide a user id as an argument.');
        return;
    }

    try {
        const data = await getStatsForUser(userId);
        logger.log(`Number of sessions for user ${userId}:`,data.total / 60);
    } catch (error) {
        logger.error('Failed to fetch sessions:', error)    }
}



// main();

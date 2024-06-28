 
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
async function getStatsForUser(slackId: string): Promise<number> {
    const url = `https://hackhour.hackclub.com/api/stats/${slackId}`;
    
    try {
        logger.debug("1")
        const response = await fetch(url);
        logger.debug("2")
        if (!response.ok) {
            logger.debug("3")
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        logger.debug("5")
        const data = await response.json();
        logger.debug("6",data)
        if (data.data) {
            logger.debug("7")
            return data.data;
        } else {
            logger.debug("8")
            throw new Error('Failed to retrieve sessions');
        }
    } catch (error) {
        logger.error('Error fetching sessions:', error);
        throw error;
    }
}

// Example usage
async function main() {
    const userId = "U0735FTMS3V"; // Get user id from command line argument
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



main();

import { Database } from "bun:sqlite";
import Logger from "louis-log"

import schedule from "node-schedule"


const logger = new Logger("hackhour-leaderboard","index",{
    logWebook:  {
        enable: true, 
        url: process.env.DISCORD_WEBHOOK, 
        form: "discord"
    }
    }
)
logger.success("Entered Index")


const db = new Database("db.sqlite");
db.exec("PRAGMA journal_mode = WAL;");

logger.debug(db.query("select 'hello world' as message").get())

schedule.scheduleJob('*/10 * * * * *', updateTicketCount );
schedule.scheduleJob('*/20 * * * * *', updateUserList );

  function updateTicketCount(){
    logger.log("Starting Ticket Count Update Process")
  }
function updateUserList(){
    logger.log("Starting Update User List Process")
}
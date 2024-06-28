import { Database } from "bun:sqlite";
import Logger from "louis-log"

import schedule from "node-schedule"

import { getUserInfo, getAllChannelMembers } from "./utils/getUsers"

const logger = new Logger("hackhour-leaderboard","index",{
    logWebook:  {
        enable: true, 
        url: process.env.DISCORD_WEBHOOK, 
        form: "discord"
    }
    }
)
logger.success("Entered Index")


const db = new Database("db.sqlite",{create: true});

// db.run(`CREATE TABLE IF NOT EXISTS 'users_tmp' ('id' TEXT PRIMARY KEY NOT NULL, 'username' TEXT, 'displayName' TEXT);`);
// db.run(`CREATE TABLE IF NOT EXISTS 'tickets_tmp' ('id' INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE NOT NULL, 'user' TEXT NOT NULL REFERENCES 'users'('id'), 'unix' INTEGER NOT NULL, 'sessions' INTEGER NOT NULL, 'minutes' INTEGER NOT NULL);
// `);

logger.debug(db.query("select 'hello world' as message").get())

schedule.scheduleJob('*/10 * * * * *', updateTicketCount );
schedule.scheduleJob('*/20 * * * * *', updateUserList );

  function updateTicketCount(){
    logger.log("Starting Ticket Count Update Process")
  }
async function updateUserList(){
    logger.log("Starting Update User List Process")

    const members = await getAllChannelMembers()
    // logger.debug("Member list:",members)
    logger.debug(members.length)

    const insertUser = db.prepare("INSERT INTO users (id) VALUES (?1) ON CONFLICT(id) DO NOTHING;");
    const insertUsers = db.transaction(users => {
        for (const user of users) insertUser.run(user);
    });

    const count = insertUsers(members);
      
    logger.log(`Inserted ${count} users`);
}


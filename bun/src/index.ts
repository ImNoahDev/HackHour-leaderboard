import { Database } from "bun:sqlite";
import Logger from "louis-log"
import schedule from "node-schedule"

import { getUserInfo, getAllChannelMembers } from "./utils/getUsers"
import { getStatsForUser } from "./utils/getHack";

const logger = new Logger("hackhour-leaderboard","index",{
    logWebook:  {
        enable: true, 
        url: process.env.DISCORD_WEBHOOK, 
        form: "discord"
    }
    }
)
logger.success("Entered Index")

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const db = new Database("db.sqlite",{create: true});
db.exec('PRAGMA foreign_keys = ON')


// db.run(`CREATE TABLE IF NOT EXISTS 'users_tmp' ('id' TEXT PRIMARY KEY NOT NULL, 'username' TEXT, 'displayName' TEXT);`);
// db.run(`CREATE TABLE IF NOT EXISTS 'tickets_tmp' ('id' INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE NOT NULL, 'user' TEXT NOT NULL REFERENCES 'users'('id'), 'unix' INTEGER NOT NULL, 'sessions' INTEGER NOT NULL, 'minutes' INTEGER NOT NULL);
// `);

logger.debug(db.query("select 'hello world' as message").get())

// schedule.scheduleJob('*/10 * * * * *', updateTicketCount );
// schedule.scheduleJob('*/20 * * * * *', updateUserList );

updateTicketCount()

  async function updateTicketCount(){
    const currentTime = Math.floor(new Date().getTime() / 1000)

    logger.log("Starting Ticket Count Update Process")

    const members = db.query("SELECT id FROM users").all() 
    // logger.debug("",members)
    logger.debug("Member Count from DB:", members.length)

    for (const member in members) {
        await sleep(20)
        let stats = await getStatsForUser(members[member].id)
        logger.debug(stats)
        if (stats == null) continue;
        if (stats.sessions == 0 || stats.total == null || stats.total == 0) continue;
        logger.debug("Saving to DB",{member: members[member].id, stats})
        logger.success(db.query("INSERT INTO tickets ( id, user , unix , sessions, minutes ) VALUES (null, $user, $unix, $sessions, $minutes)").run({
            $user: members[member].id,
            $unix: currentTime,
            $sessions: stats.sessions,
            $minutes: stats.total
        }))
    }
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


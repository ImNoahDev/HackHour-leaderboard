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

import express from "express";

const app = express();
const port = 8080;


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
        db.query("INSERT INTO tickets ( id, user , unix , sessions, minutes ) VALUES (null, $user, $unix, $sessions, $minutes)").run({
            $user: members[member].id,
            $unix: currentTime,
            $sessions: stats.sessions,
            $minutes: stats.total
        })
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

    insertUsers(members);

    
      
}

async function fullUserListUpdate() {
    try {
        logger.log("Starting full user update")

        const members = db.query("SELECT id FROM users").all() 

        logger.debug("Member Count from DB:", members.length)

        let delayCounter = 0

        for (const member in members) {
            try {
                delayCounter += 1

            if (delayCounter > 500) {
                logger.log("Waiting 45 seconds in slack full user update")
                await sleep (45000)
                delayCounter = 0
            }

            await sleep(50)
            
            let userdata 

            try {
                userdata = await getUserInfo(members[member].id)
            } catch (error) {
                logger.error("There was an issue getting data from slack, waiting 45 seconds and trying again",members[member].id)
                await sleep(45000)
                try {
                    userdata = await getUserInfo(members[member].id)
                } catch (error) {
                    logger.fatal("There was an issue connecting to slack for attempt 2", members[member].id)
                    await sleep(45000)
                }
            }

            if (userdata == undefined) {
                logger.error("No data from slack", members[member].id)
                continue
            }
            
            if (userdata.error == "user_not_found") {
                logger.error("Slack user in DB but no data", members[member].id)
                continue
            };
    
            if (userdata.ok != true) {
                logger.error("Error getting slack info for user", members[member].id)
                continue
            };

            logger.debug("Saving to DB",members[member].id)
            db.query("UPDATE users SET  realname=$realname , displayname=$displayname , avatar=$avatar, tz=$tz WHERE id = $id").run({
                $id: members[member].id,
                $realname: userdata.user.profile.real_name,
                $displayname: userdata.user.profile.display_name,
                $avatar: userdata.user.profile.image_48,
                $tz: userdata.user.tz
            })
            } catch (error) {
                logger.error("Error Updating full user", {member: members[member].id, error: error})
            }

            
        }
        logger.success("Finished full updating all slack users")
        
    } catch (error) {
        logger.error("Error in updating of all full users from slack", error)
    }
}

// fullUserListUpdate()

const api = new Logger("hackhour-leaderboard","API",{
    logWebook:  {
        enable: true, 
        url: process.env.DISCORD_WEBHOOK, 
        form: "discord"
    }
    }
)

app.get("/ping", (req, res) => {
    res.send("pong");
});

app.get("/leaderboard/place/:id", (req, res) => {
    const id = req.params.id
    if (id == "") return res.error(400);
    api.log("Getting leaderboard place for",id)

    const unix = db.query(`
        SELECT unix from tickets ORDER BY unix DESC
        `
    ).get()

    api.debug("DB Latest unix",unix)
    
    const data = db.query(`
        WITH RankedScores AS (
            SELECT unix, user, sessions, minutes, RANK() OVER (ORDER BY minutes DESC) AS rank
            FROM tickets WHERE unix = $unix
        )
        SELECT unix, user, sessions, minutes, rank
        FROM RankedScores
        WHERE user = $id;`)
        .get({ $unix:unix, $id: id})
    
    api.debug("DB result",data)
    
    res.send(data);
});









app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
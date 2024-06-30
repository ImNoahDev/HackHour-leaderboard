import { Database } from "bun:sqlite";
import Logger from "louis-log"
import schedule from "node-schedule"
import jwt from "jsonwebtoken"
import path from "path"
import { rateLimit } from 'express-rate-limit'
import bodyParser from 'body-parser';

const JWT_PK = process.env.JWT_PRIVATE_KEY

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

app.set('trust proxy', 3)

const limit100 = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	limit: 50, 
	standardHeaders: 'draft-7', 
	legacyHeaders: false, 
    message: 'You can only make 50 requests every minute.'
})
const limit50 = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	limit: 50, 
	standardHeaders: 'draft-7', 
	legacyHeaders: false, 
    message: 'You can only make 50 requests every minute.'
})
const limit25 = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	limit: 25, 
	standardHeaders: 'draft-7', 
	legacyHeaders: false, 
    message: 'You can only make 25 requests every minute.'
})

logger.success("Entered Index")

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const db = new Database("db.sqlite",{create: true});
db.exec('PRAGMA foreign_keys = ON')


// db.run(`CREATE TABLE IF NOT EXISTS 'users_tmp' ('id' TEXT PRIMARY KEY NOT NULL, 'username' TEXT, 'displayName' TEXT);`);
// db.run(`CREATE TABLE IF NOT EXISTS 'tickets_tmp' ('id' INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE NOT NULL, 'user' TEXT NOT NULL REFERENCES 'users'('id'), 'unix' INTEGER NOT NULL, 'sessions' INTEGER NOT NULL, 'minutes' INTEGER NOT NULL);
// `);

logger.debug(db.query("select 'hello world' as message").get())

// schedule.scheduleJob('0 0 * * * *', updateTicketCount );
// schedule.scheduleJob('0 20 */2 * * *', updateUserList );
// schedule.scheduleJob('0 40 0 * * *', fullUserListUpdate);
schedule.scheduleJob("0 * * * * *", updateActiveSessionCount);

// fullUserListUpdate()

async function updateActiveSessionCount() {
    try {
        const currentTime = Math.floor(new Date().getTime() / 1000)

        let response = await fetch("https://hackhour.hackclub.com/status")
        let data = await response.json()

        db.query("INSERT INTO activeSession (unix, sessions) VALUES($unix, $sessions)").run({
            $unix: currentTime,
            $sessions: data.activeSessions
        })
        
        logger.success("Updated active session count",data.activeSessions)
    } catch (error) {
        api.error("There was an issue updating the count of active sessions",error)
    }
}

async function updateTicketCount(){
    try {
        const currentTime = Math.floor(new Date().getTime() / 1000)

        logger.log("Starting Ticket Count Update Process")

        const members = db.query("SELECT id FROM users").all() 
        // logger.debug("",members)
        logger.debug("Member Count from DB:", members.length)

        const insertTicket = db.prepare("INSERT INTO tickets ( id, user , unix , sessions, minutes ) VALUES (null, $user, $unix, $sessions, $minutes)")

        const insertTickets =  db.transaction( async ()=> {
            for (const member in members) {
                await sleep(20)
                if (member % 50 == 0) logger.log("Ticket Update progess",`${member}/${members.length}`)
                let stats = await getStatsForUser(members[member].id)
                logger.debug(stats)
                if (stats == null) continue;
                if (stats.sessions == 0 || stats.total == null || stats.total == 0) continue;
                logger.debug("Saving to DB",{member: members[member].id, stats})
                
                insertTicket.run({
                    $user: members[member].id,
                    $unix: currentTime,
                    $sessions: stats.sessions,
                    $minutes: stats.total
                })
            }
        })

        await insertTickets()

        db.query("INSERT INTO ticketBatches (unix) VALUES ($unix)").run({$unix: currentTime})

        logger.success("Ticket update process complete!")

        logger.log("Updating winners list")
        const unix = await db.query(`
            SELECT unix from ticketBatches ORDER BY unix DESC`
        ).get().unix
    
        api.debug("DB Latest unix",unix)

        const winner = await db.query(`
                SELECT row, rank, id, sessions, minutes, realname, displayname, avatar, tz FROM (
                SELECT ROW_NUMBER() OVER (ORDER BY minutes DESC) AS row, DENSE_RANK() OVER (ORDER BY minutes DESC) AS rank, users.id, sessions, minutes, users.realname, users.displayname, users.avatar, users.tz 
                FROM tickets
                LEFT JOIN users ON tickets.user=users.id
                WHERE unix = $unix
                ORDER BY minutes DESC
            ) AS keyset
            WHERE row > 0
            ORDER BY rank
            LIMIT 1;`)
            .get({ $unix: unix })
        logger.log("Winner for unix = ", {unix: unix, winner:winner})

        await db.query(`
            INSERT INTO winners (id, unix, user) 
            VALUES (null, $unix, $user)
            `).run({
                $unix: unix,
                $user: winner.id
            })

        logger.success("Winner sucessfully added")
    

    } catch (error) {
        logger.fatal("There was an issue with Updating ticket counts")
    }
    
}
  
async function updateUserList(){
    try {
        logger.log("Starting Update User List Process")

    const members = await getAllChannelMembers()
    // logger.debug("Member list:",members)
    logger.debug(members.length)

    const insertUser = db.prepare("INSERT INTO users (id) VALUES (?1) ON CONFLICT(id) DO NOTHING;");
    const insertUsers = db.transaction(users => {
        for (const user of users) insertUser.run(user);
    });

    await insertUsers(members);

    logger.success("Updated User List, New count", members.length)
    } catch (error) {
        logger.fatal("There was an error in the update user list process", error)
    }
}

async function fullUserListUpdate() {
    try {
        logger.log("Starting full user update")


        // const updateUser = db.prepare()
        
        let cursor = '';

        try {
            do {
                await sleep(500)
            const url = `https://slack.com/api/users.list?limit=50&cursor=${cursor}`;

            const response = await fetch(url, {
                headers: {
                Authorization: `Bearer ${process.env.SLACK_TOKEN}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                let members = data.members;

                for(let memberCount in members){
                    let member = members[memberCount] 
                    logger.debug("trying to update member",member.id)
                    logger.debug("Expects to work if data here",db.query("SELECT id FROM users WHERE id = $id").get({$id: member.id}))

                    try {
                        await sleep(500)
                        db.query(`UPDATE users SET realname = "$realname" , displayname = "$displayname" , avatar = "$avatar", tz = "$tz" WHERE id = "$id"`).get({
                            $id: member.id.toString, 
                            $realname: member.user.profile.real_name.toString,
                            $displayname: member.user.profile.display_name.toString,
                            $avatar: member.user.profile.image_48.toString,
                            $tz: member.user.tz.toString
                        })
                    } catch (error) {
                        logger.debug("User failed to update",error)
                    }
                    
                }
                
                // Check if there are more members to fetch
                cursor = data.response_metadata.next_cursor || '';
            } else {
                logger.error('Error fetching channel members:');
                break;
            }



            } while (cursor);

            logger.debug(`User IDs in channel ${channelId}:`);
            logger.debug("members:",allMembers);
            logger.debug("members count:",allMembers.length)
            return allMembers;
        } catch (error) {
            logger.error('An error occurred:', error);
            return [];
        }

    } catch (error) {
        logger.error("Error in updating of all full users from slack", error)
    }
}


// * SLACK BOT
import  {slackRouter}  from "./utils/slackBot"

app.use(bodyParser.urlencoded({ extended: true }));

// Mount the Slack events router
app.use('/slack', slackRouter);

// * VIEWS

app.get("/",limit50, (req, res) => {
    res.sendFile(path.join(__dirname,"./views/index.html"))
})
app.get("/public/nullimage.jpg",limit50, (req, res) => {
    res.sendFile(path.join(__dirname,"./views/nullimage.jpg"))
})
app.get("/public/blueTicket.png",limit50, (req, res) => {
    res.sendFile(path.join(__dirname,"./views/blueTicket.png"))
})
app.get("/public/ImNoah.png",limit50, (req, res) => {
    res.sendFile(path.join(__dirname,"./views/imnoah.png"))
})

// * API
const api = new Logger("hackhour-leaderboard","API",{
    logWebook:  {
        enable: true, 
        url: process.env.DISCORD_WEBHOOK, 
        form: "discord"
    }
    }
)

app.get("/api/ping",limit100, (req, res) => {
    res.send("pong");
});

app.get("/api/sessions",limit100, async (req,res) => {
    try {
        let response = await fetch("https://hackhour.hackclub.com/status")
        let data = await response.json()
        res.send({sessions: data.activeSessions})
    } catch (error) {
        res.send({error: error})
    }
    
})

app.get("/api/leaderboard/rank/:id",limit25, (req, res) => {
    const id = req.params.id
    if (id == "") return res.error(400); 
    api.log("Getting leaderboard place for",id)

    const unix = db.query(`
        SELECT unix from ticketBatches ORDER BY unix DESC`
    ).get().unix

    api.debug("DB Latest unix",unix)
    
    const data = db.query(`
        WITH RankedScores AS (
            SELECT unix, user, sessions, minutes, DENSE_RANK() OVER (ORDER BY minutes DESC) AS rank
            FROM tickets WHERE unix = $unix
        )
        SELECT unix, user, sessions, minutes, rank
        FROM RankedScores
        WHERE user = $id;`)
        .get({ $unix:unix, $id: id})
    
    api.debug("DB result",data)
    
    res.send(data);
});

app.get("/api/user/:id",limit25, (req, res) => {
    const id = req.params.id
    if (id == "") return res.error(400); 
    api.log("Getting user data for",id)
    
    const data = db.query(`
        SELECT id, realname, displayname, avatar, tz
        FROM users
        WHERE id = $id;`)
        .get({ $id: id })
    
    api.debug("DB result",data)
    
    res.send(data);
});

app.get("/api/leaderboard",limit25, (req, res) => {
    const cursor = req.query.next_cursor

    api.log("Getting leaderboard data with cursor", cursor)

    const unix = db.query(`
        SELECT unix from ticketBatches ORDER BY unix DESC`
    ).get().unix

    api.debug("DB Latest unix",unix)
    
    let startPage = 1

    if (cursor == null) { // No cursor
        api.debug("No cursor provided")
    } else {
        api.debug("Cursor Provided, decoding...")
        let decoded = jwt.verify(cursor,JWT_PK!)
        if (decoded.sub == "/leaderboard") startPage = decoded.next_cursor
        api.debug(decoded)
    }

    api.debug("Start page",startPage)

    const data = db.query(`
        SELECT row, rank, id, sessions, minutes, realname, displayname, avatar, tz FROM (
            SELECT ROW_NUMBER() OVER (ORDER BY minutes DESC) AS row, DENSE_RANK() OVER (ORDER BY minutes DESC) AS rank, users.id, sessions, minutes, users.realname, users.displayname, users.avatar, users.tz 
            FROM tickets
            LEFT JOIN users ON tickets.user=users.id
            WHERE unix = $unix
            ORDER BY minutes DESC
        ) AS keyset
        WHERE row > $cursor
        ORDER BY rank
        LIMIT 51;`)
        .all({
            $cursor: startPage - 1,
            $unix: unix
        })

    api.debug("Data gotten from DB")

    let out

    if (data.length < 51){
        out = {leaderboard: data}
    } else {
        out = {
        next_cursor: jwt.sign({sub: "/leaderboard", exp:  Math.floor(Date.now() / 1000) + 1800 , next_cursor: startPage + 50},JWT_PK!),
        leaderboard: data.slice(0, 50)
    }
    }
    
    

    res.send(out)

});

app.get("/api/leaderboard/winner",limit25, (req, res) => {
    

    const winners = db.query(
        `SELECT unix,user FROM winners ORDER BY unix DESC`
    ).all()

    if (winners.length == 0){
        return res.send({unix: 0, user: 0})
    }

    let currentWinner = winners[0].user
    let lastwinner 

    for (let winner in winners) {
        let winnerItem = winners[winner]
        api.debug(winnerItem)
        if (winnerItem.user != currentWinner) {
            return res.send(lastwinner)
        }
        lastwinner = winnerItem
    }

    return res.send({unix: 0, user: 0})
})




app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
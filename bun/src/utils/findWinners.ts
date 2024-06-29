import { Database } from "bun:sqlite";
import Logger from "louis-log"


const db = new Database("db.sqlite",{create: true});
db.exec('PRAGMA foreign_keys = ON')

const logger = new Logger("hackhour-leaderboard","find winners",{
    logWebook:  {
        enable: true, 
        url: process.env.DISCORD_WEBHOOK, 
        form: "discord"
    }
    }
)

function main(){
    const unixList = db.query(`SELECT DISTINCT unix FROM tickets ORDER BY unix DESC`).all()

    logger.log("unix list: ",unixList)


    unixList.forEach((unixItem)=> {
        let unix = unixItem.unix
        logger.log(unix)
        const winner = db.query(`SELECT row, rank, id, sessions, minutes, realname, displayname, avatar, tz FROM (
        SELECT ROW_NUMBER() OVER (ORDER BY minutes DESC) AS row, DENSE_RANK() OVER (ORDER BY minutes DESC) AS rank, users.id, sessions, minutes, users.realname, users.displayname, users.avatar, users.tz 
        FROM tickets
        LEFT JOIN users ON tickets.user=users.id
        WHERE unix = $unix
        ORDER BY minutes DESC
    ) AS keyset
    WHERE row > 0
    ORDER BY rank
    LIMIT 1;`).get({
        $unix: unix
    })
        logger.log("Winner for unix = ", {unix: unix, winner:winner})

        db.query(`
            INSERT INTO winners (id, unix, user) 
            VALUES (null, $unix, $user)
            `).run({
                $unix: unix,
                $user: winner.id
            })

    })
}

main()
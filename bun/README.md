# Hackhour Leaderboard
This is a leaderboard of the Hack Club arcade. It updates from the aracde data regularly and displays statistics about peoples rank, username, timezone, tickets and for the person at the first rank, how long they have been first for. 
## Usage
go to https://leaderboard.imnoah.com or do `/arcade-leaderboard` from the slack.

By using the bot command `/arcade-leaderboard` the site will show you your rank at the top!

You can also press the keys '/id' while on the site to view user ids!


## API Reference -----

### /api/ping

Server responds with pong!
Example response: 
```json
pong
```

Rate Limit: 100 per minute

### /api/sessions

Proxy for https://hackhour.hackclub.com/status

Example response: 
```json
{
  "sessions": 67
}
```

Rate Limit: 100 per minute

### /api/leaderboard

Get latest leaderboard data

Example usecase:

To get first 50 rows of leaderboard:
`/api/leaderboard`

To get any further rows you need to pass the next_cursor into the url as a query parameter:
`/api/leaderboard?next_cursor={JWT TOKEN GOES HERE}`

When you have reached the end of the leaderboard there won't be another next_cursor. This is how you know you have it all.

Example response: 
```json
{
  "next_cursor": "JWT TOKEN", // https://jwt.io
  "leaderboard": [
    {
      "row": 1,
      "rank": 1,
      "id": "SLACK ID",
      "sessions": 186,
      "minutes": 11160,
      "realname": "SLACK REAL NAME",
      "displayname": "SLACK DISPLAY NAME",
      "avatar": "SLACK PFP LINK",
      "tz": "America/Chicago"
    },
    ... ]
}
```

Rate Limit: 25 per minute

### /api/leaderboard/rank/:id


Gets the current rank of the user with slack ID provided in :id along with the unix timestamp of when that data was collected.

Example response: 
```json
{
  "unix": 1719698400, 
  "user": "SLACK ID",
  "sessions": 66,
  "minutes": 3960,
  "rank": 27
}
```

Rate Limit: 25 per minute

### /api/leaderboard/winner

Returns the current person at the top of the leaderboard and the unix timestamp of when they became leader.

Example response: 
```json
{
  "unix": 1719691200,
  "user": "SLACK ID"
}
```

Rate Limit: 25 per minute




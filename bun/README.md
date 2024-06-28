# Hackhour Leaderboard

## Plan:
- Show count of active sessions
- Have a leaderboard containing:
    - Username
    - Ticket Count

- Create /leaderboad slack bot
- pull number of minutes


## DB

### users

id: txt PK
username: txt

### tickets

id: int PK // Ticket ID
user: users.id
unix: int
sessions: int
minutes: int

## 




https://api.slack.com/methods/users.info
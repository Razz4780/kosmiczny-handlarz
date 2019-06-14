# Space Trader
Student project - single player game with Node.js.

## Setup

### Docker setup

```
docker-compose up
```

### Standard setup

```
npm install && npm run all
```

Requires connection with PostgreSQL database. Connection parameters can be passed in environment variables.

```
DBUSER - username, defaults to postgres
DBNAME - database name, defaults to postgres
DBPASS - password, defaults to postgres
DBHOST - PostgreSQL instance hostname, defaults to localhost
DBPORT - PostgreSQL instance port, defaults to 5432
```

This application requires tables ```st_user``` and ```st_game```. 
Creates them, if they are not present in the schema.

## API

### POST /api/auth/login
Body schema:
```json
{
  "type": "object",
  "properties": {
    "username": {"type": "string", "minLength": 1},
    "password": {"type": "string", "minLength": 1}
  },
  "additionalProperties": false,
  "required": ["username", "password"]
}
```
Authenticates request with given username and password. On success returns JSON object
containing user uuid, user username and fresh JWT token. Example:
```json
{
  "uuid": "958216fd-ae95-4de6-8d7a-df8c403153db",
  "username": "username",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiYjgwMWRhZDMtOWU4NC00MTIyLTgyNTQtZGRhZmM0MmQ2MDQ5IiwidXNlcm5hbWUiOiJvcmRkZW8iLCJpYXQiOjE1NjA1MjYxNTYsImV4cCI6MTU2MDk1ODE1Nn0.rppY8A2pbX0tthfzqxp9C-vAQYS_pzfyCzLwT4nOHeg"
}
```
In case of authentication failure returns 401.

### POST /api/auth/register
Body schema same as above.
Creates new user account with given username and password. On success returns JSON object
containing user uuid and username.
```json
{
  "uuid": "958216fd-ae95-4de6-8d7a-df8c403153db",
  "username": "username"
}
```
If given username is taken, returns 403.

### GET /api/auth/check
Verifies JWT token sent in ```Authorizaton``` header. On failure returns 401.

### GET /api/games
Returns list of all available games. For example:
```json
[
  {
    "uuid": "958216fd-ae95-4de6-8d7a-df8c403153db",
    "name": "game1"
  },
  {
    "uuid": "1aede299-4ec2-40b2-9fd5-8bfad819b294",
    "name": "game2"
  }
]
```

### POST /api/games
Creates new game. Requires multipart/form-data body format and fields `name` and `state`.
Field `name` is used as the name of the new game.
Contents of JSON file sent in field ```state``` is verified and saved 
as the initial state of the new game. Requires valid JWT token in ```Authorization``` header.
In case of authentication failure returns 401.

### GET /api/games/top
Returns at most 5 top scores (top score is tracked for each game independently).
Records are ordered by scores descending.
Example response:
```json
[
  {
    "name": "game1",
    "player": "player1",
    "score": 56
  },
  {
    "name": "game2",
    "player": "player2",
    "score": 34
  },
  {
    "name": "game3",
    "player": "player3",
    "score": 23
  },
  {
    "name": "game3",
    "player": "player3",
    "score": 11
  },
  {
    "name": "game4",
    "player": "player4",
    "score": 4
  }
]
```

### GET /api/games/:gameUUID
Returns initial state of the game.

### POST /api/games/:gameUUID
Body schema:
```json
{
  "type": "object",
  "properties": {
    "username": {"type": "string", "minLength": 1},
    "score": {"type": "integer", "minimum": 0}
  },
  "required": ["username", "score"],
  "additionalProperties": false
}
```
Preserves user score if it's a new top score for this game.

const express = require("express");

const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let db;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started");
    });
  } catch (e) {
    console.log(e.message);
  }
};

initializeDbAndServer();

const convertToPlayerObj = (each) => {
  const { player_id, player_name } = each;
  return {
    playerId: player_id,
    playerName: player_name,
  };
};

const convertToMatchObj = (each) => {
  const { match_id, match, year } = each;
  return {
    matchId: match_id,
    match: match,
    year: year,
  };
};

app.get("/players/", async (request, response) => {
  const getQuery = `select * from player_details;`;
  const dbResponse = await db.all(getQuery);
  const result = dbResponse.map((each) => convertToPlayerObj(each));
  response.send(result);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `select *
  from player_details 
  where player_id=${playerId};`;
  const dbResponse = await db.get(getQuery);
  const result = convertToPlayerObj(dbResponse);
  response.send(result);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const putQuery = `update 
  player_details 
  set 
  player_name='${playerName}'
    where player_id=${playerId};`;
  await db.run(putQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `select * from match_details where
    match_id=${matchId};`;
  const dbResponse = await db.get(getQuery);
  const result = convertToMatchObj(dbResponse);
  response.send(result);
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `select * from 
    match_details inner join player_details
    where player_id=${playerId};`;
  const dbResponse = await db.all(getQuery);
  const result = dbResponse.map((each) => convertToMatchObj(each));
  response.send(result);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `select * from 
    match_details inner join player_details
    where match_id=${matchId};`;
  const dbResponse = await db.all(getQuery);
  const result = dbResponse.map((each) => convertToPlayerObj(each));
  response.send(result);
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getmatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await db.get(getmatchPlayersQuery);
  response.send(playersMatchDetails);
});

module.exports = app;

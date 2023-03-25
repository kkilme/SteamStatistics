// const express = require('express');
import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/", (req, res) => {
  res.send("Hello world");
});

// 스팀 API 호출
app.get("/steaminfo", async (req, res) => {
  const steamId = req.query.steamid;
  console.log(steamId);
  const apiKey = "CDB6562AD13D438878CDCF95AECC2879";
  const url = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const player = data.response.players[0];
    const steamInfo = {
      avatar: player.avatarfull,
      username: player.personaname,
      status: player.personastate === 0 ? "Offline" : "Online",
    };
    res.json(steamInfo);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

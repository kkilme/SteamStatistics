import express from "express";
import fetch from "node-fetch"; // node-fetch는 require로 할 수 없음, import 사용
import path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3000;

app.use(express.static(__dirname + "/public"));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/home", (req, res) => {
  // res.sendFile(__dirname + '/steam.html');
  res.sendFile(path.join(__dirname, "index.html"));
  // res.send("Hello world");
});

app.get("/", (req, res) => {
  res.redirect("/home");
  // // res.sendFile(__dirname + '/steam.html');
  // res.send("Hello world!");
  // // res.send("Hello world");
});

// 스팀 API 호출
app.get("/steaminfo", async (req, res) => {
  const steamId = req.query.steamid;
  console.log("SteamId:" + steamId);
  const apiKey = "CDB6562AD13D438878CDCF95AECC2879";
  try {
    const steamUserResponse = await fetch(
      `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`
    );
    const steamUserData = await steamUserResponse.json();

    const steamGamesResponse = await fetch(
      `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&format=json`
    );
    const steamGamesData = await steamGamesResponse.json();

    res.json({
      UserData: steamUserData,
      GameData: steamGamesData,
    });

    // const playtime = steamGamesData.response.games.reduce((total, game) => total + game.playtime_forever, 0);
    // const { avatarfull, personaname, personastate } = steamUserData.response.players[0];
    // console.log(playtime);
    // res.json({
    //   playtime,
    //   avatar: avatarfull,
    //   username: personaname,
    //   status: personastate
    // });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// const texts = await Promise.all(urls.map(async url => {
//   const resp = await fetch(url);
//   return resp.text();
// }));

// Promise.all(urls.map(url =>
//   fetch(url).then(resp => resp.text())
// )).then(texts => {

// })

function readJson(filename) {
  var dt = fs.readFileSync(path.join(__dirname, filename), "utf-8");
  return JSON.parse(dt);
}

function writeJson(filename, data) {
  let obj = JSON.stringify(data);
  fs.writeFileSync(path.join(__dirname, filename), obj, "utf-8");
}

function parseData(js, appid) {
  var parsedjs = {};
  if (js[appid].success) {
    var dt = js[appid].data;
    parsedjs = {
      steam_appid: dt.steam_appid,
      success: true,
      name: dt.name,
      is_free: dt.is_free,
      metacritic: dt.metacritic,
      genres: dt.genres,
      recommendations: dt.recommendations?.total,
      achievementnum: dt.achievements?.total,
      header_image: dt.header_image,
      price_overview: dt.price_overview,
    };
  } else {
    parsedjs = {
      success: false,
    };
  }
  return parsedjs;
}
app.get("/appinfo", async (req, res) => {
  const appid = req.query.appid;
  let appdata = readJson("appdata.json");
  try {
    if (!Array.isArray(appid)) {
      // query.length = 1
      if (appid in appdata && appdata[appid] != null) {
        // cache hit
        console.log(`hit ${appid}`);
        res.json(appdata[appid]);
        return;
      }
      // cache miss
      console.log(`miss ${appid}`);
      const resps = await fetch(
        `http://store.steampowered.com/api/appdetails?appids=${appid}`
      );
      var respsjs = {};
      try {
        respsjs = await resps.json();
        appdata[appid] = parseData(respsjs, appid);
      } catch (err) {
        appdata[appid] = null;
      }
      writeJson("appdata.json", appdata);
      res.json(appdata[appid]);
      return;
    }

    // var querystrings = []
    // make fetch urls and store
    // for(let i = 0; i<appid.length; i++){
    //   querystrings.push(`http://store.steampowered.com/api/appdetails?appids=${appid[i]}`)
    // }

    // for (const st of querystrings) {
    //   console.log(st);
    // }
    // console.log(appid);
    // fetch appinfo of all games asynchronously
    const resp = await Promise.all(
      appid.map(async (id) => {
        if (id in appdata && appdata[id] != null) {
          // cache hit
          console.log(`hit ${id}`);
          return appdata[id];
        }
        console.log(`miss ${id}`);
        const resps = await fetch(
          `http://store.steampowered.com/api/appdetails?appids=${id}&cc=KR`
        );
        let respsjs = "";
        try {
          respsjs = await resps.json();
        } catch (err) {
          console.log(`Null response: ${id}`);
          appdata[id] = null;
          return appdata[id];
        }
        if (respsjs == null) {
          console.log(`js null: ${id}`);
          appdata[id] = null;
          return appdata[id];
        }
        appdata[id] = parseData(respsjs, id);
        return appdata[id];
      })
    );
    writeJson("appdata.json", appdata);
    res.json(resp);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

app.get("/achivementinfo", async (req, res) => {
  const appid = req.query.appid;
  const steamid = req.query.steamid;
  const apiKey = "CDB6562AD13D438878CDCF95AECC2879";
  try {
    const achievedata = await fetch(
      `http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appid}&key=${apiKey}&steamid=${steamid}`
    );
    const achievejsondata = await achievedata.json();
    // console.log(achievejsondata);
    res.json(achievejsondata);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

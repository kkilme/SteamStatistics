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

app.get("/profile", (req,res)=>{
  res.sendFile(path.join(__dirname, "public/info.html"));
})


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
    
    const steamLevelResponse = await fetch(
      `http://api.steampowered.com/IPlayerService/GetSteamLevel/v0001/?key=${apiKey}&steamid=${steamId}&format=json`
    );
    const steamLevelData = await steamLevelResponse.json();

    // const recentPlayedResponse = await fetch(
    //   `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${apiKey}&steamid=${steamId}&count=5`
    // );
    // const recentPlayedData = await recentPlayedResponse.json();
    res.json({
      UserData: steamUserData,
      GameData: steamGamesData,
      LevelData: steamLevelData,
      // RecentPlayData: recentPlayedData
    });
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

function parseAppData(js, appid) {
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
  var appid = req.query.appid;
  let appdata = readJson("appdata.json");
  try {
    var dataUpdated = false;
    if (!Array.isArray(appid)) {
      var temp = appid;
      appid = []
      appid.push(temp);
    }
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
          dataUpdated = true;
          return appdata[id];
        }
        if (respsjs == null) {
          console.log(`js null: ${id}`);
          appdata[id] = null;
          dataUpdated = true;
          return appdata[id];
        }
        appdata[id] = parseAppData(respsjs, id);
        dataUpdated = true;
        return appdata[id];
      })
    );
    if(dataUpdated) writeJson("appdata.json", appdata);
    res.json(resp);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

app.get("/achievementinfo", async (req, res) => {
  var appid = req.query.appid;
  const steamid = req.query.steamid;
  const apiKey = "CDB6562AD13D438878CDCF95AECC2879";
  let AchieveData = readJson("gameAchievementData.json");
  if (!Array.isArray(appid)){
    var temp = appid;
    appid = []
    appid.push(temp);
  }
  try {
    var dataUpdated = false;
    const resp = await Promise.all(
      appid.map(async (id) => {
        var data = {};
        if (id in AchieveData && AchieveData[id] != null) {
          // cache hit
          console.log(`achievedata hit ${id}`);
          data = AchieveData[id];
        } else {
          console.log(`achievedata miss ${id}`);
          const achieveDetailresps = await fetch(
            `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${id}&l=koreana`
          );
          const achievePercentresps = await fetch(
            `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${id}`
          );
          let detailjs = "";
          let percentjs = "";
          try {
            detailjs = await achieveDetailresps.json();
            percentjs = await achievePercentresps.json();
          } catch (err) {
            console.log(`Null achievedata response: ${id}`);
            AchieveData[id] = null;
            dataUpdated = true;
          }
          if (percentjs  == null || detailjs == null) {
            console.log(`achievedata js null: ${id}`);
            AchieveData[id] = null;
            dataUpdated = true;
          }
          else {
            AchieveData[id] = parseAchieveData(percentjs, detailjs, id);
          }
          dataUpdated = true;
          data = AchieveData[id];
        }
        var resp = {}; resp[id] = {};
        if(data == null) {return resp;}
        const playerAchieveDataresps = await fetch(
          `http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${id}&key=${apiKey}&steamid=${steamid}`
        );
        let playerjs = "";
        try {
          playerjs = await playerAchieveDataresps.json();
        } catch (err) {
          console.log(`Null playerachieve response: ${id}`);
        }
        if (playerjs  == null) {
          console.log(`playerachieve js null: ${id}`);
          return resp;
        }
        if(!playerjs.playerstats.success) {return resp;}
        resp = makeAchieveResponseData(resp, data, playerjs, id)
        return resp;
      })
    );
    if(dataUpdated) writeJson("gameAchievementData.json", AchieveData);
    res.json(resp)
    // res.json({"haha":"hello"});
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

function parseAchieveData(percentjs, detailjs, appid){
  var parsedjs = {};
  var achieves = detailjs?.game?.availableGameStats?.achievements;
  var percents = {}
  
  for (const acs of percentjs?.achievementpercentages?.achievements) {
    percents[acs.name] = acs.percent.toFixed(2);
  }
  if(achieves == null || percents == {}){
    console.log("AchieveData Error occured "+ appid)
    return null;
  }
  parsedjs.achievement = {}
  for (const a of achieves) {
    parsedjs.achievement[a.name] = {
      "name": a.displayName,
      "description": a.description,
      "icon": a.icon,
      "hidden": a.hidden,
      "percentage": percents[a.name]
    }
  }
  return parsedjs;
}

function makeAchieveResponseData(resp, data, playerdata, id){
  var fixeddata = {}
  resp[id].gamename = playerdata.playerstats.gameName;
  resp[id].achievements = []
  for (const dt of playerdata.playerstats.achievements) {
    fixeddata[dt.apiname] = dt;
  }
  
  for (const ac of Object.keys(fixeddata)) {
    if(fixeddata[ac].achieved == 1){
      var temp = data.achievement[ac]
      temp["unlocktime"] = fixeddata[ac].unlocktime;
      resp[id].achievements.push(temp);
    }
  }
  return resp;
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
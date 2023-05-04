import express from "express";
import fetch from "node-fetch"; // node-fetch는 require로 할 수 없음, import 사용
import path from 'path';
import { fileURLToPath } from 'url';
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
  res.sendFile(path.join(__dirname, 'index.html'));
  // res.send("Hello world");
});

app.get("/", (req, res) => {
  res.redirect('/home')
  // // res.sendFile(__dirname + '/steam.html');
  // res.send("Hello world!");
  // // res.send("Hello world");
});

// 스팀 API 호출
app.get("/steaminfo", async (req, res) => {
  const steamId = req.query.steamid;
  console.log('SteamId:'+steamId);
  const apiKey = "CDB6562AD13D438878CDCF95AECC2879";
  try {
    const steamUserResponse = await fetch(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`);
    const steamUserData = await steamUserResponse.json();

    const steamGamesResponse = await fetch(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&format=json`);
    const steamGamesData = await steamGamesResponse.json();
    
    res.json({
      UserData: steamUserData,
      GameData: steamGamesData
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

app.get("/appinfo", async(req,res) => {
  const appid = req.query.appid;
  try{
    //`http://store.steampowered.com/api/appdetails?appids=${appid}&filters=price_overview&format=json`
    const appdata = await fetch(`http://store.steampowered.com/api/appdetails?appids=${appid}&filters=price_overview`);
    if(appdata == null){
      console.log(`Null response: ${appid}`);
    }
    const appjsondata = await appdata.json();
    if(appjsondata == null){
      console.log(`Null response: ${appid}`);
    }
    console.log(appjsondata);
    // console.log(appdata);
    res.json(appjsondata);
  } catch(error){
    console.log(error);
    res.status(500).send("Server Error");
  }
})

app.get("/achivementinfo", async(req,res) => {
  const appid = req.query.appid;
  const steamid = req.query.steamid;
  const apiKey = "CDB6562AD13D438878CDCF95AECC2879";
  try{
    const achievedata = await fetch(`http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appid}&key=${apiKey}&steamid=${steamid}`);
    const achievejsondata = await achievedata.json();
    console.log(achievejsondata);
    res.json(achievejsondata);
  } catch(error){
    console.log(error);
    res.status(500).send("Server Error");
  }
})
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const domainname = "http://localhost:3000";
var playtimeDict = {};
var gameDataDict = {};
var appDataDict = {};
async function getSteamData(steamId) {
  // steamId = document.getElementById("steamid").value;
  try {
    const response = await fetch(`${domainname}/steaminfo?steamid=${steamId}`);
    const data = await response.json();
    console.log(data);
    return data;
    // document.getElementById("avatar").src = data.avatar;
    // document.getElementById("username").innerHTML = data.username;
    // document.getElementById("status").innerHTML = data.status;
    // const hours = Math.floor(data.playtime / 60);
    // const minutes = data.playtime % 60;
    // document.getElementById("playtime").innerHTML = `Total playtime: ${hours} hours and ${minutes} minutes`;
  } catch (error) {
    console.error(error);
  }
}

function clicktest() {
  console.log("clicked");
}

async function loadPage() {
  var steamId = "76561198818238819";
  const data = await getSteamData(steamId);
  const GameData = data.GameData.response.games;
  const UserData = data.UserData.response.players[0];
  console.log(data);
  getPlayTimeData(GameData, UserData);
  await getGameData(GameData);

  const appId = "374320";
  // const testappdata = await (await fetch(`http://localhost:3000/appinfo?appid=${appId}`)).json();
  // console.log(testappdata[appId]);
  // console.log(testappdata);

  const testachievedata = await (
    await fetch(
      `${domainname}/achivementinfo?appid=${appId}&steamid=${steamId}`
    )
  ).json();
  // console.log(testachievedata);
}

function getPlayTimeData(GameData, UserData) {
  const daysSinceCreated = Math.floor(
    (Date.now() - UserData.timecreated * 1000) / (1000 * 60 * 60 * 24)
  );
  playtimeDict["totalMinute"] = GameData.reduce(
    (total, game) => total + game.playtime_forever,
    0
  );
  playtimeDict["hour"] = (playtimeDict["totalMinute"] / 60).toFixed(1);
  playtimeDict["oneDayAvg"] = Math.floor(
    playtimeDict["totalMinute"] / daysSinceCreated
  );
  console.log("PlaytimeDict" + playtimeDict);
}

async function getGameData(GameData) {
  gameDataDict["OwnedGamesCount"] = GameData.length;
  gameDataDict["neverPlayedGamesCount"] = 0;
  await getAppData(GameData);
  GameData.forEach((game) => {
    if (game.playtime_forever == "0") gameDataDict["neverPlayedGamesCount"]++;
  });
  console.log(gameDataDict);
  console.log(gameDataDict["TotalInitialPrice"]);
  gameDataDict["PlayedGamesCount"] =
    gameDataDict["OwnedGamesCount"] - gameDataDict["neverPlayedGamesCount"];
  // gameDataDict['TotalPrice'] += getAppPrice('374320')
  console.log("GameDataDict" + gameDataDict);
}

async function getAppData(games) {
  var querystrings = [];
  const appNumToQueryAtOnce = 50;
  gameDataDict["FreeGameCount"] = 0;
  gameDataDict["UnknownGameCount"] = 0;
  gameDataDict["TotalInitialPrice"] = 0;

  console.log(games);
  // make keys for appDataDict
  games.forEach((game) => {
    appDataDict[game.appid] = "";
  });

  //#region testcode
  // test: small num of requests
  // querystrings.push(`${domainname}/appinfo?appid=374320`);
  // querystrings.push(`${domainname}/appinfo?appid=57300`);
  // querystrings.push(`${domainname}/appinfo?appid=391220`);

  // test: not small num of requests
  // for(let i = 0, querystring = `${domainname}/appinfo?`; i<101; i++){
  //   if((i != 0 && i% appNumToQueryAtOnce == 0) || i == 100){
  //     querystring += `appid=${games[i].appid}`
  //     querystrings.push(querystring);
  //     querystring = `${domainname}/appinfo?`;
  //   }
  //   else {
  //     querystring += `appid=${games[i].appid}&`;
  //   }
  // }
  //#endregion

  // make fetch urls of all owned games
  for (
    let i = 0, querystring = `${domainname}/appinfo?`;
    i < games.length;
    i++
  ) {
    if ((i != 0 && i % appNumToQueryAtOnce == 0) || i == games.length - 1) {
      querystring += `appid=${games[i].appid}`;
      querystrings.push(querystring);
      querystring = `${domainname}/appinfo?`;
    } else {
      querystring += `appid=${games[i].appid}&`;
    }
  }
  let rawdata = [];

  //#region asynch fetch test
  // // fetch appinfo of all owned games asynchronously
  // const rawdata= await Promise.all(querystrings.map(async url => {
  //     const resp = await fetch(url);
  //     return resp.json();
  //   }));
  // console.log(rawdata);
  //#endregion
  // fetch appinfo of all owned games synchronously
  for (const qstring of querystrings) {
    const rawres = await fetch(qstring);
    const jsres = await rawres.json();
    rawdata.push(jsres);
  }
  console.log(rawdata);

  for (const arr of rawdata) {
    if (!Array.isArray(arr)) {
      if (!arr.success) {
        // failed to get data from steam (maybe deleted game?)
        console.log(`Failed to get appinfo: ${arr.steam_appid}`);
        gameDataDict["UnknownGameCount"]++;
        continue;
      }
      if (arr.is_free) {
        // game is free
        console.log(`Free game: ${arr.steam_appid}`);
        gameDataDict["FreeGameCount"]++;
      } else if (it.price_overview != undefined) {
        gameDataDict["TotalInitialPrice"] += it.price_overview.initial;
      }
      appDataDict[arr.steam_appid] = arr;
      continue;
    }
    for (const it of arr) {
      if (!it.success) {
        console.log(`Failed to get appinfo: ${it}`);
        gameDataDict["UnknownGameCount"]++;
        continue;
      }
      if (it.is_free) {
        console.log(`Free game: ${it.steam_appid}`);
        gameDataDict["FreeGameCount"]++;
      } else if (it.price_overview != undefined) {
        gameDataDict["TotalInitialPrice"] += it.price_overview.initial;
      }
      appDataDict[it.steam_appid] = it;
    }
  }
  console.log(appDataDict);
  console.log(gameDataDict);
}

const domainname = "http://localhost:3000";
var playtimeDict = {
  totalMinute:0,
  hour: 0,
  oneDayAvg: 0,
};
var gameDataDict = {
  OwnedGamesCount:0,
  PlayedGamesCount: 0,
  neverPlayedGamesCount: 0,
  UnknownGameCount: 0,
  FreeGameCount:0,
  TotalInitialPrice: 0,
  TotalAchievements: 0,
  HiddenAchievements:0,
  RareAchievements: 0,
  AllCompletedGames: [],
};
var appDataDict = {};
var achievementsArray = [];
var genre_counts = {owned:{}, playtime:{}}
const steamid = "76561198818238819";
// loadPage();

function selectView(bttn){
  if(bttn.className == "button-view-selected") return;
  let willhidehtml = document.querySelector('.statistics-body-selected')
  let willshowhtml = document.querySelector(".statistics-body");
  let willnotpressedbutton = document.querySelector('.button-view-selected');
  let willpressedbutton = document.querySelector('.button-view')

  willhidehtml.classList.remove('statistics-body-selected')
  willhidehtml.classList.add('statistics-body')
  willshowhtml.classList.remove('statistics-body')
  willshowhtml.classList.add('statistics-body-selected')

  willnotpressedbutton.classList.remove('button-view-selected')
  willnotpressedbutton.classList.add('button-view')
  willpressedbutton.classList.remove('button-view')
  willpressedbutton.classList.add('button-view-selected')
}

async function getSteamData(steamId) {
  // steamId = document.getElementById("steamid").value;
  try {
    const response = await fetch(`${domainname}/steaminfo?steamid=${steamId}`);
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error(error);
  }
}

async function loadPage() {
  var steamId = steamid;
  const data = await getSteamData(steamId);
  const GameData = data.GameData.response.games;
  const UserData = data.UserData.response.players[0];
  const LevelData = data.LevelData.response;
  console.log(LevelData);
  console.log(data);
  generatePlayTimeData(GameData, UserData);
  await generateGameData(GameData);

  const appId = "374320";
  // const testappdata = await (await fetch(`http://localhost:3000/appinfo?appid=${appId}`)).json();
  // console.log(testappdata[appId]);
  // console.log(testappdata);

}

function generatePlayTimeData(GameData, UserData) {
  const daysSinceCreated = Math.floor(
    (Date.now() - UserData.timecreated * 1000) / (1000 * 60 * 60 * 24)
  );
  playtimeDict["totalMinute"] = GameData.reduce(
    (total, game) => total + game.playtime_forever
  );
  playtimeDict["hour"] = (playtimeDict["totalMinute"] / 60).toFixed(1);
  playtimeDict["oneDayAvg"] = Math.floor(
    playtimeDict["totalMinute"] / daysSinceCreated
  );
  console.log(playtimeDict);
}

async function generateGameData(GameData) {
  gameDataDict["OwnedGamesCount"] = GameData.length;

  await getAppData(GameData);
  
  // count genres
  for (const appid in appDataDict) {
    if(!appDataDict[appid].success) continue;
    var genres = appDataDict[appid].genres;
    // console.log(genres, appid);

    // if (!Array.isArray(genres)) {
    //   var temp = genres;genres = [];genres.push(temp);
    // }
    for (const genre of genres) {
      const genreName = genre.description;
      genre_counts['owned'][genreName] = (genre_counts['owned'][genreName] || 0) + 1;
    }
  }

  // count playtime per genre
  GameData.forEach((game) => {
    if(!appDataDict[game.appid].success) return;
    let gameGenres = appDataDict[game.appid].genres;
    gameGenres.forEach((genre) => {
        let genreName = genre.description;
        let playtime = game.playtime_forever;
        genre_counts['playtime'][genreName] = (genre_counts['playtime'][genreName] || 0) + playtime;
    });
  });

  console.log(genre_counts);

  var playedgames= [];
  GameData.forEach((game) => {
    if (game.playtime_forever == "0") gameDataDict["neverPlayedGamesCount"]++;
    else playedgames.push(game.appid);
  });
  gameDataDict["PlayedGamesCount"] =
    gameDataDict["OwnedGamesCount"] - gameDataDict["neverPlayedGamesCount"];

  await getAchievementData(playedgames); // get data only from played games



  console.log("GameDataDict" + gameDataDict);
}

async function getAppData(games) {
  var querystrings = [];
  const appNumToQueryAtOnce = 50;

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
      var temp = arr;
      arr = []
      arr.push(temp);
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

async function getAchievementData(games){
  var querystrings = [];
  var gamewithachievement =[];
  for (const id of games) {
    if("achievementnum" in appDataDict[id]){
      gamewithachievement.push(id);
    }
  }
  const appNumToQueryAtOnce = 50;

  for (let i = 0, querystring = `${domainname}/achievementinfo?`; i < 30;i++) {
    if ((i != 0 && i % appNumToQueryAtOnce == 0) || i == 29) {
      querystring += `appid=${gamewithachievement[i]}&steamid=${steamid}`;
      querystrings.push(querystring);
      querystring = `${domainname}/achievementinfo?`;
    } else {
      querystring += `appid=${gamewithachievement[i]}&`;
    }
  }

  // for (let i = 0, querystring = `${domainname}/achievementinfo?`; i < gamewithachievement.length;i++) {
  //   if ((i != 0 && i % appNumToQueryAtOnce == 0) || i == gamewithachievement.length - 1) {
  //     querystring += `appid=${gamewithachievement[i]}&steamid=${steamid}`;
  //     querystrings.push(querystring);
  //     querystring = `${domainname}/achievementinfo?`;
  //   } else {
  //     querystring += `appid=${gamewithachievement[i]}&`;
  //   }
  // }
  rawdata = []
  for (const qstring of querystrings) {
    const rawres = await fetch(qstring);
    const jsres = await rawres.json();
    rawdata.push(jsres);
  }
  console.log(rawdata);

  for (const arr of rawdata) {
    if (!Array.isArray(arr)) {
      var temp = arr;
      arr = []
      arr.push(temp);
    }
    for (const it of arr) {
      const achievements = it[Object.keys(it)[0]].achievements;
      appDataDict[Object.keys(it)[0]].achievednum = achievements.length;
      if(achievements.length>13 && achievements.length == appDataDict[Object.keys(it)[0]].achievementnum){
        gameDataDict["AllCompletedGames"].push(Object.keys(it)[0]);
      }
      for (const ac of achievements) {
        if(Number(ac.percentage) < 10.0) gameDataDict["RareAchievements"]++;
        if(ac.hidden)  gameDataDict["HiddenAchievements"]++;
        var temp = ac;
        ac.gamename = it[Object.keys(it)[0]].gamename;
        achievementsArray.push(temp);
      }
    }
  }
  gameDataDict["TotalAchievements"] = achievementsArray.length;
  achievementsArray.sort((a, b) => a.percentage - b.percentage); // 달성률에 따라 정렬
  console.log(achievementsArray);
  console.log(gameDataDict);
}

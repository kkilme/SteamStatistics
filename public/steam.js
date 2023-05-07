const domainname = "http://localhost:3000";
var DataDict = {
  OwnedGamesCount:0,
  PlayedGamesCount: 0,
  neverPlayedGamesCount: 0,
  UnknownGameCount: 0,
  FreeGameCount:0,
  TotalInitialPrice: 0,
  TotalPlayedPrice: 0,
  TotalDiscountedPrice: 0,
  TotalAchievements: 0,
  HiddenAchievements:0,
  RareAchievements: 0,
  AllCompletedGames: [],
  AchieveOver70:0,
  AvgAchievePercent: 0,
  totalMinute:0,
  totalHour: 0,
  oneDayAvg: 0,
  ptover100: 0,
  ptover50: 0,
  ptover10: 0
};
var UserDataDict = {}
var appDataDict = {};
var achievementsArray = [];
var genre_counts = {owned:{}, playtime:{}}
const steamid = "76561198818238819";
// const steamid = "76561198371255268";
loadPage();

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

async function loadPage() {
  var steamId = steamid;
  const data = await getSteamData(steamId);
  const GameData = data.GameData.response.games;
  UserDataDict = data.UserData.response.players[0];
  console.log(UserDataDict);

  for (const e of document.querySelectorAll('.username')) {
    e.innerHTML = UserDataDict['personaname'];
  }

  generatePlayTimeData(GameData, UserDataDict);
  await generateGameData(GameData);

  setHtml();
}

function setHtml(){
  document.getElementById('country').innerHTML = `국가: ${UserDataDict['loccountrycode']}`;
  var state = UserDataDict['personastate'] == 0?
   '<span style="color:red">Offline</span>' : '<span style="color:greenyellow">Online</span>'
  document.getElementById('status').innerHTML = `상태: ${state}`;
  document.getElementById('avatar-img').src = UserDataDict.avatarfull;
  document.getElementById('acc-created-date').innerHTML = UserDataDict['DateCreated']
  document.getElementById('acc-age').innerHTML = UserDataDict['AccountAge'] + 'y';
  for (const e of document.getElementsByName('owned-games')) {
    e.innerHTML = DataDict['OwnedGamesCount'].toLocaleString()+'개';
  }
  for (const e of document.getElementsByName('total-price')) {
    e.innerHTML = '₩ '+((Math.floor(DataDict['TotalInitialPrice']/100)).toLocaleString());
  }
  for (const e of document.getElementsByName('total-playtime')) {
    e.innerHTML = DataDict['totalHour'].toLocaleString()+'h';
  }
  for (const e of document.getElementsByName('total-achievements')) {
    e.innerHTML = DataDict['TotalAchievements'].toLocaleString() + ' 개';
  }

  document.getElementById('one-day-avg-playtime').innerHTML = (DataDict['totalHour'] / UserDataDict['daysSinceCreated']).toFixed(2) +'h';
  document.getElementById('one-game-avg-playtime').innerHTML = (DataDict['totalHour'] / DataDict['PlayedGamesCount']).toFixed(2) +'h';
  document.getElementById('playtime-over-100h').innerHTML = DataDict['ptover100']+'개';
  document.getElementById('playtime-over-50h').innerHTML = DataDict['ptover50']+'개';
  document.getElementById('playtime-over-10h').innerHTML = DataDict['ptover10']+'개';

  document.getElementById('played-games').innerHTML = DataDict['PlayedGamesCount']+'개'
  document.getElementById('free-games').innerHTML = DataDict['FreeGameCount']+'개'
  document.getElementById('total-final-price-owned').innerHTML = '₩ '+((Math.floor(DataDict['TotalDiscountedPrice']/100)).toLocaleString());
  document.getElementById('total-initial-price-played').innerHTML = '₩ '+((Math.floor(DataDict['TotalPlayedPrice']/100)).toLocaleString());

  setGenreTable();

  document.getElementById('rare-achievements').innerHTML = DataDict['RareAchievements'] +'개'
  document.getElementById('hidden-achievements').innerHTML = DataDict['HiddenAchievements'] +'개'
  document.getElementById('games-achievement-100').innerHTML = DataDict['AllCompletedGames'].length +'개'
  document.getElementById('games-achievement-70').innerHTML = DataDict['AchieveOver70'] +'개'
  document.getElementById('avg-achievement-percent').innerHTML = DataDict['AvgAchievePercent'] +'%'
}

function setGenreTable(){
  var tablehtml = ''
  const dictarr = Object.keys(genre_counts.playtime).map(key => [key, genre_counts.playtime[key]]);
  dictarr.sort((a, b) => b[1] - a[1]);

  for(let i =0;i<10;i++){
    var key =  dictarr[i][0];
    tablehtml += `<tr>
    <td>${key}</td>
    <td>${genre_counts.owned[key]}개</td>
    <td>${(genre_counts.playtime[key]/60).toFixed(1).toLocaleString()}h</td>
    </tr>`
  }

  document.querySelector('.genre-table tbody').innerHTML = tablehtml;
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


function generatePlayTimeData(GameData, UserData) {
  const createdate = new Date(UserData.timecreated * 1000);
  const createyear = createdate.getFullYear();
  const createmonth = createdate.getMonth() + 1;
  const createday = createdate.getDate();
  const daysSinceCreated = Math.floor(
    (Date.now() - createdate) / (1000 * 60 * 60 * 24)
  );
  UserDataDict['daysSinceCreated'] = daysSinceCreated;
  UserDataDict['AccountAge'] = (daysSinceCreated/365).toFixed(1);
  UserDataDict['DateCreated'] = `${createyear}-${createmonth}-${createday}`;
  for (const g of GameData) {
    DataDict["totalMinute"] += g.playtime_forever;
    if(g.playtime_forever >= 100*60){
      DataDict['ptover100']++;
    } else if (g.playtime_forever >= 50*60){
      DataDict['ptover50']++;
    } else if(g.playtime_forever >= 10*60){
      DataDict['ptover10']++;
    }
  }
  // DataDict["totalMinute"] = GameData.reduce(
  //   (total, game) =>  Number(total) + Number(game.playtime_forever)
  // );
  DataDict["totalHour"] = (DataDict["totalMinute"] / 60).toFixed(1);
  DataDict["oneDayAvg"] = Math.floor(
    DataDict["totalMinute"] / daysSinceCreated
  );
  console.log(DataDict);
}

async function generateGameData(GameData) {
  DataDict["OwnedGamesCount"] = GameData.length;

  await getAppData(GameData);
  
  // count genres
  for (const appid in appDataDict) {
    if(!appDataDict[appid].success) continue;
    var genres = appDataDict[appid].genres;
    for (const genre of genres) {
      const genreName = genre.description;
      genre_counts['owned'][genreName] = (genre_counts['owned'][genreName] || 0) + 1;
    }
  }

  DataDict['FreeGameCount'] = genre_counts['owned']['Free to Play'];

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

  var playedgames= [];
  GameData.forEach((game) => {
    if (game.playtime_forever != "0") {
      DataDict["PlayedGamesCount"]++;
      playedgames.push(game.appid);
    }
  });
  DataDict["neverPlayedGamesCount"] =
    DataDict["OwnedGamesCount"] - DataDict["PlayedGamesCount"];

  
  for (const id of playedgames) {
    if(!appDataDict[id].success) continue;
    if(appDataDict[id].is_free) continue;
    if(!appDataDict[id].price_overview) continue;
    DataDict['TotalPlayedPrice'] += appDataDict[id].price_overview.initial;
  }
  await getAchievementData(playedgames); // get data only from played games
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
        DataDict["UnknownGameCount"]++;
        continue;
      }
      if (!it.is_free && it.price_overview != undefined) {
        DataDict["TotalInitialPrice"] += it.price_overview.initial;
        DataDict['TotalDiscountedPrice']+=it.price_overview.final;
      }
      appDataDict[it.steam_appid] = it;
    }
  }
  console.log(appDataDict);
  console.log(DataDict);
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

  //#region make querystrings for test
  for (let i = 0, querystring = `${domainname}/achievementinfo?`; i < 10;i++) {
    if ((i != 0 && i % appNumToQueryAtOnce == 0) || i == 9) {
      querystring += `appid=${gamewithachievement[i]}&steamid=${steamid}`;
      querystrings.push(querystring);
      querystring = `${domainname}/achievementinfo?`;
    } else {
      querystring += `appid=${gamewithachievement[i]}&`;
    }
  }
  //#endregion

  // make querystrings for achievement data
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
  if('error' in rawdata){
    alert('Not public profile!');
  }
  for (const arr of rawdata) {
    if (!Array.isArray(arr)) {
      var temp = arr;
      arr = []
      arr.push(temp);
    }
    for (const it of arr) {
      const key = Object.keys(it)[0]
      const achievements = it[key].achievements;
      appDataDict[key].achievednum = achievements.length;
      appDataDict[key].achievementpercent = ((appDataDict[key].achievednum / appDataDict[key].achievementnum)*100).toFixed(2);
      if(achievements.length>5 && achievements.length == appDataDict[key].achievementnum){
        DataDict["AllCompletedGames"].push(key);
      } else if (achievements.length>5 && appDataDict[key].achievementpercent >= 70){
        DataDict['AchieveOver70']++;
      }
      for (const ac of achievements) {
        if(Number(ac.percentage) < 10.0) DataDict["RareAchievements"]++;
        if(ac.hidden)  DataDict["HiddenAchievements"]++;
        var temp = ac;
        ac.gamename = it[key].gamename;
        achievementsArray.push(temp);
      }
    }
  }
  DataDict["TotalAchievements"] = achievementsArray.length;

  let percentsum = 0;
  for (const id of gamewithachievement) {
    if(appDataDict[id].achievementpercent == undefined) continue
    percentsum += Number(appDataDict[id].achievementpercent);
  }
  DataDict['AvgAchievePercent'] = (percentsum/gamewithachievement.length).toFixed(2);
  achievementsArray.sort((a, b) => a.percentage - b.percentage); // 달성률에 따라 정렬
  console.log(achievementsArray);
  console.log(DataDict);
}

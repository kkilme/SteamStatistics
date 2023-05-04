const domainname = 'http://localhost:3000';
var playtimeDict = {}
var gameDataDict = {}
var appDataDict = {}
async function getSteamData(steamId){
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

async function loadPage(){
  var steamId = '76561198818238819';
  const data = await getSteamData(steamId);
  const GameData = data.GameData.response;
  const UserData = data.UserData.response.players[0];

  getPlayTimeData(GameData, UserData);
  getGameData(GameData);

  const appId = '374320';
  // const testappdata = await (await fetch(`http://localhost:3000/appinfo?appid=${appId}`)).json();
  // console.log(testappdata[appId]);
  // console.log(testappdata);

  const testachievedata = await (await fetch(`${domainname}/achivementinfo?appid=${appId}&steamid=${steamId}`)).json();
  // console.log(testachievedata);
}

function getPlayTimeData(GameData, UserData){
  const daysSinceCreated = Math.floor((Date.now() - UserData.timecreated * 1000) / (1000 * 60 * 60 * 24));
  playtimeDict['totalMinute']= GameData.games.reduce((total, game) => total + game.playtime_forever, 0);
  playtimeDict['hour'] = (playtimeDict['totalMinute'] / 60).toFixed(1);
  playtimeDict['oneDayAvg'] = Math.floor(playtimeDict['totalMinute'] / daysSinceCreated);
  console.log("PlaytimeDict"+playtimeDict);
}

async function getGameData(GameData){
  gameDataDict['OwnedGamesCount'] = GameData.games.length;
  gameDataDict['neverPlayedGamesCount'] = 0;
  gameDataDict['TotalPrice'] = await getTotalAppPrice(GameData.games);
  console.log(GameData.games)
  var i = 0;
  GameData.games.forEach(game => {
    if(game.playtime_forever == '0') gameDataDict['neverPlayedGamesCount']++;
  });
  console.log(gameDataDict)
  console.log(gameDataDict['TotalPrice'])
  gameDataDict['PlayedGamesCount'] = gameDataDict['OwnedGamesCount'] - gameDataDict['neverPlayedGamesCount'];
  // gameDataDict['TotalPrice'] += getAppPrice('374320')
  console.log("GameDataDict" + gameDataDict);
}

async function getTotalAppPrice(games){
  const promises = []
  var querystrings = []
  const appNumToQueryAtOnce = 50;
  gameDataDict['FreeGameCount'] = 0;
  gameDataDict['UnknownGameCount'] = 0;

  games.forEach(game => {
    appDataDict[game.appid] = '';
  })

  for(let i = 0, querystring = `${domainname}/appinfo?`; i<games.length; i++){
    if((i != 0 && i% appNumToQueryAtOnce == 0) || i == games.length-1){
      querystring += `appid=${games[i].appid}`
      querystrings.push(querystring);
      querystring = `${domainname}/appinfo?`;
    }
    else {
      querystring += `appid=${games[i].appid}&`;
    }
  }

  for (const quer of querystrings) {
    promises.push(fetch(quer));
  }
  const rest = await Promise.all(promises);
  promises.length = 0;
  i = 0
  games.forEach(game => {
    i++;
    if(i>2) return;
    promises.push(fetch(`${domainname}/appinfo?appid=${game.appid}`))
  })
  const res = await Promise.all(promises);
  promises.length = 0; // clear array
  res.forEach(r => {
    promises.push(r.json())
  })
  const result = await Promise.all(promises);
  var pricedict = {}
  console.log(result);
  result.forEach(r => { // r[Object.keys(r)[0]]: 특정 앱의 정보 (element: success 여부, price_overview)
    var data = r[Object.keys(r)[0]]
    console.log(data)
    if (!data.success) {
      console.log(`Failed to get appinfo: ${Object.keys(r)[0]}`);
      gameDataDict['UnknownGameCount']++;
      return;
    }
    if (data.data.length == 0) {
      console.log(`Free game: ${Object.keys(r)[0]}`);
      gameDataDict['FreeGameCount']++;
      return;
    }
    pricedict[Object.keys(r)[0]] = data.data;
  })
  var totalprice = 0;
  Object.values(pricedict).forEach(data => {
    console.log(data);
    totalprice += data.price_overview.final;
    console.log(data.price_overview.final);
  })
  return totalprice;
}
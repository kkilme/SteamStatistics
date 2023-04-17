async function getSteamData() {
  // steamId = document.getElementById("steamid").value;
  steamId = '76561198818238819';
  try {
    const response = await fetch(
      `http://localhost:3000/steaminfo?steamid=${steamId}`
    );
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
  const data = await getSteamData();
  const GameData = data.GameData.response;
  const UserData = data.UserData.response.players[0];

  const playtimeData = getPlayTimeData(GameData, UserData);
  const gameData = getGameData(GameData);

  const appId = 374320;
  const testappdata = await fetch(`http://localhost:3000/appinfo?appid=${appId}`)
  const testappdatajson = await testappdata.json();
  console.log(testappdatajson);

  const steamId = '76561198818238819';
  const testachievedata = await fetch(`http://localhost:3000/achivementinfo?appid=${appId}&steamid=${steamId}`)
  const testachievedatajson = await testachievedata.json();
  console.log(testachievedatajson);
}

function getPlayTimeData(GameData, UserData){
  var playtimeDict = {}
  const daysSinceCreated = Math.floor((Date.now() - UserData.timecreated * 1000) / (1000 * 60 * 60 * 24));
  playtimeDict['totalMinute']= GameData.games.reduce((total, game) => total + game.playtime_forever, 0);
  playtimeDict['hour'] = (playtimeDict['totalMinute'] / 60).toFixed(1);
  playtimeDict['oneDayAvg'] = Math.floor(playtimeDict['totalMinute'] / daysSinceCreated);
  console.log("PlaytimeDict"+playtimeDict);
  return playtimeDict;
}

function getGameData(GameData){
  var gameDataDict = {}
  gameDataDict['OwnedGameCount'] = GameData.games.length;
  gameDataDict['neverPlayedGamesCount'] = 0
  for (const game in GameData.games){
    if(game.playtime_forever == 0) playtimeDict['neverPlayedGamesCount']++;
  }
  gameDataDict['PlayedGamesCount'] = gameDataDict['OwnedGameCount'] - gameDataDict['neverPlayedGamesCount'];
  console.log("GameDataDict" + gameDataDict);
}
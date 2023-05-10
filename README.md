# <center>Steam <font color="rgb(102, 192, 244)">Statistics</font></center>
## **<center>Steam 유저의 다양한 게임 통계를 볼 수 있는 웹사이트</center>**


## 목차
- [**웹사이트 소개**](#웹사이트-소개)
- [**사이트 구성**](#사이트-구성)
  - [Home](#1-home)
  - [Statistics](#2-profile)
    - [Profile Summary](#2-1-profile-summary)
    - [View Mode Switch](#2-2-view-mode-switch)
    - [Detailed Game Statistics](#2-3-detailed-game-statistics)
    - [Game Genres](#2-4-game-genres)
    - [Most Played Games](#2-5-most-played-games)
    - [Detailed Achievement Statistics](#2-6-detailed-achievement-statistics)
    - [100% Achievement Games](#2-7-100-achievement-games)
  - [Help](#3-help)
- [**예외 처리**](#예외-처리)
  - [유효하지 않은 SteamID / 비공개 프로필](#1-유효하지-않은-steamid--비공개-프로필)
  - [완전한 공개가 아닌 프로필](#2-완전한-공개가-아닌-프로필)
  - [통계가 존재하지 않을 경우](#3-통계가-존재하지-않을-경우)
- [**내부 구현 설명**](#내부-구현-설명)
  - [기본 흐름](#기본-흐름)
  - [Steam.js 함수 설명](#steamjs-함수-설명)
  - [사용한 API](#사용한-api)
  - [비동기 fetch 및 json파일(cache)활용](#비동기-fetch-및-json파일cache활용)
    - [비동기 fetch](#1-비동기-fetch)
    - [Cache 활용](#2-json파일을-캐쉬로-활용)
# **<center>웹사이트 소개</center>**
- **Steam Web API** 사용
  - Steam이 공식적으로 제공하는 [Web API](https://partner.steamgames.com/doc/webapi)를 이용하여 스팀 유저의 데이터를 가져옴.
  
- **Express** 를 이용한 웹서버 사용
  - COPR policy로 인해 클라이언트에서 직접적으로 API 요청시 거부되어 웹서버 사용은 필수
  - 웹 개발은 처음이기 때문에, 수업시간에 다뤄 조금이나마 더 익숙한 Express로 구현
  
- **Json** 파일을 이용하여 데이터 저장 (서버의 캐쉬로 활용)
  - 유저가 보유한 게임마다 API를 여러번 호출하기 때문에, 수백개의 게임을 보유했을 경우 API도 수백번 호출됨.
  - 이로 인해 웹사이트의 로딩 속도가 느려지며, 속도 측면이 아니더라도 단시간에 너무 많은 API를 요청하는 것은 바람직하지 못하다고 생각하여 json 파일을 만들어 캐쉬로 활용.
  - appdata.json과 gameAchievementData.json에 게임의 정보 및 도전과제 정보를 저장하고, 이를 통해 캐쉬 hit 또는 miss를 판단하여 API를 요청하도록 함.

# **<center>사이트 구성</center>**
## <center>**1. Home**</center>
![Home](https://github.com/kkilme/kkilme.github.io/assets/80762534/3bd6debd-9126-4785-8e3c-251d7b8ae353)
구글의 홈 화면을 참고하여 심플하게 구성하였다. 검색창에 SteamID를 입력한 후 검색버튼을 누르거나 엔터를 입력하면, 해당 유저의 통계 사이트로 이동한다. <br>검색창 밑에는 Tip을 작성하여 페이지를 처음 이용하는 사람에게 조금이나마 도움을 주고자 하였다.
## <center>**2. Statistics**</center>
![profile_main](https://github.com/kkilme/kkilme.github.io/assets/80762534/45b1a923-6324-4b7c-8983-9bf246239f6f)
본 웹사이트의 핵심인 스팀 유저의 통계를 보여준다. 홈화면에서 검색창에 입력한 steamid를 쿼리값으로 하여 웹서버에 데이터를 요청한다.
### **2-1. Profile Summary**
![profile_summary](https://github.com/kkilme/kkilme.github.io/assets/80762534/7fb83159-c541-463e-af09-eb3e054153cc)
유저의 대표적인 통계들을 한눈에 제공한다. 이 프로필 카드만 봐도 유저의 전체적인 통계를 알 수 있다.

### **2-2. View Mode Switch**
![ViewTab](https://github.com/kkilme/kkilme.github.io/assets/80762534/bfe4d96c-b5ab-40f3-851f-7563e75630a8)
제공하는 통계가 한 페이지에 모두 표시하기에는 너무 많기 때문에, 통계를 두 분류로 나눴다. 다음과 같이 info.html의 다음 두 클래스와 css를 이용하여, 페이지 로딩 없이 즉시 내용이 변경되도록 하였다.
```html
<div class="statistics-body-selected"> ... </div>
<div class="statistics-body"> ... </div>
``` 
```css
.statistics-body{
  display: none;
}
``` 

### **2-3. Detailed Game Statistics**
![profile_games](https://github.com/kkilme/kkilme.github.io/assets/80762534/8b52f40e-7e66-4617-9664-29b1cf70035e)
유저의 게임 플레이 시간과 보유한 게임에 관한 상세한 통계를 제공한다.

### **2-4. Game Genres**
![profile_genres](https://github.com/kkilme/kkilme.github.io/assets/80762534/620c4166-9a12-4cbe-90a3-5b66ab15219a)
보유한 게임의 장르별로 보유 수 및 플레이 시간에 대한 정보를 테이블로 제공한다. 총 플레이 시간을 기준으로 10개까지만 표시한다. 

### **2-5. Most Played Games**
![profile_mostplayed](https://github.com/kkilme/kkilme.github.io/assets/80762534/f157eab1-8f78-40e5-adfa-82f74085b1dd)
유저의 게임 플레이 시간을 기준으로 상위 15개의 게임에 대한 정보를 보여준다.

### **2-6. Detailed Achievement Statistics**
![profile_achievements](https://github.com/kkilme/kkilme.github.io/assets/80762534/46ac8640-0293-4220-9058-442b0ba82f87)
유저의 도전과제 달성 현황에 관한 자세한 통계를 제공한다.

### **2-7. 100% Achievement Games**
![profile_achievement100](https://github.com/kkilme/kkilme.github.io/assets/80762534/91de4960-c59e-4222-b0c1-683e756c56ef)
유저가 도전과제를 100% 달성한 게임들을 보여준다.

## <center>**3. Help**</center>
![help](https://github.com/kkilme/kkilme.github.io/assets/80762534/0956066c-ff35-4cce-9e6d-3c03e40a7ab8)
본 웹사이트를 이용하면서 필요할 수 있는 도움말이 적힌 페이지이다. SteamID를 알아내는 법과, 자신의 프로필을 공개로 설정하는 방법이 사진과 함께 서술되어 있다. 양이 많지 않기 때문에 따로 Nav를 두진 않았다.

# **<center>예외 처리</center>**
입력한 SteamID와 유저에 따라서 다양한 예외 상황이 발생할 수 있다. 많은 SteamID들로 테스트를 진행하며 처리한 예외들을 소개한다.
## 1. **유효하지 않은 SteamID / 비공개 프로필**
![wrong_steamid](https://github.com/kkilme/kkilme.github.io/assets/80762534/6e829970-d082-45d2-bab5-111a5f15f24e)
![private_profile](https://github.com/kkilme/kkilme.github.io/assets/80762534/9babe5a6-2d84-4a90-8b5d-1363fed7e0ba)
존재하지 않는 SteamID를 검색했을 경우와, 유저가 자신의 스팀 프로필을 비공개로 설정해 놓았을 경우이다. 이 경우 위와 같이 오류 문구를 보여주고, 프로필은 표시되지 않는다.

## **2. 완전한 공개가 아닌 프로필**
![half_public](https://github.com/kkilme/kkilme.github.io/assets/80762534/51891e16-732c-4960-90bb-63c21e0e0886)
유저가 스팀 프로필은 공개로 해두었지만, 자신의 게임 데이터는 비공개로 설정해 둔 경우이다. 이 경우 오류 문구와 함께 접근 가능한 통계는 표시하지만, 도전과제에 관한 통계는 제공되지 않는다. 
<br><br>한편, 위와 같이 유저가 자신의 아바타나 국적을 설정하지 않았을 경우에도 정상적으로 Default값이 출력되도록 하였다.

## **3. 통계가 존재하지 않을 경우**
![no_100_game](https://github.com/kkilme/kkilme.github.io/assets/80762534/d802fc17-2cd0-4236-bb9f-1237f5c43e5b)
통계에 해당하는 데이터가 없을 경우 출력될 Default값을 설정해주었다.

# **<center>내부 구현 설명</center>**
## <center>기본 흐름</center>
자바스크립트를 이용한 내부 로직은 클라이언트측의 **steam.js**와 **index.js**로 구현되어있다. steam.js에는 다음과 같이 다양한 Dictionary가 존재한다.
```javascript
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
var GameDataDict = {}
var achievementsArray = [];
var genre_counts = {owned:{}, playtime:{}}
```
steam.js는 서버에 fetch()를 진행하여, 데이터를 받아와서 위의 Dictionary들을 채운다. 최종적으로 위 딕셔너리들을 이용하여 info.html을 채우는 구조이다.

## <center>Steam.js 함수 설명</center>

### 1.
```javascript
async function loadPage() 
```
info.html 로딩 시 가장 먼저 실행되는 함수이며, 코드의 전체적인 흐름을 제어한다. main()의 역할이다.

### 2.
```javascript
async function getSteamData()
```
steamid를 이용하여 유저의 가장 기본적인 정보를 웹서버에 요청하여 받아온다. 이 데이터를 이용해 GameDataDict와 UserDataDict가 완성된다.

### 3.
```javascript
function generatePlayTimeData(GameData, UserData)
```
플레이시간 관련 통계를 계산하여 딕셔너리에 저장한다.

### 4.
```javascript
async function generateGameData(GameData)
```
통계를 계산하는 핵심 함수이다. 웹사이트가 제공하는 거의 모든 통계를 계산하여 저장한다.
### 5.
```javascript
async function getAppData(games)
```
유저가 보유한 게임 하나 하나의 정보를 받아오는 함수이다. generateGameData()내부에서 호출되어 appDataDict를 채운다.
### 6.
```javascript
async function getAchievementData(games)
```
유저가 보유한 게임 하나 하나의 도전과제에 관한 정보를 받아오는 함수이다. generateGameData()내부에서 호출되어 여러 통계를 계산하고 저장한다.
### 7.
```javascript
function setBasicDataHtml()
```
도전과제를 제외한 통계에 대해 html 코드를 생성 및 반영한다.
### 8.
```javascript
function setAchievementHtml()
```
도전과제에 관한 통계에 대해 html 코드를 생성 및 반영한다.
### 9.
```javascript
function setGenreTable()
```
장르별 통계를 제공하는 테이블의 html코드를 생성 및 반영한다.
### 10.
```javascript
function setMostPlayedTable()
```
가장 많이 플레이한 15개의 게임에 관한 html코드를 생성 및 반영한다.
### 11.
```javascript
function setErrorPage(errortype)
```
errortype에 맞춰 적절히 에러 문구를 생성하고 html에 반영한다.

### 12.
```javascript
function selectView(bttn)
```
View Mode Switch의 버튼 클릭 시 호출되는 함수이다. html의 클래스를 서로 맞바꾸어 선택한 분야의 통계가 페이지에 보이도록 한다.

## <center>사용한 API</center>
index.js에서 사용한 Steam API들이다. **주요 API들의 응답 형식은 responseExample.txt에 기록되어 있다.**
```javascript
`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`
```
유저의 닉네임, 국적, 아바타 등 프로필의 기본 정보를 받아온다.
```javascript
`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${apiKey}&vanityurl=${steamId}`
```
검색창에 입력한 steamid가 유저의 커스텀 id일 경우, 해당 커스텀 id에 대응되는 진짜 steamid를 받아온다.

```javascript
`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}`
```
유저가 보유한 게임과 게임별 플레이시간 등이 포함된 정보를 받아온다.

```javascript
`http://store.steampowered.com/api/appdetails?appids=${id}&cc=KR`
```
특정 게임에 대한 상세한 정보를 받아온다.

```javascript
 `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${id}&l=koreana`
 ```
 특정 게임이 가지고 있는 도전과제에 대한 정보를 받아온다.

 ```javascript
`https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${id}`
 ```
 특정 게임이 가지고 있는 도전과제의 글로벌 달성 비율에 대한 정보를 받아온다.

 ```javascript
 `http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${id}&key=${apiKey}&steamid=${steamid}`
 ```
 특정 유저가, 특정 게임에서 달성한 도전과제에 관한 정보를 받아온다. 유저가 그 게임의 어떤 도전과제를 달성했는지, 또는 달성하지 못했는지 등을 알 수 있다.

 ## <center>비동기 fetch 및 json파일(cache)활용</center>
 위에 서술한것과 같이, 여러 API를 사용했으며 몇몇 API들은 유저가 보유한 게임마다 호출해야 한다. 따라서 수백개의 게임을 보유한 유저라면 데이터를 받아오는 데 너무나 오랜 시간이 걸리게 된다. 이를 해결하고자 다음과 같은 방법을 사용했다.

 ### 1. 비동기 fetch
 게임 a와 b가 있을 때, 단순한 반복문으로 두 게임의 데이터를 받아오면 a를 받아온 이후에 b를 받아오기 때문에 시간이 매우 오래 걸린다. 이는 a와 b에 대한 데이터를 동시에, 즉 비동기적으로 받아오면 해결된다. 이를 위해 Promise.all을 활용했다.
 ```javascript
 app.get("/achievementinfo", async (req, res) => {
  var appid = req.query.appid;
  ...
 const resp = await Promise.all(
      appid.map(async (id) => {
        ...
        const achieveDetailresps = await fetch(
            `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${id}&l=koreana`
          );
        ...
        resp = makeAchieveResponseData(resp, data, playerjs, id)
        return resp;
      })
    );
    ...
 }
```
위와 같이 Promise.all을 사용하면, appid라는 배열에 있는 모든 값에 대해 동시에 fetch를 진행하여, 모든 fetch가 완료되면 resp이라는 값이 완성되게 된다. 병렬적으로 fetch가 진행되므로 시간은 사실상 한 게임의 데이터를 받아오는 시간과 비슷하게 소요된다.

 ### 2. json파일을 캐쉬로 활용
 비동기 fetch로 소요 시간을 단축했지만, 여전히 API를 수백 번 요청하는 것은 달라지지 않았고 이는 바람직하지 못하다고 생각했다. 특히, 특정 게임의 정보를 받아오는 `http://store.steampowered.com/api/appdetails?appids=${id}&cc=KR` API는 스팀 공식 문서에는 없는 특이한 API인데, 이 API를 단시간에 너무 많이 요청할 시 응답으로 403 Forbidden이 왔기 때문에, API 호출 횟수를 줄이는 것은 필수적이였다. 그래서 거의 변하지 않는 데이터인 게임 정보나 게임의 도전과제 정보는 json파일에 저장하기로 하였다
```javascript
 app.get("/achievementinfo", async (req, res) => {
  var appid = req.query.appid;
  let AchieveData = readJson("gameAchievementData.json");
  ...
    const resp = await Promise.all(
      appid.map(async (id) => {
        var data = {};
        if (id in AchieveData && AchieveData[id] != null) {
          // cache hit
          data = AchieveData[id];
        } else { // cache miss
          const achieveDetailresps = await fetch(
            `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${id}&l=koreana`
          );
        ...
        }
      }
    if(dataUpdated) writeJson("gameAchievementData.json", AchieveData);
}
```
appdata.json과 gameAchievementData.json엔 게임 데이터, 게임의 도전과제 데이터가 저장되어 있다. 물론 이 데이터들이 영원히 변하지 않는 것은 아니다. 게임이 업데이트 되면 이 데이터들은 충분히 변할 수 있다. 이를 해결하기 위해선 각 캐쉬 엔트리별로 수명을 두어서 수명이 다하면 다시 값을 업데이트하는 방법이 있겠지만, 현재 이것까지는 구현하지 않았다.
async function getSteamInfo() {
  steamId = document.getElementById("steamid").value;

  try {
    const response = await fetch(
      `http://localhost:3000/steaminfo?steamid=${steamId}`
    );
    const data = await response.json();

    // document.getElementById("avatar").src = data.avatar;
    // document.getElementById("username").innerHTML = data.username;
    // document.getElementById("status").innerHTML = data.status;
    console.log(data);
    document.getElementById("avatar").src = data.avatar;
    document.getElementById("username").innerHTML = data.username;
    document.getElementById("status").innerHTML = data.status;
    const hours = Math.floor(data.playtime / 60);
    const minutes = data.playtime % 60;
    document.getElementById("playtime").innerHTML = `Total playtime: ${hours} hours and ${minutes} minutes`;
  } catch (error) {
    console.error(error);
  }
}

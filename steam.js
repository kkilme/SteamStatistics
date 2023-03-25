async function getSteamInfo() {
  steamId = document.getElementById("steamid").value;

  try {
    const response = await fetch(
      `http://localhost:3000/steaminfo?steamid=${steamId}`
    );
    const data = await response.json();

    document.getElementById("avatar").src = data.avatar;
    document.getElementById("username").innerHTML = data.username;
    document.getElementById("status").innerHTML = data.status;
  } catch (error) {
    console.error(error);
  }
}

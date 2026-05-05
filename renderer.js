import mlbTeams from "./mlb_teams.js";

window.electronAPI.onUpdateUI((event, isTop) => {
  const widget = document.getElementById('game-widget');

  if (isTop) {
    widget.classList.add('always-on-top');
  } else {
    widget.classList.remove('always-on-top');
  }
});


let allGames = [];
let selectedGame = null;
let userHasSelectedGame = false;

async function loadAllGames() {
  try {
    const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard");
    const data = await res.json();
    
    allGames = data.events || [];
    populateGameDropdown();
    
    // Only default to Red Sox if user hasn't manually selected a game
    if (!userHasSelectedGame) {
      const redSoxGame = allGames.find(event =>
        event.competitions[0].competitors.some(team =>
          team.team.displayName.includes("Red Sox")
        )
      );
      
      if (redSoxGame) {
        selectedGame = redSoxGame;
        document.getElementById("game-title").value = redSoxGame.id;
      } else if (allGames.length > 0) {
        selectedGame = allGames[0];
        document.getElementById("game-title").value = allGames[0].id;
      }
    } else {
      // User has selected a game, maintain their selection
      const currentGameId = document.getElementById("game-title").value;
      const foundGame = allGames.find(game => game.id === currentGameId);
      if (foundGame) {
        selectedGame = foundGame;
        // Keep the same selection in the dropdown
        document.getElementById("game-title").value = currentGameId;
      }
      // If selected game no longer exists, keep the old selectedGame until user chooses new one
    }
    
    if (selectedGame) {
      displaySelectedGame();
    }

  } catch (error) {
    console.error("Error fetching games:", error);
    document.getElementById("game-title").innerHTML = '<option value="">Error loading games</option>';
    document.getElementById("game-update").textContent = "Unable to connect to MLB API. Please check your internet connection.";
  }
}

function populateGameDropdown() {
  const selector = document.getElementById("game-title");
  
  if (allGames.length === 0) {
    selector.innerHTML = '<option value="">No games today</option>';
    return;
  }
  
  selector.innerHTML = allGames.map(game => {
    const competition = game.competitions[0];
    const home = competition.competitors.find(team => team.homeAway === "home");
    const away = competition.competitors.find(team => team.homeAway === "away");
    const gameType = game.season.type === 3 ? 'MLB Playoffs' : 'MLB';
    const gameTitle = `${gameType} • ${away.team.displayName} at ${home.team.displayName}`;
    
    return `<option value="${game.id}">${gameTitle}</option>`;
  }).join('');
  
  // Add event listener after populating dropdown
  setupEventListener();
}

function setupEventListener() {
  const selector = document.getElementById("game-title");
  // Remove any existing listener to avoid duplicates
  selector.removeEventListener("change", handleGameSelection);
  // Add the event listener
  selector.addEventListener("change", handleGameSelection);
}

function handleGameSelection(event) {
  const gameId = event.target.value;
  selectedGame = allGames.find(game => game.id === gameId);
  userHasSelectedGame = true; // Mark that user has made a selection
  if (selectedGame) {
    displaySelectedGame();
  }
}

function displaySelectedGame() {
  if (!selectedGame) return;

  const competition = selectedGame.competitions[0];
  const competitors = competition.competitors;
  const home = competitors.find(team => team.homeAway === "home");
  const away = competitors.find(team => team.homeAway === "away");
  const status = selectedGame.status.type.shortDetail;

    // Update away team
    const awayTeamData = mlbTeams.get(away.team.abbreviation);
    const awayLogo = document.querySelector("#away-team .team-logo");
    if (awayTeamData) {
      awayLogo.src = awayTeamData.logo;
      awayLogo.alt = awayTeamData.name;
    }
    document.querySelector("#away-team .team-score").textContent = away.score || "0";
    document.querySelector("#away-team .team-name").textContent = away.team.shortDisplayName;

    // Update home team  
    const homeTeamData = mlbTeams.get(home.team.abbreviation);
    const homeLogo = document.querySelector("#home-team .team-logo");
    if (homeTeamData) {
      homeLogo.src = homeTeamData.logo;
      homeLogo.alt = homeTeamData.name;
    }
    document.querySelector("#home-team .team-score").textContent = home.score || "0";
    document.querySelector("#home-team .team-name").textContent = home.team.shortDisplayName;

    // Update game status
    const situation = competition.situation;
    let inningStatus = "";
    if (situation) {
      const topBottom = status.toLowerCase().includes("top") ? "▲" : "▼";
      const inning = status.split(" ")[1]
      const balls = situation.balls || 0;
      const strikes = situation.strikes || 0;
      inningStatus = `${topBottom} ${inning} • ${balls}-${strikes}`;
      
      // Update bases
      updateBases(situation);
      // Update outs
      updateOuts(situation.outs || 0);
    } else {
      inningStatus = status;
      // Clear bases and outs if no situation data
      clearBases();
      clearOuts();
    }
    document.querySelector(".inning-count").textContent = inningStatus;

    // Update game info
    let gameUpdate = "";
    if (status.toLowerCase().includes("final") && competition.headlines && competition.headlines.length > 0) {
      gameUpdate = competition.headlines[0].shortLinkText || status;
    } else if (situation && situation.lastPlay) {
      gameUpdate = situation.lastPlay.text || status;
    } else if (home.probables && away.probables && home.probables[0] && away.probables[0]) {
      const homePitcher = home.probables[0].athlete.displayName;
      const awayPitcher = away.probables[0].athlete.displayName;
      gameUpdate = `${awayPitcher} vs. ${homePitcher}`;
    } else {
      gameUpdate = status;
    }
  document.getElementById("game-update").textContent = gameUpdate;
}

function updateBases(situation) {
  // Clear all bases first
  clearBases();
  
  if (situation.onFirst) {
    document.getElementById("base-1").classList.add("occupied");
  }
  if (situation.onSecond) {
    document.getElementById("base-2").classList.add("occupied");
  }
  if (situation.onThird) {
    document.getElementById("base-3").classList.add("occupied");
  }
}

function clearBases() {
  document.getElementById("base-1").classList.remove("occupied");
  document.getElementById("base-2").classList.remove("occupied");
  document.getElementById("base-3").classList.remove("occupied");
}

function updateOuts(outs) {
  // Clear all outs first
  clearOuts();
  
  // Fill outs based on count
  for (let i = 1; i <= outs && i <= 3; i++) {
    document.getElementById(`out-${i}`).classList.add("filled");
  }
}

function clearOuts() {
  document.getElementById("out-1").classList.remove("filled");
  document.getElementById("out-2").classList.remove("filled");
  document.getElementById("out-3").classList.remove("filled");
}

async function updateSelectedGame() {
  if (!selectedGame) return;
  
  try {
    const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard");
    const data = await res.json();
    
    // Find the currently selected game in the updated data
    const updatedGame = data.events.find(game => game.id === selectedGame.id);
    
    if (updatedGame) {
      // Update the selected game with fresh data
      selectedGame = updatedGame;
      // Update the display with new data
      displaySelectedGame();
    } else {
      // Selected game no longer exists in API, keep showing last known data
      console.log("Selected game not found in update, keeping last known data");
    }
    
  } catch (error) {
    console.error("Error updating game data:", error);
    // Keep showing last known data on error
  }
}

// Initial load
loadAllGames();

// Update selected game every 30 seconds
setInterval(updateSelectedGame, 30000);

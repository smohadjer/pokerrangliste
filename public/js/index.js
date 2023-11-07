// public/ts/lib/utils.ts
Handlebars.registerHelper("inc", function(value, options) {
  return parseInt(value) + 1;
});
Handlebars.registerHelper("ifEquals", function(arg1, arg2, options) {
  return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});
var players = [];
var container = document.getElementById("results");
var getPoints = (player, tournament) => {
  const rebuys = player.rebuys * tournament.buyin;
  const prize = getPrize(player, tournament);
  const bounty = getBounty(player, tournament);
  const points = prize + bounty - tournament.buyin - rebuys;
  return points;
};
var getRebuys = (tournament) => {
  let rebuys = 0;
  tournament.players.forEach((player) => {
    rebuys += player.rebuys;
  });
  return rebuys;
};
var getPrize = (player, tournament) => {
  const prize = player.ranking <= tournament.prizes.length ? tournament.prizes[player.ranking - 1] : 0;
  return prize;
};
var getBounty = (player, tournament) => {
  if (!tournament.bounties) {
    return 0;
  }
  const bountyWinner = tournament.bounties.find((item) => item.name === player.name);
  return bountyWinner ? bountyWinner.prize : 0;
};
var updatePlayer = (player, clone) => {
  player.points += clone.points;
  player.bounty += clone.bounty;
  player.prize += clone.prize;
  player.rebuys += clone.rebuys;
  player.games += clone.games;
};
var addPlayers = (tournament) => {
  tournament.players.forEach((item) => {
    const clone = { ...item };
    clone.points = getPoints(clone, tournament);
    clone.bounty = getBounty(clone, tournament);
    clone.prize = getPrize(clone, tournament);
    clone.games = 1;
    const foundPlayer = players.find((player) => player.name === clone.name);
    if (foundPlayer) {
      updatePlayer(foundPlayer, clone);
    } else {
      players.push(clone);
    }
  });
};
var setPlayers = (data) => {
  if (players.length === 0) {
    data.forEach((tournament) => {
      addPlayers(tournament);
    });
    players.sort((item1, item2) => {
      return item2.points - item1.points;
    });
  }
};
var getHTML = async (templateFile, data) => {
  const response = await fetch(templateFile);
  const responseText = await response.text();
  const template = Handlebars.compile(responseText);
  const html = template(data);
  return html;
};
var render = async (templateFile, data, container2) => {
  const html = await getHTML(templateFile, data);
  container2.innerHTML = html;
  container2.classList.remove("empty");
};
var sortByDate = (data) => {
  const sortedData = structuredClone(data);
  sortedData.sort((item1, item2) => {
    const date1 = new Date(item1.date).valueOf();
    const date2 = new Date(item2.date).valueOf();
    return date2 - date1;
  });
  return sortedData;
};
var renderPage = (options) => {
  const data = options.data;
  const view = options.view;
  const playerId = options.player_id;
  const seasonId2 = options.season_id;
  const seasonName = options.season_name;
  if (view === "ranking") {
    players.length = 0;
    setPlayers(data);
    render("hbs/ranking.hbs", {
      players,
      season_id: seasonId2
    }, container);
  }
  if (view === "tournament") {
    data[0].players.sort((item1, item2) => {
      return item1.ranking - item2.ranking;
    });
    const players2 = data[0].players.map((player) => {
      player.prize = getPrize(player, data[0]);
      player.bounty = getBounty(player, data[0]);
      player.points = getPoints(player, data[0]);
      return player;
    });
    render("hbs/tournament.hbs", {
      date: data[0].date,
      playersCount: data[0].players.length,
      buyin: data[0].buyin,
      rebuys: getRebuys(data[0]),
      players: players2,
      season_id: seasonId2
    }, container);
  }
  if (view === "tournaments") {
    const sortedData = sortByDate(data);
    const optimizedData = sortedData.map((item) => {
      item.rebuys = getRebuys(item);
      item.hasBounty = item.bounties ? "Yes" : "No";
      return item;
    });
    render("hbs/tournamentsList.hbs", {
      tournaments: optimizedData,
      season_id: seasonId2,
      seasonName
    }, container);
  }
  if (view === "profile") {
    setPlayers(data);
    const player = players.find((player2) => player2.name === playerId);
    const ranking = players.findIndex((player2) => player2.name === playerId) + 1;
    const tournaments = data.filter((tournament) => {
      return tournament.players.find((player2) => player2.name === playerId);
    });
    const sortedTournaments = sortByDate(tournaments);
    const results = [];
    sortedTournaments.forEach((item) => {
      const index = item.players.findIndex((player2) => player2.name === playerId);
      const result = {
        date: item.date,
        _id: item._id,
        ranking: item.players[index].ranking,
        rebuys: item.players[index].rebuys,
        players: item.players.length,
        points: getPoints(item.players[index], item)
      };
      results.push(result);
    });
    render("hbs/profile.hbs", {
      player_id: playerId,
      points: player?.points,
      rebuys: player?.rebuys,
      ranking,
      results,
      season_id: seasonId2
    }, container);
  }
};

// public/ts/index.ts
var urlParams = new URLSearchParams(window.location.search);
var seasonId = urlParams.get("season_id");
var tournamentId = urlParams.get("tournament_id");
var query = tournamentId ? `tournament_id=${tournamentId}` : seasonId ? `season_id=${seasonId}` : "";
var addNavigation = async (seasons) => {
  const navHTML = await getHTML("hbs/nav.hbs", {
    season_id: seasonId,
    seasons
  });
  const navElm = new DOMParser().parseFromString(navHTML, "text/html").body.firstChild;
  if (navElm) {
    navElm.addEventListener("change", (event) => {
      if (event.target instanceof HTMLSelectElement) {
        const season_id = event.target.value;
        if (season_id) {
          urlParams.set("season_id", season_id);
        } else {
          urlParams.delete("season_id");
        }
        window.location.search = urlParams.toString();
      }
    });
    document.querySelector("main")?.prepend(navElm);
  }
};
var fetchData = () => {
  fetch(`/api/tournament?${query}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
    /*,
    body: JSON.stringify({
        tournament_id: ,
        seasonId: seasonId
    })*/
  }).then((response) => response.json()).then(async (json) => {
    await addNavigation(json.seasons);
    if (json.error) {
      alert(json.message);
    }
    if (json.tournaments) {
      renderPage({
        data: json.tournaments,
        view: urlParams.get("view") || "ranking",
        player_id: urlParams.get("player_id"),
        season_id: seasonId,
        season_name: json.seasons.find((item) => item._id == seasonId)?.name || "All-Time"
      });
    } else {
    }
  }).catch(function(err) {
    console.error(` Err: ${err}`);
  });
};
fetchData();
//# sourceMappingURL=index.js.map

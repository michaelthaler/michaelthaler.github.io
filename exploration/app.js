(function () {
  const CONFIG = {
    boardRadius: 4,
    baseEnergy: 2,
    moveCost: 1,
    exploitCost: 1,
    teaBonus: 2,
    logLength: 10,
    logBuffer: 36,
    hexSize: 42,
    players: [
      { name: "Player A", short: "A", color: "#ef7d5c" },
      { name: "Player B", short: "B", color: "#7cd1c1" }
    ]
  };

  const HEX_DIRECTIONS = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 }
  ];

  const RESOURCE_INFO = {
    base: {
      label: "Camp",
      short: "HQ",
      subLabel: "start",
      description: "The shared starting camp. Pawns begin here and this hex cannot be exploited."
    },
    scene: {
      label: "Destination",
      short: "VP",
      subLabel: "score",
      description: function (tile) {
        return "Exploit this destination for " + scenePoints(tile) + " VP.";
      }
    },
    tea: {
      label: "Tea",
      short: "TE",
      subLabel: "+2 next",
      description: "Exploit this hex to bank 2 extra energy for your next turn."
    },
    spy: {
      label: "Spy",
      short: "SP",
      subLabel: "scan",
      description: "Exploit this hex to privately reveal all adjacent hexes you do not yet know."
    },
    study: {
      label: "Study",
      short: "ST",
      subLabel: "unlock",
      description: "Exploit this hex to unlock the next ring for that player."
    },
    endgame: {
      label: "End Game",
      short: "END",
      subLabel: "finish",
      description: "Exploit this hex to claim one of the two end game spaces. When both are exploited, the game ends."
    }
  };

  const RING_DISTRIBUTIONS = {
    1: { scene: 1, tea: 1, spy: 2, study: 2 },
    2: { scene: 3, tea: 3, spy: 3, study: 3 },
    3: { scene: 5, tea: 5, spy: 4, study: 4 },
    4: { scene: 10, tea: 6, spy: 6, study: 0, endgame: 2 }
  };

  const DESTINATION_POOL = buildDestinationPool();

  const dom = {};
  let state = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    dom.board = document.getElementById("board");
    dom.turnChip = document.getElementById("turnChip");
    dom.scoreboard = document.getElementById("scoreboard");
    dom.energyValue = document.getElementById("energyValue");
    dom.actionHint = document.getElementById("actionHint");
    dom.phaseNote = document.getElementById("phaseNote");
    dom.tileDetail = document.getElementById("tileDetail");
    dom.log = document.getElementById("log");
    dom.seedValue = document.getElementById("seedValue");
    dom.endgameValue = document.getElementById("endgameValue");
    dom.distributionList = document.getElementById("distributionList");
    dom.exploitButton = document.getElementById("exploitButton");
    dom.endTurnButton = document.getElementById("endTurnButton");
    dom.skipSpyButton = document.getElementById("skipSpyButton");
    dom.resetButton = document.getElementById("resetButton");
    dom.regenerateButton = document.getElementById("regenerateButton");
    dom.privacyOverlay = document.getElementById("privacyOverlay");
    dom.overlayTitle = document.getElementById("overlayTitle");
    dom.overlayCopy = document.getElementById("overlayCopy");
    dom.overlayButton = document.getElementById("overlayButton");

    dom.board.addEventListener("click", onBoardClick);
    dom.exploitButton.addEventListener("click", exploitCurrentHex);
    dom.endTurnButton.addEventListener("click", endTurn);
    dom.skipSpyButton.addEventListener("click", skipSpy);
    dom.resetButton.addEventListener("click", resetGame);
    dom.regenerateButton.addEventListener("click", regenerateBoard);
    dom.overlayButton.addEventListener("click", beginTurn);

    state = createGame(randomSeed());
    render();
  }

  function createGame(seed) {
    const generated = generateBoard(seed);
    const players = CONFIG.players.map(function (player, index) {
      return {
        id: index,
        name: player.name,
        short: player.short,
        color: player.color,
        position: "0,0",
        vp: 0,
        bonusEnergy: 0,
        unlockedRing: 1
      };
    });

    return {
      seed: seed,
      tiles: generated.tiles,
      tilesById: generated.tilesById,
      viewBox: generated.viewBox,
      currentPlayer: 0,
      totalTurns: 1,
      energy: CONFIG.baseEnergy,
      pendingSpy: null,
      awaitingHandoff: false,
      hasExploited: false,
      gameOver: false,
      finalMessage: "",
      selectedTileId: "0,0",
      players: players,
      logEntries: [
        logEntry(
          "Player A begins at the camp with 2 energy. Private reveals stay hidden until exploited or known by both players."
        )
      ]
    };
  }

  function generateBoard(seed) {
    const rng = mulberry32(seed);
    const tiles = [];
    const tilesById = {};
    const radius = CONFIG.boardRadius;

    for (let q = -radius; q <= radius; q += 1) {
      const minR = Math.max(-radius, -q - radius);
      const maxR = Math.min(radius, -q + radius);
      for (let r = minR; r <= maxR; r += 1) {
        const tile = createTile(q, r);
        tiles.push(tile);
        tilesById[tile.id] = tile;
      }
    }

    const centerTile = tilesById["0,0"];
    centerTile.kind = "base";
    centerTile.publicRevealed = true;
    centerTile.knownBy = [true, true];

    for (let ring = 1; ring <= radius; ring += 1) {
      const ringTiles = tiles.filter(function (tile) {
        return tile.ring === ring;
      });
      const bag = createRingBag(ring);
      shuffle(bag, rng);
      shuffle(ringTiles, rng);
      ringTiles.forEach(function (tile, index) {
        tile.kind = bag[index];
      });
    }

    assignTileDetails(tiles, rng);

    const margin = CONFIG.hexSize + 48;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    tiles.forEach(function (tile) {
      const point = axialToPixel(tile.q, tile.r, CONFIG.hexSize);
      tile.x = point.x;
      tile.y = point.y;
      tile.points = hexPoints(point.x, point.y, CONFIG.hexSize);
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });

    const viewBox = [
      minX - margin,
      minY - margin,
      maxX - minX + margin * 2,
      maxY - minY + margin * 2
    ].join(" ");

    return { tiles: tiles, tilesById: tilesById, viewBox: viewBox };
  }

  function createTile(q, r) {
    return {
      id: q + "," + r,
      q: q,
      r: r,
      ring: hexDistance(q, r, 0, 0),
      kind: "scene",
      publicRevealed: false,
      knownBy: [false, false],
      exploitedBy: [false, false],
      discoveredBy: null,
      firstExploitedBy: null,
      isEndgame: false,
      destination: null,
      vpValue: null,
      x: 0,
      y: 0,
      points: ""
    };
  }

  function createRingBag(ring) {
    const bag = [];
    const distribution = RING_DISTRIBUTIONS[ring];
    Object.keys(distribution).forEach(function (kind) {
      for (let count = 0; count < distribution[kind]; count += 1) {
        bag.push(kind);
      }
    });
    return bag;
  }

  function assignTileDetails(tiles, rng) {
    const sceneTiles = tiles.filter(function (tile) {
      return tile.kind === "scene";
    });
    const deck = buildDestinationDeck(sceneTiles.length, rng);
    sceneTiles.forEach(function (tile, index) {
      tile.destination = deck[index];
      tile.vpValue = 2 + Math.floor(rng() * 4);
    });

    tiles.forEach(function (tile) {
      if (tile.kind === "endgame") {
        tile.isEndgame = true;
      }
    });
  }

  function buildDestinationDeck(count, rng) {
    const deck = [];

    while (deck.length < count) {
      const batch = DESTINATION_POOL.slice();
      shuffle(batch, rng);
      deck.push.apply(deck, batch);
    }

    return deck.slice(0, count);
  }

  function onBoardClick(event) {
    if (state.awaitingHandoff || state.gameOver) {
      return;
    }

    const tileGroup = event.target.closest("[data-tile-id]");
    if (!tileGroup) {
      return;
    }

    const tileId = tileGroup.getAttribute("data-tile-id");
    const tile = getTile(tileId);

    if (state.pendingSpy && canUseSpyOn(tile)) {
      revealWithSpy(tile);
      return;
    }

    if (!state.pendingSpy && canMoveTo(tile)) {
      moveTo(tile);
      return;
    }

    state.selectedTileId = tileId;
    render();
  }

  function moveTo(tile) {
    const player = currentPlayer();
    const previous = currentTile();

    player.position = tile.id;
    state.energy -= CONFIG.moveCost;
    state.selectedTileId = tile.id;

    addLog(player.name + " moved from " + formatHex(previous) + " to " + formatHex(tile) + ".");

    if (!isVisibleToPlayer(tile, player.id)) {
      addLog(player.name + " explored a previously hidden hex at " + formatHex(tile) + ".");
      const outcome = revealTileForPlayer(tile, player.id);
      addRevealLogs(tile, outcome, "moved onto");
    }

    render();
  }

  function exploitCurrentHex() {
    if (!canExploitCurrentHex()) {
      return;
    }

    const player = currentPlayer();
    const tile = currentTile();
    const wasPublic = tile.publicRevealed;
    const wasUnexploited = !hasAnyExploitation(tile);

    state.energy -= CONFIG.exploitCost;
    state.hasExploited = true;
    tile.exploitedBy[player.id] = true;
    if (tile.firstExploitedBy === null) {
      tile.firstExploitedBy = player.id;
    }
    tile.publicRevealed = true;

    if (!wasPublic) {
      addLog(
        player.name +
          " publicly revealed " +
          describeTile(tile, true) +
          " at " +
          formatHex(tile) +
          "."
      );
    }

    if (tile.kind === "scene") {
      const points = scenePoints(tile);
      player.vp += points;
      addLog(player.name + " captured a scenic wonder for " + points + " VP.");
    }

    if (tile.kind === "tea") {
      player.bonusEnergy += CONFIG.teaBonus;
      addLog(player.name + " banked " + CONFIG.teaBonus + " bonus energy for the next turn.");
    }

    if (tile.kind === "study") {
      if (player.unlockedRing < CONFIG.boardRadius) {
        player.unlockedRing += 1;
        addLog(player.name + " unlocked ring " + player.unlockedRing + ".");
      } else {
        player.vp += 2;
        addLog(player.name + " was already at max range, so the study became 2 VP instead.");
      }
    }

    if (tile.kind === "spy") {
      const spyTargets = getSpyTargets(tile);
      if (spyTargets.length > 0) {
        const revealedCount = revealAllSpyTargets(tile);
        addLog(player.name + " activated spy.");
        addLog("You privately revealed " + revealedCount + " adjacent hexes.", "private", player.id);
      } else {
        addLog(player.name + " found no unseen neighbors for spy to reveal.");
      }
    }

    if (tile.isEndgame) {
      addLog(
        player.name +
          (wasUnexploited ? " exploited one of the endgame hexes (" : " re-exploited an endgame hex (") +
          countExploitedEndgameTiles() +
          "/2)."
      );
    }

    finalizeGameIfNeeded();
    render();
  }

  function revealWithSpy(tile) {
    const outcome = revealTileForPlayer(tile, state.currentPlayer);
    state.selectedTileId = tile.id;
    state.pendingSpy = null;
    addLog(currentPlayer().name + " used spy on " + formatHex(tile) + ".");
    addRevealLogs(tile, outcome, "observed");
    render();
  }

  function skipSpy() {
    if (!state.pendingSpy || state.awaitingHandoff || state.gameOver) {
      return;
    }

    state.pendingSpy = null;
    addLog(currentPlayer().name + " declined to inspect a hex with spy.");
    render();
  }

  function endTurn() {
    if (state.pendingSpy || state.awaitingHandoff || state.gameOver) {
      return;
    }

    const endingPlayer = currentPlayer();
    const nextPlayerIndex = 1 - state.currentPlayer;
    state.currentPlayer = nextPlayerIndex;
    state.totalTurns += 1;
    state.hasExploited = false;
    state.awaitingHandoff = true;

    const nextPlayer = currentPlayer();
    const queuedEnergy = nextPlayer.bonusEnergy;
    state.energy = CONFIG.baseEnergy + queuedEnergy;
    nextPlayer.bonusEnergy = 0;
    state.selectedTileId = nextPlayer.position;

    addLog(endingPlayer.name + " ended the turn.");
    addLog(
      nextPlayer.name +
        " begins with " +
        state.energy +
        " energy" +
        (queuedEnergy > 0 ? " (" + CONFIG.baseEnergy + " base plus " + queuedEnergy + " tea)." : ".")
    );

    render();
  }

  function beginTurn() {
    if (!state.awaitingHandoff) {
      return;
    }

    state.awaitingHandoff = false;
    render();
  }

  function resetGame() {
    state = createGame(state.seed);
    render();
  }

  function regenerateBoard() {
    state = createGame(randomSeed());
    render();
  }

  function render() {
    renderTurnChip();
    renderScoreboard();
    renderDistribution();
    renderBoard();
    renderButtons();
    renderTileDetail();
    renderLog();
    renderNotes();
    renderOverlay();
    dom.energyValue.textContent = String(state.energy);
    dom.seedValue.textContent = "Seed " + state.seed;
    dom.endgameValue.textContent = "Endgame " + countExploitedEndgameTiles() + "/2";
  }

  function renderTurnChip() {
    const player = currentPlayer();
    const round = Math.floor((state.totalTurns - 1) / 2) + 1;

    if (state.gameOver) {
      dom.turnChip.innerHTML =
        "<strong>Game Over</strong><br>" +
        state.finalMessage +
        "<br>Endgame hexes exploited: 2 of 2";
      return;
    }

    dom.turnChip.innerHTML =
      "<strong>Round " +
      round +
      "</strong><br>" +
      player.name +
      " to act<br>" +
      "Unlocked ring " +
      player.unlockedRing +
      " of " +
      CONFIG.boardRadius +
      "<br>Endgame " +
      countExploitedEndgameTiles() +
      "/2";
  }

  function renderScoreboard() {
    const viewerId = state.currentPlayer;
    const winners = winnerIds();

    dom.scoreboard.innerHTML = state.players
      .map(function (player) {
        const tile = getTile(player.position);
        const classes = ["score-card"];
        if (!state.gameOver && player.id === state.currentPlayer) {
          classes.push("is-active");
        }
        if (state.gameOver && winners.indexOf(player.id) !== -1) {
          classes.push("is-active");
        }

        return (
          '<article class="' +
          classes.join(" ") +
          '">' +
          '<div class="score-head">' +
          '<div class="score-title">' +
          '<span class="score-dot" style="background:' +
          player.color +
          '"></span>' +
          player.name +
          "</div>" +
          '<div class="score-vp">' +
          player.vp +
          " VP</div>" +
          "</div>" +
          '<div class="score-rows">' +
          scoreRow("Ring Access", "1-" + player.unlockedRing) +
          scoreRow("Next Turn Tea", "+" + player.bonusEnergy) +
          scoreRow("Current Hex", visibleTileName(tile, viewerId)) +
          scoreRow("Position", formatHex(tile)) +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderBoard() {
    const viewerId = state.currentPlayer;
    const moveTargets = getMoveTargets();
    const moveTargetIds = new Set(
      moveTargets.map(function (tile) {
        return tile.id;
      })
    );
    const spyTargets = state.pendingSpy ? getSpyTargets(getTile(state.pendingSpy.sourceTileId)) : [];
    const spyTargetIds = new Set(
      spyTargets.map(function (tile) {
        return tile.id;
      })
    );
    const currentTileId = currentPlayer().position;
    const currentUnlockedRing = currentPlayer().unlockedRing;

    const tileMarkup = state.tiles
      .map(function (tile) {
        const visible = isVisibleToPlayer(tile, viewerId);
        const classes = ["hex-tile", "resource-" + tile.kind];

        if (!visible) {
          classes.push("is-hidden");
        }
        if (visible && !tile.publicRevealed) {
          classes.push("is-private");
        }
        if (hasAnyExploitation(tile)) {
          classes.push("is-claimed");
        }
        if (isFullyExploited(tile)) {
          classes.push("is-drained");
        }
        if (tile.id === state.selectedTileId) {
          classes.push("is-selected");
        }
        if (tile.id === currentTileId) {
          classes.push("is-current");
        }
        if (tile.ring > currentUnlockedRing) {
          classes.push("is-beyond-range");
        }
        if (!visible && tile.ring > currentUnlockedRing) {
          classes.push("is-locked");
        }
        if (moveTargetIds.has(tile.id) && !state.awaitingHandoff && !state.gameOver) {
          classes.push("is-move-target");
        }
        if (spyTargetIds.has(tile.id) && !state.awaitingHandoff && !state.gameOver) {
          classes.push("is-spy-target");
        }

        return (
          '<g class="' +
          classes.join(" ") +
          '" data-tile-id="' +
          tile.id +
          '">' +
          '<polygon points="' +
          tile.points +
          '"></polygon>' +
          renderSceneThumb(tile, visible) +
          '<text class="tile-label" x="' +
          tile.x +
          '" y="' +
          (tile.y - 5) +
          '">' +
          tileLabel(tile, viewerId, currentUnlockedRing) +
          "</text>" +
          '<text class="tile-sub" x="' +
          tile.x +
          '" y="' +
          (tile.y + 15) +
          '">' +
          tileSubLabel(tile, viewerId, currentUnlockedRing) +
          "</text>" +
          renderEndgameGlyph(tile, visible) +
          renderDiscoveryMarker(tile, visible) +
          "</g>"
        );
      })
      .join("");

    dom.board.setAttribute("viewBox", state.viewBox);
    dom.board.innerHTML = tileMarkup + renderPawns();
    dom.actionHint.textContent = actionHint();
  }

  function renderEndgameGlyph(tile, visible) {
    if (!tile.isEndgame || !visible) {
      return "";
    }

    const x = tile.x - 18;
    const y = tile.y - 18;
    return (
      '<polygon class="endgame-glyph" points="' +
      x +
      "," +
      y +
      " " +
      (x + 7) +
      "," +
      (y - 7) +
      " " +
      (x + 14) +
      "," +
      y +
      " " +
      (x + 7) +
      "," +
      (y + 7) +
      '"></polygon>'
    );
  }

  function renderSceneThumb(tile, visible) {
    if (!visible || tile.kind !== "scene" || !tile.destination) {
      return "";
    }

    const width = 34;
    const height = 22;
    const x = tile.x - width / 2;
    const y = tile.y - 33;

    return (
      '<rect class="scene-thumb-frame" x="' +
      x +
      '" y="' +
      y +
      '" width="' +
      width +
      '" height="' +
      height +
      '" rx="5"></rect>' +
      '<image class="scene-thumb" href="' +
      tile.destination.image +
      '" x="' +
      x +
      '" y="' +
      y +
      '" width="' +
      width +
      '" height="' +
      height +
      '" preserveAspectRatio="xMidYMid slice"></image>'
    );
  }

  function renderDiscoveryMarker(tile, visible) {
    if (!visible || tile.discoveredBy === null) {
      return "";
    }

    const color = state.players[tile.discoveredBy].color;
    return (
      '<circle class="discovery-marker" cx="' +
      (tile.x + 22) +
      '" cy="' +
      (tile.y - 23) +
      '" r="6" fill="' +
      color +
      '"></circle>'
    );
  }

  function renderPawns() {
    return state.players
      .map(function (player) {
        const occupants = state.players.filter(function (other) {
          return other.position === player.position;
        });
        const occupantIndex = occupants.findIndex(function (other) {
          return other.id === player.id;
        });
        const offset = occupants.length === 2 ? (occupantIndex === 0 ? -14 : 14) : 0;
        const tile = getTile(player.position);

        return (
          '<g class="pawn' +
          (!state.gameOver && player.id === state.currentPlayer ? " pawn--active" : "") +
          '">' +
          '<ellipse class="pawn-shadow" cx="' +
          (tile.x + offset) +
          '" cy="' +
          (tile.y + 24) +
          '" rx="13" ry="6"></ellipse>' +
          '<circle cx="' +
          (tile.x + offset) +
          '" cy="' +
          (tile.y + 8) +
          '" r="13" fill="' +
          player.color +
          '"></circle>' +
          '<text x="' +
          (tile.x + offset) +
          '" y="' +
          (tile.y + 8) +
          '">' +
          player.short +
          "</text>" +
          "</g>"
        );
      })
      .join("");
  }

  function renderButtons() {
    const blocked = state.awaitingHandoff || state.gameOver;
    dom.exploitButton.disabled = blocked || !canExploitCurrentHex();
    dom.endTurnButton.disabled = blocked || !!state.pendingSpy;
    dom.skipSpyButton.hidden = !state.pendingSpy;
    dom.skipSpyButton.disabled = blocked || !state.pendingSpy;
  }

  function renderTileDetail() {
    const selected = getTile(state.selectedTileId) || currentTile();
    const viewerId = state.currentPlayer;
    const visible = isVisibleToPlayer(selected, viewerId);
    const tags = [];

    if (!visible) {
      tags.push(tag(selected.ring > currentPlayer().unlockedRing ? "Locked right now" : "Unknown to you"));
    } else if (selected.publicRevealed) {
      tags.push(tag("Publicly known"));
    } else {
      tags.push(tag("Known privately to you"));
    }

    if (visible && selected.kind !== "base") {
      if (hasPlayerExploitedTile(selected, viewerId)) {
        tags.push(tag("You already exploited this"));
      } else {
        tags.push(tag("You can still exploit this"));
      }
    }

    if (hasPlayerExploitedTile(selected, 1 - viewerId)) {
      tags.push(tag(state.players[1 - viewerId].name + " exploited this"));
    }

    if (selected.isEndgame && visible) {
      tags.push(tag("Endgame hex"));
    }

    if (visible && selected.discoveredBy !== null) {
      tags.push(tag("First found by " + state.players[selected.discoveredBy].name));
    }

    const occupants = state.players
      .filter(function (player) {
        return player.position === selected.id;
      })
      .map(function (player) {
        return player.name;
      });

    if (occupants.length > 0) {
      tags.push(tag("Occupied by " + occupants.join(" and ")));
    }

    dom.tileDetail.innerHTML =
      '<article class="detail-card">' +
      tileDetailVisual(selected, visible) +
      "<h3>" +
      tileDetailTitle(selected, visible) +
      "</h3>" +
      '<p class="detail-meta">' +
      tileDetailMeta(selected, visible) +
      "</p>" +
      '<p class="detail-copy">' +
      tileDetailCopy(selected, visible) +
      "</p>" +
      '<div class="detail-tags">' +
      tags.join("") +
      "</div>" +
      "</article>";
  }

  function renderLog() {
    const entries = visibleLogEntries();
    dom.log.innerHTML = entries
      .map(function (entry) {
        return "<li>" + entry.message + "</li>";
      })
      .join("");
  }

  function renderNotes() {
    const player = currentPlayer();
    let note =
      "Each turn starts with 2 base energy. Move costs 1, exploit costs 1, tea adds 2 next turn, and each player can exploit each hex once. Dashed borders mark information only the active player knows.";

    if (state.gameOver) {
      dom.phaseNote.textContent =
        note +
        " Both endgame hexes have been exploited, so the expedition is over. Hidden tiles remain hidden unless both players had already seen them.";
      return;
    }

    if (state.pendingSpy) {
      note += " Spy is active.";
    } else if (state.awaitingHandoff) {
      note += " Pass the device before the next player begins.";
    } else {
      note +=
        " " +
        player.name +
        " currently reaches up to ring " +
        player.unlockedRing +
        ", and the game ends when both endgame hexes are exploited.";
    }

    dom.phaseNote.textContent = note;
  }

  function renderOverlay() {
    if (!state.awaitingHandoff) {
      dom.privacyOverlay.hidden = true;
      return;
    }

    const player = currentPlayer();
    dom.privacyOverlay.hidden = false;
    dom.overlayTitle.textContent = "Pass to " + player.name;
    dom.overlayCopy.textContent =
      "Private discoveries only appear for the active player. Once both players know a hex or someone exploits it, that hex becomes public.";
    dom.overlayButton.textContent = "Begin " + player.name + " Turn";
  }

  function tileDetailTitle(tile, visible) {
    if (!visible) {
      return tile.ring > currentPlayer().unlockedRing ? "Locked Hex" : "Face-down Hex";
    }

    if (tile.kind === "scene" && tile.destination) {
      return tile.destination.title;
    }

    const prefix = tile.publicRevealed ? "" : "Private ";
    return prefix + RESOURCE_INFO[tile.kind].label;
  }

  function tileDetailMeta(tile, visible) {
    if (visible && tile.kind === "scene" && tile.destination) {
      return tile.destination.fullName + " • Ring " + tile.ring + " • " + formatHex(tile);
    }

    return "Ring " + tile.ring + " • " + formatHex(tile);
  }

  function tileDetailVisual(tile, visible) {
    if (!visible || tile.kind !== "scene" || !tile.destination) {
      return "";
    }

    return (
      '<img class="detail-image" src="' +
      tile.destination.image +
      '" alt="' +
      escapeHtml(tile.destination.fullName) +
      '">'
    );
  }

  function tileDetailCopy(tile, visible) {
    if (!visible) {
      if (tile.ring > currentPlayer().unlockedRing) {
        return (
          "This hex sits on ring " +
          tile.ring +
          ". You cannot enter it until you exploit enough study hexes to unlock that ring."
        );
      }

      return "This hex is still unknown to you. It may already be known privately by the other player, but it will not become public until exploited or seen by both players.";
    }

    if (tile.kind === "base") {
      return RESOURCE_INFO.base.description;
    }

    if (tile.kind === "scene" && tile.destination) {
      let sceneDetail = tile.publicRevealed
        ? tile.destination.fullName + " is worth " + scenePoints(tile) + " VP when exploited."
        : "Only you know this destination right now. " + tile.destination.fullName + " is worth " + scenePoints(tile) + " VP when exploited.";

      if (tile.ring > currentPlayer().unlockedRing) {
        sceneDetail += " You can see it, but you still cannot enter this ring yet.";
      }

      if (tile.isEndgame) {
        sceneDetail += " This is one of the two end game hexes. When both end game hexes are exploited, the game ends immediately.";
      }

      if (hasAnyExploitation(tile)) {
        sceneDetail += " " + exploitationSummary(tile);
      }

      return sceneDetail;
    }

    const baseText =
      typeof RESOURCE_INFO[tile.kind].description === "function"
        ? RESOURCE_INFO[tile.kind].description(tile)
        : RESOURCE_INFO[tile.kind].description;

    let detail = tile.publicRevealed
      ? baseText
      : "Only you know this hex right now. " + baseText;

    if (tile.ring > currentPlayer().unlockedRing) {
      detail += " You can see it, but you still cannot enter this ring yet.";
    }

    if (tile.isEndgame) {
      detail += " This is one of the two end game hexes. When both end game hexes are exploited, the game ends immediately.";
    }

    if (hasAnyExploitation(tile)) {
      detail += " " + exploitationSummary(tile);
    }

    return detail;
  }

  function getMoveTargets() {
    if (
      state.pendingSpy ||
      state.hasExploited ||
      state.awaitingHandoff ||
      state.gameOver ||
      state.energy < CONFIG.moveCost
    ) {
      return [];
    }

    return getNeighbors(currentTile()).filter(function (tile) {
      return tile.ring <= currentPlayer().unlockedRing;
    });
  }

  function getSpyTargets(sourceTile) {
    return getNeighbors(sourceTile).filter(function (tile) {
      return !isVisibleToPlayer(tile, state.currentPlayer);
    });
  }

  function revealAllSpyTargets(sourceTile) {
    const playerId = state.currentPlayer;
    let revealedCount = 0;

    getSpyTargets(sourceTile).forEach(function (tile) {
      const outcome = revealTileForPlayer(tile, playerId);
      if (outcome.newlyKnown) {
        revealedCount += 1;
      }
      addRevealLogs(tile, outcome, "scanned");
    });

    return revealedCount;
  }

  function canMoveTo(tile) {
    if (state.pendingSpy || state.hasExploited || state.awaitingHandoff || state.gameOver) {
      return false;
    }

    if (state.energy < CONFIG.moveCost || tile.id === currentPlayer().position) {
      return false;
    }

    return (
      hexDistance(tile.q, tile.r, currentTile().q, currentTile().r) === 1 &&
      tile.ring <= currentPlayer().unlockedRing
    );
  }

  function canUseSpyOn(tile) {
    if (!state.pendingSpy || state.awaitingHandoff || state.gameOver) {
      return false;
    }

    if (isVisibleToPlayer(tile, state.currentPlayer)) {
      return false;
    }

    const source = getTile(state.pendingSpy.sourceTileId);
    return hexDistance(tile.q, tile.r, source.q, source.r) === 1;
  }

  function canExploitCurrentHex() {
    const tile = currentTile();
    return (
      !state.pendingSpy &&
      !state.hasExploited &&
      !state.awaitingHandoff &&
      !state.gameOver &&
      state.energy >= CONFIG.exploitCost &&
      isVisibleToPlayer(tile, state.currentPlayer) &&
      !hasPlayerExploitedTile(tile, state.currentPlayer) &&
      tile.kind !== "base"
    );
  }

  function actionHint() {
    if (state.gameOver) {
      return state.finalMessage;
    }

    if (state.awaitingHandoff) {
      return "Private information is hidden until the next player begins.";
    }

    if (state.pendingSpy) {
      return "Use the spy effect before ending the turn.";
    }

    if (state.hasExploited) {
      return "Exploit complete. End the turn and hand the board over.";
    }

    if (state.energy <= 0) {
      return "No energy remains, so the expedition must stop here.";
    }

    if (canExploitCurrentHex() && getMoveTargets().length > 0) {
      return "Push deeper, or cash in the hex underfoot.";
    }

    if (canExploitCurrentHex()) {
      return "Your current hex is ready to exploit.";
    }

    if (getMoveTargets().length > 0) {
      return "Click a neighboring hex to explore.";
    }

    return "No legal movement remains from here. A study hex may be needed.";
  }

  function tileLabel(tile, viewerId, unlockedRing) {
    if (!isVisibleToPlayer(tile, viewerId)) {
      return tile.ring > unlockedRing ? "R" + tile.ring : "?";
    }

    if (tile.kind === "scene" && tile.destination) {
      return tile.destination.code;
    }

    return RESOURCE_INFO[tile.kind].short;
  }

  function tileSubLabel(tile, viewerId, unlockedRing) {
    if (!isVisibleToPlayer(tile, viewerId)) {
      return tile.ring > unlockedRing ? "locked" : "unknown";
    }

    if (tile.kind === "scene") {
      return "+" + scenePoints(tile) + " vp";
    }

    return RESOURCE_INFO[tile.kind].subLabel;
  }

  function visibleTileName(tile, viewerId) {
    if (!isVisibleToPlayer(tile, viewerId)) {
      return "Unknown";
    }

    if (tile.kind === "scene" && tile.destination) {
      return tile.destination.title;
    }

    if (!tile.publicRevealed) {
      return "Private " + RESOURCE_INFO[tile.kind].label;
    }

    return RESOURCE_INFO[tile.kind].label;
  }

  function visibleLogEntries() {
    return state.logEntries
      .filter(function (entry) {
        return entry.visibility === "public" || entry.playerId === state.currentPlayer;
      })
      .slice(0, CONFIG.logLength);
  }

  function addRevealLogs(tile, outcome, verb) {
    if (!outcome.newlyKnown) {
      return;
    }

    if (outcome.becamePublic) {
      addLog(
        "Both expeditions now know that " +
          formatHex(tile) +
          " is " +
          describeTile(tile, true) +
          "."
      );
      return;
    }

    addLog("You " + verb + " " + describeTile(tile, true) + " at " + formatHex(tile) + ".", "private", state.currentPlayer);
  }

  function revealTileForPlayer(tile, playerId) {
    if (isVisibleToPlayer(tile, playerId)) {
      return { newlyKnown: false, becamePublic: false };
    }

    tile.knownBy[playerId] = true;
    if (tile.discoveredBy === null) {
      tile.discoveredBy = playerId;
    }

    const becamePublic = !tile.publicRevealed && tile.knownBy.every(Boolean);
    if (becamePublic) {
      tile.publicRevealed = true;
    }

    return { newlyKnown: true, becamePublic: becamePublic };
  }

  function isVisibleToPlayer(tile, playerId) {
    return tile.publicRevealed || tile.knownBy[playerId];
  }

  function finalizeGameIfNeeded() {
    if (countExploitedEndgameTiles() < 2) {
      return;
    }

    state.pendingSpy = null;
    state.awaitingHandoff = false;
    state.gameOver = true;
    state.finalMessage = finalScoreMessage();
    addLog("Both endgame hexes have been exploited. The game ends immediately.");
    addLog(state.finalMessage);
  }

  function countExploitedEndgameTiles() {
    return state.tiles.filter(function (tile) {
      return tile.isEndgame && hasAnyExploitation(tile);
    }).length;
  }

  function renderDistribution() {
    dom.distributionList.innerHTML = Object.keys(RING_DISTRIBUTIONS)
      .map(function (ringKey) {
        const ring = Number(ringKey);
        const distribution = RING_DISTRIBUTIONS[ring];
        const summary = Object.keys(distribution)
          .filter(function (kind) {
            return distribution[kind] > 0;
          })
          .map(function (kind) {
            return distribution[kind] + " " + RESOURCE_INFO[kind].label.toLowerCase();
          })
          .join(", ");
        const total = Object.keys(distribution).reduce(function (sum, kind) {
          return sum + distribution[kind];
        }, 0);
        const note =
          ring === CONFIG.boardRadius
            ? '<div class="distribution-note">End game hexes replace 2 destination spaces in this ring. No study tiles appear here.</div>'
            : "";

        return (
          '<article class="distribution-card">' +
          '<div class="distribution-head">' +
          "<strong>Ring " +
          ring +
          "</strong>" +
          '<span class="distribution-total">' +
          total +
          " hexes</span>" +
          "</div>" +
          '<div class="distribution-copy">' +
          summary +
          "</div>" +
          note +
          "</article>"
        );
      })
      .join("");
  }

  function winnerIds() {
    const maxVp = Math.max.apply(
      null,
      state.players.map(function (player) {
        return player.vp;
      })
    );

    return state.players
      .filter(function (player) {
        return player.vp === maxVp;
      })
      .map(function (player) {
        return player.id;
      });
  }

  function finalScoreMessage() {
    const winners = winnerIds();
    if (winners.length > 1) {
      return "The game is tied at " + state.players[winners[0]].vp + " VP each.";
    }

    const winner = state.players[winners[0]];
    const loser = state.players[1 - winners[0]];
    return winner.name + " wins, " + winner.vp + " VP to " + loser.vp + ".";
  }

  function describeTile(tile, withArticle) {
    if (tile.kind === "scene" && tile.destination) {
      return tile.destination.fullName;
    }

    if (tile.kind === "endgame") {
      return withArticle ? "an end game hex" : "end game hex";
    }

    const parts = [];
    if (tile.isEndgame) {
      parts.push("endgame");
    }
    parts.push(RESOURCE_INFO[tile.kind].label.toLowerCase());
    parts.push("hex");
    const phrase = parts.join(" ");
    return withArticle ? withIndefiniteArticle(phrase) : phrase;
  }

  function withIndefiniteArticle(text) {
    return /^[aeiou]/i.test(text) ? "an " + text : "a " + text;
  }

  function buildDestinationPool() {
    return [
      createDestination("Marrakesh", "Marrakesh, Morocco", "MAR", "arches", {
        skyTop: "#f2c178",
        skyBottom: "#d66a4b",
        ground: "#a74d34",
        accent: "#ffd68a",
        line: "#4c1f15"
      }),
      createDestination("Waitomo Caves", "Waitomo Caves, New Zealand", "WAI", "caves", {
        skyTop: "#0e2233",
        skyBottom: "#162d47",
        ground: "#12212a",
        accent: "#80f4d8",
        line: "#071117"
      }),
      createDestination("Wengen", "Wengen, Switzerland", "WEN", "alps", {
        skyTop: "#b8e4ff",
        skyBottom: "#5ea2dc",
        ground: "#2d6f45",
        accent: "#f8fbff",
        line: "#18334a"
      }),
      createDestination("Tiger's Nest", "Tiger's Nest, Bhutan", "TIG", "cliff", {
        skyTop: "#d9efff",
        skyBottom: "#8cb9e0",
        ground: "#44604d",
        accent: "#f6e4a3",
        line: "#1f2c22"
      }),
      createDestination("Alfriston", "Alfriston, England", "ALF", "village", {
        skyTop: "#dcefd8",
        skyBottom: "#9ec79a",
        ground: "#557a41",
        accent: "#f3e8c7",
        line: "#2e3d23"
      }),
      createDestination("Lisbon", "Lisbon, Portugal", "LIS", "tram", {
        skyTop: "#f8d98c",
        skyBottom: "#eb8c56",
        ground: "#7b5367",
        accent: "#ffd44d",
        line: "#35233d"
      }),
      createDestination("Yosemite", "Yosemite, California", "YOS", "granite", {
        skyTop: "#bfe8ff",
        skyBottom: "#73a8d4",
        ground: "#2f5b41",
        accent: "#d7d9d8",
        line: "#1e2930"
      }),
      createDestination("Paris", "Paris, France", "PAR", "tower", {
        skyTop: "#f7d2d9",
        skyBottom: "#c58da8",
        ground: "#604760",
        accent: "#f5f0ea",
        line: "#2e1f30"
      }),
      createDestination("Harpers Ferry", "Harpers Ferry, West Virginia", "HAR", "river", {
        skyTop: "#cde7ff",
        skyBottom: "#88b8e1",
        ground: "#48724b",
        accent: "#8fd0f2",
        line: "#1d2f2f"
      }),
      createDestination("Athens", "Athens, Greece", "ATH", "temple", {
        skyTop: "#d6efff",
        skyBottom: "#8eb8e5",
        ground: "#b18b5b",
        accent: "#f7edd8",
        line: "#3a3026"
      }),
      createDestination("Edinburgh", "Edinburgh, Scotland", "EDI", "castle", {
        skyTop: "#d7d8e9",
        skyBottom: "#7c88a9",
        ground: "#47516f",
        accent: "#c9b8a2",
        line: "#252a3a"
      }),
      createDestination("Vienna", "Vienna, Austria", "VIE", "palace", {
        skyTop: "#f3d7c8",
        skyBottom: "#d79d8a",
        ground: "#87595f",
        accent: "#f7ede0",
        line: "#3b2429"
      }),
      createDestination("Bergen", "Bergen, Norway", "BER", "harbor", {
        skyTop: "#cce5f5",
        skyBottom: "#6f9dc5",
        ground: "#3d5c70",
        accent: "#f2c14e",
        line: "#1a2a34"
      }),
      createDestination("Love Valley", "Love Valley, Cappadocia, Turkey", "LOV", "balloons", {
        skyTop: "#ffe0b8",
        skyBottom: "#e89b6d",
        ground: "#be7a58",
        accent: "#ff6b6b",
        line: "#4a2a22"
      }),
      createDestination("New York", "New York, NY", "NYC", "skyline", {
        skyTop: "#bcdfff",
        skyBottom: "#6f91c6",
        ground: "#3a465c",
        accent: "#ffd166",
        line: "#1c2330"
      }),
      createDestination("Lexington", "Lexington, Kentucky", "LEX", "horse", {
        skyTop: "#cfeec7",
        skyBottom: "#83bf7d",
        ground: "#4f7d43",
        accent: "#f4e2b8",
        line: "#2b3325"
      }),
      createDestination("Philadelphia", "Philadelphia, PA", "PHL", "bell", {
        skyTop: "#d7e9f2",
        skyBottom: "#8eaec0",
        ground: "#6f4f42",
        accent: "#d6a84f",
        line: "#2e241f"
      }),
      createDestination("Washington", "Washington, DC", "WDC", "capitol", {
        skyTop: "#dceeff",
        skyBottom: "#9bbbd8",
        ground: "#596f75",
        accent: "#f8f4ea",
        line: "#2c3a42"
      }),
      createDestination("Boston", "Boston, MA", "BOS", "brick", {
        skyTop: "#cfe6f8",
        skyBottom: "#7fa9c9",
        ground: "#71433e",
        accent: "#f0c86a",
        line: "#35201f"
      }),
      createDestination("London", "London, UK", "LDN", "clock", {
        skyTop: "#d7dbe4",
        skyBottom: "#8a95a8",
        ground: "#4f5668",
        accent: "#f1d27a",
        line: "#242936"
      }),
      createDestination("Sydney", "Sydney, Australia", "SYD", "opera", {
        skyTop: "#b9ecff",
        skyBottom: "#5aaed3",
        ground: "#287a9b",
        accent: "#fbf7ec",
        line: "#123949"
      })
    ];
  }

  function createDestination(title, fullName, code, artKind, palette) {
    return {
      title: title,
      fullName: fullName,
      code: code,
      artKind: artKind,
      image: buildDestinationImage(artKind, code, palette)
    };
  }

  function buildDestinationImage(artKind, code, palette) {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">' +
      '<defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1">' +
      '<stop offset="0%" stop-color="' +
      palette.skyTop +
      '"/><stop offset="100%" stop-color="' +
      palette.skyBottom +
      '"/></linearGradient></defs>' +
      '<rect width="120" height="80" rx="12" fill="url(#g)"/>' +
      '<rect y="54" width="120" height="26" fill="' +
      palette.ground +
      '"/>' +
      buildSceneArt(artKind, palette) +
      '<rect x="8" y="8" width="32" height="18" rx="9" fill="rgba(8,17,22,0.62)"/>' +
      '<text x="24" y="20" fill="#f5ead3" font-family="Avenir Next, Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle">' +
      code +
      "</text></svg>";

    return svgDataUri(svg);
  }

  function buildSceneArt(artKind, palette) {
    switch (artKind) {
      case "arches":
        return (
          '<circle cx="92" cy="22" r="10" fill="' +
          palette.accent +
          '"/><rect x="18" y="38" width="52" height="18" rx="4" fill="#bf6b41"/><path d="M34 56v-10c0-8 6-12 10-12s10 4 10 12v10z" fill="#5b2c21"/><rect x="74" y="32" width="16" height="24" fill="#9d4f37"/><rect x="94" y="28" width="10" height="28" fill="#c5774b"/>'
        );
      case "caves":
        return (
          '<path d="M8 54c12-22 29-34 52-34 21 0 36 11 52 34z" fill="#091116"/><circle cx="33" cy="30" r="2.2" fill="' +
          palette.accent +
          '"/><circle cx="48" cy="23" r="1.8" fill="' +
          palette.accent +
          '"/><circle cx="63" cy="27" r="2.4" fill="' +
          palette.accent +
          '"/><circle cx="82" cy="21" r="2" fill="' +
          palette.accent +
          '"/><circle cx="95" cy="30" r="2.1" fill="' +
          palette.accent +
          '"/><path d="M47 44c6 8 20 8 26 0" stroke="' +
          palette.accent +
          '" stroke-width="3" fill="none" stroke-linecap="round"/>'
        );
      case "alps":
        return (
          '<polygon points="8,58 32,24 54,58" fill="#dfe8ef"/><polygon points="34,58 62,18 90,58" fill="#f8fbff"/><polygon points="62,58 90,28 112,58" fill="#cedbe5"/><rect x="18" y="48" width="18" height="12" fill="#7a4d3b"/><polygon points="16,48 27,40 38,48" fill="#f3e4d2"/>'
        );
      case "cliff":
        return (
          '<path d="M14 62l26-38 10 38z" fill="#6c7d66"/><rect x="46" y="28" width="24" height="16" rx="2" fill="#f2e8c8"/><rect x="54" y="18" width="10" height="10" fill="#f2e8c8"/><path d="M66 38h18l10-8v30h-8l-4-7h-16z" fill="#d6c08a"/><path d="M48 34h18" stroke="' +
          palette.line +
          '" stroke-width="2"/>'
        );
      case "village":
        return (
          '<path d="M0 57c16-8 36-12 58-10 18 2 36 4 62-3v13H0z" fill="#70935b"/><rect x="22" y="40" width="18" height="14" fill="#e9d8bc"/><polygon points="20,40 31,32 42,40" fill="#8d5b4b"/><rect x="52" y="36" width="20" height="18" fill="#d8c5a2"/><polygon points="50,36 62,28 74,36" fill="#725347"/><circle cx="92" cy="22" r="8" fill="#f5efbf"/>'
        );
      case "tram":
        return (
          '<path d="M0 58c22-14 45-22 120-18v14H0z" fill="#6d526d"/><rect x="34" y="34" width="42" height="18" rx="4" fill="#f0c63d"/><rect x="40" y="39" width="10" height="8" fill="#f4ebdd"/><rect x="54" y="39" width="10" height="8" fill="#f4ebdd"/><path d="M38 58l8-8M74 58l8-8" stroke="' +
          palette.line +
          '" stroke-width="3"/><path d="M55 34l6-8" stroke="' +
          palette.line +
          '" stroke-width="2"/><circle cx="90" cy="20" r="8" fill="#fff0ac"/>'
        );
      case "granite":
        return (
          '<rect x="76" y="18" width="20" height="42" rx="4" fill="#d4d6d4"/><path d="M18 58l18-22 12 22z" fill="#294c35"/><path d="M38 58l14-18 10 18z" fill="#365b40"/><path d="M66 58l18-30 8 30z" fill="#b5b9b7"/>'
        );
      case "tower":
        return (
          '<circle cx="94" cy="18" r="9" fill="#f9e4d0"/><path d="M60 56h16L69 18z" fill="#4b3751"/><path d="M63 44h12M64 34h10M66 26h6" stroke="#f7efe7" stroke-width="1.8"/><path d="M28 58c18-10 39-12 64-8v8H28z" fill="#6f586e"/>'
        );
      case "river":
        return (
          '<path d="M0 58c18-6 34-2 48-4 24-3 41-12 72-8v14H0z" fill="#50794d"/><path d="M0 64c18-6 38-5 56-2 24 4 40 6 64 1v9H0z" fill="#73b8de"/><path d="M34 46h42l10 8H24z" fill="#7d5b46"/><path d="M44 38l8 8M58 38l8 8" stroke="' +
          palette.line +
          '" stroke-width="2"/>'
        );
      case "temple":
        return (
          '<path d="M26 58l8-24h46l8 24z" fill="#baa078"/><polygon points="54,18 24,34 84,34" fill="#f4e7c9"/><rect x="34" y="36" width="6" height="18" fill="#f7edd8"/><rect x="46" y="36" width="6" height="18" fill="#f7edd8"/><rect x="58" y="36" width="6" height="18" fill="#f7edd8"/><rect x="70" y="36" width="6" height="18" fill="#f7edd8"/>'
        );
      case "castle":
        return (
          '<path d="M10 60l20-26h40l18 26z" fill="#56617b"/><rect x="28" y="30" width="10" height="20" fill="#8f7b68"/><rect x="44" y="26" width="14" height="24" fill="#a08b75"/><rect x="64" y="30" width="10" height="20" fill="#8f7b68"/><path d="M50 18l6 8h-12z" fill="#cbbba4"/>'
        );
      case "palace":
        return (
          '<rect x="24" y="34" width="56" height="20" rx="3" fill="#ecd9c8"/><rect x="46" y="24" width="12" height="10" fill="#f7ede0"/><path d="M52 16c5 0 9 4 9 8H43c0-4 4-8 9-8z" fill="#f7ede0"/><rect x="30" y="40" width="6" height="10" fill="#8c6460"/><rect x="42" y="40" width="6" height="10" fill="#8c6460"/><rect x="56" y="40" width="6" height="10" fill="#8c6460"/><rect x="68" y="40" width="6" height="10" fill="#8c6460"/>'
        );
      case "harbor":
        return (
          '<path d="M0 60h120v20H0z" fill="#40657d"/><rect x="24" y="38" width="12" height="18" fill="#d96b5f"/><rect x="38" y="34" width="12" height="22" fill="#efb94b"/><rect x="52" y="36" width="12" height="20" fill="#c95f50"/><rect x="66" y="32" width="12" height="24" fill="#f2d062"/><polygon points="76,58 94,24 112,58" fill="#5c6d73"/>'
        );
      case "balloons":
        return (
          '<path d="M0 58c15-6 28-12 48-10 22 2 36-2 72-10v22H0z" fill="#ca875f"/><ellipse cx="34" cy="28" rx="9" ry="11" fill="#ff7b7b"/><ellipse cx="62" cy="20" rx="8" ry="10" fill="#ffcc66"/><ellipse cx="88" cy="30" rx="9" ry="11" fill="#7ad3ff"/><path d="M34 39l-2 8M62 30l-2 8M88 41l-2 8" stroke="' +
          palette.line +
          '" stroke-width="1.5"/><path d="M48 58l8-18 8 18z" fill="#8b5d42"/><path d="M68 58l10-24 8 24z" fill="#9d6a4a"/>'
        );
      case "skyline":
        return (
          '<rect x="24" y="28" width="10" height="28" fill="#2f3a50"/><rect x="38" y="20" width="12" height="36" fill="#45536b"/><rect x="54" y="32" width="10" height="24" fill="#2d3548"/><rect x="68" y="16" width="12" height="40" fill="#3e4960"/><rect x="84" y="26" width="10" height="30" fill="#2d3548"/><path d="M74 16l-2-10 6 10z" fill="' +
          palette.accent +
          '"/><circle cx="98" cy="18" r="8" fill="' +
          palette.accent +
          '"/>'
        );
      case "horse":
        return (
          '<path d="M20 56c20-16 42-16 64-8 12 4 21 2 30-6v16H20z" fill="#5d8d4f"/><path d="M38 46h36l8 8H36z" fill="#6e432f"/><path d="M70 40l14 4 7 10h-9l-6-6h-9z" fill="#6e432f"/><path d="M42 54l-4 12M58 54l-4 12M76 54l-1 12" stroke="' +
          palette.line +
          '" stroke-width="3"/><circle cx="92" cy="20" r="8" fill="' +
          palette.accent +
          '"/>'
        );
      case "bell":
        return (
          '<rect x="30" y="28" width="50" height="28" rx="3" fill="#8a5845"/><polygon points="55,16 26,30 84,30" fill="#b98662"/><path d="M60 28c12 6 14 28 1 32H41c-13-4-11-26 1-32z" fill="' +
          palette.accent +
          '"/><path d="M52 35c2 8-4 13 2 20" stroke="' +
          palette.line +
          '" stroke-width="2" fill="none"/><circle cx="51" cy="58" r="4" fill="' +
          palette.line +
          '"/>'
        );
      case "capitol":
        return (
          '<rect x="28" y="38" width="58" height="18" fill="' +
          palette.accent +
          '"/><path d="M57 18c13 0 20 8 20 18H37c0-10 7-18 20-18z" fill="' +
          palette.accent +
          '"/><rect x="52" y="12" width="10" height="8" fill="' +
          palette.accent +
          '"/><rect x="36" y="42" width="6" height="14" fill="#9fb0ba"/><rect x="50" y="42" width="6" height="14" fill="#9fb0ba"/><rect x="64" y="42" width="6" height="14" fill="#9fb0ba"/><rect x="78" y="42" width="6" height="14" fill="#9fb0ba"/>'
        );
      case "brick":
        return (
          '<rect x="24" y="34" width="18" height="24" fill="#9a4f43"/><rect x="46" y="28" width="18" height="30" fill="#b25f50"/><rect x="68" y="36" width="18" height="22" fill="#8c453d"/><path d="M24 42h62M24 50h62M34 34v24M56 28v30M78 36v22" stroke="' +
          palette.line +
          '" stroke-width="1.5" opacity="0.55"/><circle cx="94" cy="21" r="7" fill="' +
          palette.accent +
          '"/>'
        );
      case "clock":
        return (
          '<rect x="54" y="22" width="18" height="38" fill="#6d5b45"/><polygon points="53,22 63,10 73,22" fill="#514433"/><circle cx="63" cy="32" r="7" fill="' +
          palette.accent +
          '"/><path d="M63 32v-4M63 32h4" stroke="' +
          palette.line +
          '" stroke-width="1.8" stroke-linecap="round"/><path d="M18 56h34l-8-20H26zM76 56h28l-8-18H82z" fill="#596274"/>'
        );
      case "opera":
        return (
          '<path d="M18 58c18-14 40-18 84-10v12H18z" fill="#257a9b"/><path d="M30 52c12-26 24-28 35 0z" fill="' +
          palette.accent +
          '"/><path d="M54 52c14-24 26-24 38 0z" fill="#e6efe9"/><path d="M44 52c11-14 22-16 34 0z" fill="#f8fbf7"/><path d="M20 62c34 4 62 3 90-4" stroke="' +
          palette.line +
          '" stroke-width="3" fill="none" opacity="0.35"/>'
        );
      default:
        return "";
    }
  }

  function svgDataUri(svg) {
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
  }

  function scenePoints(tile) {
    return tile.vpValue || 2;
  }

  function hasPlayerExploitedTile(tile, playerId) {
    return tile.exploitedBy[playerId];
  }

  function hasAnyExploitation(tile) {
    return tile.exploitedBy.some(Boolean);
  }

  function isFullyExploited(tile) {
    return tile.exploitedBy.every(Boolean);
  }

  function exploitationSummary(tile) {
    const exploiters = state.players
      .filter(function (player) {
        return hasPlayerExploitedTile(tile, player.id);
      })
      .map(function (player) {
        return player.name;
      });

    if (exploiters.length === 0) {
      return "";
    }

    if (exploiters.length === 1) {
      return "Only " + exploiters[0] + " has exploited it so far.";
    }

    return "Both players have exploited it.";
  }

  function addLog(message, visibility, playerId) {
    state.logEntries.unshift(logEntry(message, visibility, playerId));
    state.logEntries = state.logEntries.slice(0, CONFIG.logBuffer);
  }

  function logEntry(message, visibility, playerId) {
    return {
      message: message,
      visibility: visibility || "public",
      playerId: typeof playerId === "number" ? playerId : null
    };
  }

  function currentPlayer() {
    return state.players[state.currentPlayer];
  }

  function currentTile() {
    return getTile(currentPlayer().position);
  }

  function getTile(id) {
    return state.tilesById[id];
  }

  function getNeighbors(tile) {
    return HEX_DIRECTIONS.map(function (direction) {
      return getTile(tile.q + direction.q + "," + (tile.r + direction.r));
    }).filter(Boolean);
  }

  function scoreRow(label, value) {
    return '<div class="score-row"><span>' + label + "</span><strong>" + value + "</strong></div>";
  }

  function tag(text) {
    return '<span class="detail-tag">' + text + "</span>";
  }

  function formatHex(tile) {
    return "(" + tile.q + ", " + tile.r + ")";
  }

  function axialToPixel(q, r, size) {
    return {
      x: size * Math.sqrt(3) * (q + r / 2),
      y: size * 1.5 * r
    };
  }

  function hexPoints(x, y, size) {
    const points = [];
    for (let index = 0; index < 6; index += 1) {
      const angle = ((60 * index - 30) * Math.PI) / 180;
      points.push(
        (x + size * Math.cos(angle)).toFixed(2) + "," + (y + size * Math.sin(angle)).toFixed(2)
      );
    }
    return points.join(" ");
  }

  function hexDistance(q1, r1, q2, r2) {
    const s1 = -q1 - r1;
    const s2 = -q2 - r2;
    return Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs(s1 - s2));
  }

  function randomSeed() {
    return Math.floor(Math.random() * 1000000);
  }

  function shuffle(array, rng) {
    for (let index = array.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(rng() * (index + 1));
      const temp = array[index];
      array[index] = array[swapIndex];
      array[swapIndex] = temp;
    }
    return array;
  }

  function mulberry32(seed) {
    let current = seed >>> 0;
    return function () {
      current += 0x6d2b79f5;
      let t = current;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
})();

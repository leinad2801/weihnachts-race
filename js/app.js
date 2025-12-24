// 🌍 Sprache
let currentLang = "de"; // Standard: Deutsch

// 🌍 Texte für alle Sprachen
const TEXTS = {
  de: {
    startTitle: "🎄Willkommen beim Weihnachts-Race🎄",
    startButton: "Start",
    enterName: "Dein Name",
    checkAnswer: "Antwort prüfen",
    timer: "⏱️ Zeit",
    correct: "🎉 Richtig!",
    wrong: "❌ Falsch!",
    next: "Zum nächsten Rätsel →",
    finish: "🎁 Ergebnis ansehen",
    finishedTitle: name => `🎉 Klasse, ${name}!`,
    finalTime: time => `⏱️ Deine Zeit: ${time}`,
    finalErrors: errors => `❌ Fehlversuche gesamt: ${errors}`,
    adminTitle: "👑 Admin – Live-Rangliste"
  },
  en: {
    startTitle: "🎄Welcome to the Christmas Race🎄",
    startButton: "Start",
    enterName: "Your name",
    checkAnswer: "Check answer",
    timer: "⏱️ Time",
    correct: "🎉 Correct!",
    wrong: "❌ Wrong!",
    next: "Next puzzle →",
    finish: "🎁 View result",
    finishedTitle: name => `🎉 Well done, ${name}!`,
    finalTime: time => `⏱️ Your time: ${time}`,
    finalErrors: errors => `❌ Total mistakes: ${errors}`,
    adminTitle: "👑 Admin – Live leaderboard"
  }
};

function t(key, ...args) {
  const value = TEXTS[currentLang][key];
  return typeof value === "function" ? value(...args) : value;
}


// Screens
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const endScreen = document.getElementById("end-screen");

// Buttons
const startBtn = document.getElementById("startBtn");
const checkBtn = document.getElementById("checkBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const resetLeaderboardBtn = document.getElementById("resetLeaderboardBtn");
resetLeaderboardBtn.style.display = "none"; // Reset-Button standardmäßig verstecken

// Elemente
const title = document.getElementById("puzzle-title");
const question = document.getElementById("question");
const santaGrid = document.getElementById("santa-grid");
const textPuzzle = document.getElementById("text-puzzle");
const puzzleGame = document.getElementById("puzzle-game");
const mazeGame = document.getElementById("maze-game");
const mazeControls = document.getElementById("maze-controls");
const answerInput = document.getElementById("answer");
const feedback = document.getElementById("feedback");
const puzzleImage = document.getElementById("puzzle-image");
const errorCounter = document.getElementById("error-counter");
const hint = document.getElementById("hint");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const playerNameInput = document.getElementById("player-name");
const finalTitle = document.getElementById("final-title");
const leaderboardList = document.getElementById("leaderboard-list");

// Timer
const timerDisplay = document.getElementById("timer");
const finalTime = document.getElementById("final-time");
const finalErrors = document.getElementById("final-errors");

const firebaseConfig = {
  apiKey: "AIzaSyCuEzRaTwjVQbIG-WKFUxpjuF33V2FUk9M",
  authDomain: "weihnachts-race-web.firebaseapp.com",
  projectId: "weihnachts-race-web",
  storageBucket: "weihnachts-race-web.firebasestorage.app",
  messagingSenderId: "1090914728152",
  appId: "1:1090914728152:web:872fdc43e204f68b22bfad"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
function saveResultOnline() {
  console.log("🔥 saveResultOnline wurde aufgerufen");

  db.collection("results").add({
    name: playerName,
    time: getElapsedSeconds(),
    errors: totalWrongAttempts,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    console.log("✅ Ergebnis erfolgreich in Firestore gespeichert");
  })
  .catch(error => {
    console.error("❌ Fehler beim Speichern:", error);
  });
}

let leaderboardUnsubscribe = null;

function listenToLeaderboard() {
  // Falls Listener schon läuft → vorher stoppen
  if (leaderboardUnsubscribe) {
    leaderboardUnsubscribe();
  }

  leaderboardUnsubscribe = db
    .collection("results")
    .orderBy("time", "asc")
    .orderBy("errors", "asc")
    .limit(10)
    .onSnapshot(snapshot => {
      leaderboardList.innerHTML = "";

      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        const li = document.createElement("li");

        let medal = "";
        if (index === 0) {
          medal = "🥇 ";
          li.classList.add("leaderboard-gold");
        } else if (index === 1) {
          medal = "🥈 ";
          li.classList.add("leaderboard-silver");
        } else if (index === 2) {
          medal = "🥉 ";
          li.classList.add("leaderboard-bronze");
        }

        li.textContent = `${medal}${data.name} – ${data.time}s – ❌ ${data.errors}`;
        leaderboardList.appendChild(li);
      });
    }, error => {
      console.error("❌ Live-Rangliste Fehler:", error);
    });
}

function resetLeaderboardOnline() {
  const password = prompt("Admin-Passwort eingeben:");

  if (password !== "0000") {
    alert("❌ Falsches Passwort");
    return;
  }

  db.collection("results")
    .get()
    .then(snapshot => {
      const batch = db.batch();

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      return batch.commit();
    })
    .then(() => {
      alert("✅ Online-Rangliste wurde zurückgesetzt");
      leaderboardList.innerHTML = "";
    })
    .catch(error => {
      console.error("❌ Fehler beim Zurücksetzen:", error);
      alert("Fehler beim Löschen der Rangliste");
    });
}

// Status
let currentPuzzle = 0;
let wrongAttempts = 0;
let selectedPiece = null;
let endTime = null;
let startTime = null;
let timerInterval = null;
let totalWrongAttempts = 0;
let playerName = "";

const ADMIN_NAME = "ADMIN"; // Admin Name#

// 💾 Spielstand speichern
function saveGame() {
  const saveData = {
    playerName,
    currentPuzzle,
    totalWrongAttempts,
    startTime
  };
  localStorage.setItem("weihnachtsRaceSave", JSON.stringify(saveData));
}

// ♻️ Spielstand laden
function loadGame() {
  const data = localStorage.getItem("weihnachtsRaceSave");
  return data ? JSON.parse(data) : null;
}

// 🧹 Spielstand löschen
function clearGame() {
  localStorage.removeItem("weihnachtsRaceSave");
}


// Labyrinth
const maze = [
  ["S", 0, 1, 0, 0, 1],
  [1, 0, 1, 0, 1, 0],
  [0, 0, 0, 0, 1, 0],
  [0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0],
  [1, 1, 0, 0, 0, "G"]
];
let santaPos = { x: 0, y: 0 };

// ⏱️ Timer Funktionen
function updateTimer() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const s = String(elapsed % 60).padStart(2, "0");
  timerDisplay.textContent = `⏱️ Zeit: ${m}:${s}`;
}

function getFinalTime() {
  const end = endTime ?? Date.now();
  const elapsed = Math.floor((end - startTime) / 1000);
  return `${Math.floor(elapsed / 60)} Minuten ${elapsed % 60} Sekunden`;
}
function getElapsedSeconds() {
  const end = endTime ?? Date.now();
  return Math.floor((end - startTime) / 1000);
}

function saveResult() {
  const results = JSON.parse(localStorage.getItem("results")) || [];

  results.push({
    name: playerName,
    time: getElapsedSeconds(),
    errors: totalWrongAttempts
  });

  localStorage.setItem("results", JSON.stringify(results));
}
function renderLeaderboard() {
  const results = JSON.parse(localStorage.getItem("results")) || [];

  results.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return a.errors - b.errors;
  });

  leaderboardList.innerHTML = "";

  results.forEach((r, index) => {
  const li = document.createElement("li");

  // Medaillen für Top 3
  if (index === 0) li.classList.add("leaderboard-gold");
  if (index === 1) li.classList.add("leaderboard-silver");
  if (index === 2) li.classList.add("leaderboard-bronze");

  const medal =
    index === 0 ? "🥇 " :
    index === 1 ? "🥈 " :
    index === 2 ? "🥉 " : "";

  li.textContent = `${medal}${r.name} – ${r.time}s – ❌ ${r.errors}`;
  leaderboardList.appendChild(li);
});

}

// 🧩 Rätsel 1–10
const puzzles = [
  {
  type: "santa",
  title: {
    de: "🧩 Rätsel 1",
    en: "🧩 Puzzle 1"
  },
  question: {
    de: "Tippe auf den richtigen falschen Weihnachtsmann 🎅",
    en: "Tap the correct wrong Santa 🎅"
  },
  correctIndex: Math.floor(Math.random() * 6)
},
  {
  type: "text",
  title: {
    de: "🧩 Rätsel 2",
    en: "🧩 Puzzle 2"
  },
  question: {
    de: "Was hat viele Nadeln, kann aber nicht nähen?",
    en: "What has many needles but cannot sew?"
  },
  solutions: ["tannenbaum", "weihnachtsbaum", "christmas tree"],
  image: "assets/images/santa-thinking.png",
  hint: {
    de: "💡 Tipp: Künstlich oder echt …",
    en: "💡 Hint: Artificial or real …"
  },
  hintImage: "assets/images/christmas-tree.png"
},

  {
  type: "puzzle",
  title: {
    de: "🧩 Rätsel 3",
    en: "🧩 Puzzle 3"
  },
  question: {
    de: "Setze das Bild richtig zusammen 🎄",
    en: "Put the image together correctly 🎄"
  }
},
  {
  type: "emoji",
  title: {
    de: "🧩 Rätsel 4",
    en: "🧩 Puzzle 4"
  },
  question: {
    de: "Gesucht ist ein Songname der zu folgenden Emojis passt:<br><br>⏮️🎄",
    en: "Which song matches the following emojis?<br><br>⏮️🎄"
  },
  solutions: ["last christmas"],
  hint: {
    de: "💡 Hinweis: Ein sehr bekannter Song 🎤",
    en: "💡 Hint: A very famous Christmas song 🎤"
  },
  hintImage: "assets/images/wham.png"
},

  {
  type: "text",
  title: {
    de: "🧩 Rätsel 5",
    en: "🧩 Puzzle 5"
  },
  question: {
    de:
      "Ich stehe oft auf dem Tisch, mache Licht,<br>" +
      "bin warm und weich,<br>" +
      "wenn ich brenne, schenke ich oft Freude,<br>" +
      "aber wenn ich alt werde, bin ich klein und leer.",
    en:
      "I often stand on the table and give light,<br>" +
      "I am warm and soft,<br>" +
      "when I burn, I often bring joy,<br>" +
      "but when I get old, I am small and empty."
  },
  solutions: ["kerze", "kerzen", "candle"],
  image: "assets/images/candle.png",
  hint: {
    de: "Mich gibt es in vielen Formen & Düften …",
    en: "I come in many shapes and scents …"
  },
  hintImage: "assets/images/candle-hint.png"
},

  {
  type: "maze",
  title: {
    de: "🧩 Rätsel 6",
    en: "🧩 Puzzle 6"
  },
  question: {
    de: "Tippe Santa 🎅 durch das Labyrinth zum Geschenk 🎁",
    en: "Guide Santa 🎅 through the maze to the present 🎁"
  }
},
  {
  type: "emoji",
  title: {
    de: "🧩 Rätsel 7",
    en: "🧩 Puzzle 7"
  },
  question: {
    de: "Gesucht ist eine Filmreihe:<br><br>👦🏼🏠🙅‍♂️🙅‍♀️",
    en: "Which movie series is shown by these emojis?<br><br>👦🏼🏠🙅‍♂️🙅‍♀️"
  },
  solutions: [
    "kevin allein zu haus",
    "kevin allein zu hause",
    "home alone"
  ],
  hint: {
    de: "💡 Tipp: Ein Weihnachtsklassiker aus den 90ern …",
    en: "💡 Hint: A Christmas classic from the 90s …"
  },
  hintImage: "assets/images/home-alone.png"
},
{
  type: "text",
  title: {
    de: "🧩 Rätsel 8",
    en: "🧩 Puzzle 8"
  },
  question: {
    de:
      "Zahlenschloss 🔐<br><br>" +
      "S A N T A<br><br>" +
      "100⁰ − 1",
    en:
      "Number lock 🔐<br><br>" +
      "S A N T A<br><br>" +
      "100⁰ − 1"
  },
  solutions: ["5050"],
  hint: {
    de: "💡 Tipp: Die Summe von 1+2+...+100",
    en: "💡 Hint: The sum of 1+2+...+100"
  },
  hintImage: "assets/images/lock-hint.png"
},

  {
  type: "text",
  title: {
    de: "🧩 Rätsel 9",
    en: "🧩 Puzzle 9"
  },
  question: {
    de:
      "🎶 Vervollständige den Liedtext:<br><br>" +
      "Bitte gib die 3 Wörter einfach mit einem Leerzeichen getrennt unten ein.<br><br>"+
      "In der _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _<br>" +
      "Gibt es so manche _ _ _ _ _ _ _ _,<br>" +
      "Zwischen Mehl und _ _ _ _ _ ...",
    en:
      "🎶 Complete the song lyrics:<br><br>" +
      "Please enter the 3 words separated by spaces below.<br><br>" +
      "Last Christmas, i gave you my _ _ _ _ _<br>" +
      "But the very next das, you gave it _ _ _ _ <br>" +
      "This _ _ _ _, to save me from tears..."
  },
  solutions: {
    de: ["weihnachtsbäckerei", "leckerei", "milch"],
    en: ["heart", "away", "year"]
  },
  mode: "containsAll",
  hint: {
    de: "💡 Tipp: Ein schönes Kinderweihnachtslied... 🎄",
    en: "💡 Hint: A popular Christmas song 🎄"
  },
  hintImage: "assets/images/weihnachtsbaeckerei.png"
},

  {
  type: "text",
  title: {
    de: "🧩 Rätsel 10",
    en: "🧩 Puzzle 10"
  },
  question: {
    de: "Wie viele Rentiere hat der Weihnachtsmann?",
    en: "How many reindeer does Santa have?"
  },
  solutions: ["9"],
  image: "assets/images/rentier-santa.png",
  hint: {
    de: "💡 Tipp: Meine Rückennummer bei Tura Oberdrees.",
    en: "💡 Hint: Think of Rudolph and the others."
  },
  hintImage: "assets/images/rentier-santa.png"
}

];

// ▶️ START
startBtn.addEventListener("click", () => {
  const name = playerNameInput.value.trim();

  if (!name) {
    alert("Bitte gib zuerst deinen Namen ein 🎄");
    return;
  }

  playerName = name;

  // 🌍 Sprache erkennen
    if (name.toUpperCase().startsWith("EN")) {
    currentLang = "en";

  // Optional: EN_John → Name = John
    if (name.includes("_")) {
    playerName = name.split("_")[1];
  }
}


  // 👑 ADMIN-MODUS
  if (name.toUpperCase() === ADMIN_NAME) {
    startScreen.style.display = "none";
    endScreen.style.display = "block";

    finalTitle.textContent = "👑 Admin – Live-Rangliste";
    finalTime.textContent = "";
    finalErrors.textContent = "";

    resetLeaderboardBtn.style.display = "block"; // 🔓 Reset-Button für Admin sichtbar machen


    // Kein Spiel
    listenToLeaderboard();

    return; // Stopp
  }

  // NORMALER SPIELSTART
  startScreen.style.display = "none";
  gameScreen.style.display = "block";

  startTime = Date.now();
  saveGame();
  timerInterval = setInterval(updateTimer, 1000);

  loadPuzzle();
});



// 🔄 Rätsel laden
function loadPuzzle() {
  const puzzle = puzzles[currentPuzzle];
  checkBtn.textContent = t("checkAnswer");
  // Next-Button Text anpassen
  if (currentPuzzle === puzzles.length - 1) {
    nextBtn.textContent = t("finish");
  } else {
    nextBtn.textContent = t("next");
  }

  // Progress aktualisieren
  const progressPercent = (currentPuzzle / puzzles.length) * 100;
  progressBar.style.width = `${progressPercent}%`;
  progressText.textContent = `Rätsel ${currentPuzzle + 1} / ${puzzles.length}`;


  feedback.textContent = "";
  nextBtn.style.display = "none";
  wrongAttempts = 0;
  selectedPiece = null;

  santaGrid.innerHTML = "";
  puzzleGame.innerHTML = "";
  mazeGame.innerHTML = "";

  santaGrid.style.display = "none";
  textPuzzle.style.display = "none";
  puzzleGame.style.display = "none";
  mazeGame.style.display = "none";
  mazeControls.style.display = "none";
  puzzleImage.style.display = "none";
  errorCounter.style.display = "none";
  hint.style.display = "none";

  // 🌍 Titel setzen (String ODER Sprachobjekt)
  title.textContent =
    typeof puzzle.title === "object"
      ? puzzle.title[currentLang]
      : puzzle.title;

  // 🌍 Frage setzen (String ODER Sprachobjekt)
  question.innerHTML =
    typeof puzzle.question === "object"
      ? puzzle.question[currentLang]
      :puzzle.question;
  question.className = "";

  // 🎅 Rätsel 1
  if (puzzle.type === "santa") {
    santaGrid.style.display = "grid";
    for (let i = 0; i < 6; i++) {
      const div = document.createElement("div");
      div.className = "santa";
      const img = document.createElement("img");
      img.src =
        i === puzzle.correctIndex
          ? "assets/santas/happy.png"
          : "assets/santas/sad.png";
      div.appendChild(img);
      div.onclick = () => {
        if (i === puzzle.correctIndex) {
          feedback.textContent = t("correct");
          nextBtn.style.display = "block";
          saveGame();
        } else {
          feedback.textContent = t("wrong");
          totalWrongAttempts++;
          div.classList.add("shake");

          // Shake nach Animation wieder entfernen
          setTimeout(() => {
           div.classList.remove("shake");
          }, 350);
        }
      };

      santaGrid.appendChild(div);
    }
  }

  // ✏️ Text / Emoji
  if (puzzle.type === "text" || puzzle.type === "emoji") {
    textPuzzle.style.display = "block";
    answerInput.value = "";
    errorCounter.textContent = "Fehlversuche: 0 / 5";
    errorCounter.style.display = "block";

    if (puzzle.image) {
      puzzleImage.src = puzzle.image;
      puzzleImage.style.display = "block";
    }
  }

  // 🧩 Puzzle
  if (puzzle.type === "puzzle") {
    puzzleGame.style.display = "grid";
    setupPuzzle();
  }

  // 🧱 Labyrinth
  if (puzzle.type === "maze") {
    santaPos = { x: 0, y: 0 };
    mazeGame.style.display = "grid";
    mazeControls.style.display = "block";
    renderMaze();
  }
}

// ✔️ Prüfen
checkBtn.addEventListener("click", () => {
  const puzzle = puzzles[currentPuzzle];
  const answer = answerInput.value.toLowerCase().trim();

  let correct = false;

  if (puzzle.mode === "containsAll") {
  const solutions =
    typeof puzzle.solutions === "object"
      ? puzzle.solutions[currentLang]
      : puzzle.solutions;

  correct = solutions.every(w => answer.includes(w));
} else {
    correct = puzzle.solutions.some(sol => sol === answer);
  }

  if (correct) {
  feedback.textContent = t("correct");
  nextBtn.style.display = "block";

  // Letztes Rätsel → Zeit speichern & Timer stoppen
  if (currentPuzzle === puzzles.length - 1) {
    endTime = Date.now();
    clearInterval(timerInterval);
  }
  return;
 }
  wrongAttempts++;
  totalWrongAttempts++;
  saveGame();
  errorCounter.textContent = `Fehlversuche: ${wrongAttempts} / 5`;
  answerInput.value = "";

  if (wrongAttempts === 3 && puzzle.hint) {
    hint.textContent =
      typeof puzzle.hint === "object"
      ? puzzle.hint[currentLang]
      : puzzle.hint;

    hint.style.display = "block";
  }
  if (wrongAttempts === 5 && puzzle.hintImage) {
    puzzleImage.src = puzzle.hintImage;
    puzzleImage.style.display = "block";
  }
});

// 🧩 Puzzle-Logik
function setupPuzzle() {
  const order = [...Array(6).keys()].sort(() => Math.random() - 0.5);
  order.forEach(pos => {
    const piece = document.createElement("div");
    piece.className = "puzzle-piece";
    piece.dataset.correct = pos;
    const x = pos % 2;
    const y = Math.floor(pos / 2);
    piece.style.backgroundPosition = `${x * 100}% ${y * 50}%`;
    piece.onclick = () => handlePuzzleClick(piece);
    puzzleGame.appendChild(piece);
  });
}

function handlePuzzleClick(piece) {
  if (!selectedPiece) {
    selectedPiece = piece;
    piece.classList.add("selected");
    return;
  }
  swapPieces(selectedPiece, piece);
  selectedPiece.classList.remove("selected");
  selectedPiece = null;

  if (checkPuzzleSolved()) {
    feedback.textContent = "🎉 Puzzle gelöst!";
    nextBtn.style.display = "block";
    saveGame();
  }
}

function swapPieces(a, b) {
  [a.style.backgroundPosition, b.style.backgroundPosition] =
    [b.style.backgroundPosition, a.style.backgroundPosition];
  [a.dataset.correct, b.dataset.correct] =
    [b.dataset.correct, a.dataset.correct];
}

function checkPuzzleSolved() {
  return [...document.querySelectorAll(".puzzle-piece")]
    .every((p, i) => p.dataset.correct == i);
}

// 🧱 Labyrinth
function renderMaze() {
  mazeGame.innerHTML = "";
  mazeGame.style.gridTemplateColumns = `repeat(${maze[0].length}, 1fr)`;
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      const cell = document.createElement("div");
      cell.className = "maze-cell";
      if (maze[y][x] === 1) cell.classList.add("wall");
      if (maze[y][x] === "G") cell.textContent = "🎁";
      if (x === santaPos.x && y === santaPos.y) cell.textContent = "🎅";
      mazeGame.appendChild(cell);
    }
  }
}

mazeControls.addEventListener("click", e => {
  if (!e.target.dataset.dir) return;
  const moves = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
  const [dx, dy] = moves[e.target.dataset.dir];
  const nx = santaPos.x + dx;
  const ny = santaPos.y + dy;
  if (maze[ny] && maze[ny][nx] !== undefined && maze[ny][nx] !== 1) {
    santaPos = { x: nx, y: ny };
    renderMaze();
    if (maze[ny][nx] === "G") {
      feedback.textContent = "🎉 Geschafft!";
      nextBtn.style.display = "block";
      mazeControls.style.display = "none";
      saveGame();
    }
  }
});

// ➡️ Weiter
nextBtn.addEventListener("click", () => {
  currentPuzzle++;
  if (currentPuzzle < puzzles.length) {
    loadPuzzle();
    saveGame();
  } else {
    
    gameScreen.style.display = "none";
    endScreen.style.display = "block";
    
    // 🏁 Live-Scoreboard starten
    listenToLeaderboard();


    // 🎬 End-GIF neu starten
    const endImage = document.getElementById("end-image");
    endImage.src = "";
    endImage.src = "assets/images/end.gif";
    
    finalTitle.textContent = `🎉 Klasse, ${playerName}!`;
    finalTime.textContent = `⏱️ Deine Zeit: ${getFinalTime()}`;
    finalErrors.textContent = `❌ Fehlversuche gesamt: ${totalWrongAttempts}`;

    // 🏁 Rangliste
    saveResultOnline();
    clearGame();
  }
});

// 🔄 Neustart
restartBtn.addEventListener("click", () => {
  location.reload();
});

//Rangliste wird zurückgesetzt
resetLeaderboardBtn.addEventListener("click", () => {
  resetLeaderboardOnline();
});

window.addEventListener("load", () => {
  
  // 🌍 Startscreen-Texte setzen (WICHTIG!)
  document.querySelector("#start-screen h1").textContent = t("startTitle");
  startBtn.textContent = t("startButton");
  playerNameInput.placeholder = t("enterName");
  
  const save = loadGame();

  if (!save) return;
  if (save.playerName.toUpperCase() === ADMIN_NAME) return;

  const resume = confirm(
    `Spielstand von ${save.playerName} gefunden.\nMöchtest du weiterspielen?`
  );

  if (!resume) {
    clearGame();
    return;
  }

  // 🔄 Spielzustand wiederherstellen
  playerName = save.playerName;
  currentPuzzle = save.currentPuzzle;
  totalWrongAttempts = save.totalWrongAttempts;
  startTime = save.startTime;

  startScreen.style.display = "none";
  gameScreen.style.display = "block";

  timerInterval = setInterval(updateTimer, 1000);
  loadPuzzle();
});



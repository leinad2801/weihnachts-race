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



let startTime = null;
let timerInterval = null;

// Status
let currentPuzzle = 0;
let wrongAttempts = 0;
let selectedPiece = null;
let endTime = null;
let totalWrongAttempts = 0;
let playerName = "";




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
    title: "🧩 Rätsel 1",
    question: "Tippe auf den lachenden Weihnachtsmann 🎅",
    correctIndex: Math.floor(Math.random() * 6)
  },
  {
    type: "text",
    title: "🧩 Rätsel 2",
    question: "Was hat viele Nadeln, kann aber nicht nähen?",
    solutions: ["tannenbaum", "weihnachtsbaum"],
    image: "assets/images/santa-thinking.png",
    hint: "💡 Tipp: Künstlich oder echt …",
    hintImage: "assets/images/christmas-tree.png"
  },
  {
    type: "puzzle",
    title: "🧩 Rätsel 3",
    question: "Setze das Bild richtig zusammen 🎄"
  },
  {
    type: "emoji",
    title: "🧩 Rätsel 4",
    question:
      "Gesucht ist ein Songname:<br><br>⏮️🎄",
    solutions: ["last christmas"],
    hint: "💡 Hinweis: Ein sehr bekannter Song 🎤",
    hintImage: "assets/images/wham.png"
  },
  {
    type: "text",
    title: "🧩 Rätsel 5",
    question:
      "Ich stehe oft auf dem Tisch, mache Licht,<br>" +
      "bin warm und weich,<br>" +
      "wenn ich brenne, schenke ich oft Freude,<br>" +
      "aber wenn ich alt werde, bin ich klein und leer.",
    solutions: ["kerze", "kerzen"],
    image: "assets/images/candle.png",
    hint: "Mich gibt es in vielen Formen & Düften …",
    hintImage: "assets/images/candle-hint.png"
  },
  {
    type: "maze",
    title: "🧩 Rätsel 6",
    question: "Bringe Santa 🎅 durch das Labyrinth zum Geschenk 🎁"
  },
  {
    type: "emoji",
    title: "🧩 Rätsel 7",
    question:
      "Gesucht ist eine Filmreihe:<br><br>👦🏼🏠🙅‍♂️🙅‍♀️",
    solutions: ["kevin allein zu haus", "kevin allein zu hause"],
    hint: "💡 Tipp: Ein Weihnachtsklassiker aus den 90ern …",
    hintImage: "assets/images/home-alone.png"
  },
  {
    type: "text",
    title: "🧩 Rätsel 8",
    question:
      "Zahlenschloss 🔐<br><br>" +
      "S A N T A<br>" +
      "100⁰ − 1",
    solutions: ["5050"],
    hint: "💡 Tipp: Die Summe von 1+2+...+100",
    hintImage: "assets/images/lock-hint.png"
  },
  {
    type: "text",
    title: "🧩 Rätsel 9",
    question:
      "🎶 Vervollständige den Liedtext:<br><br>" +
      "Rockin’ around the Christmas ___<br>" +
      "at the Christmas ___ hop,<br>" +
      "mistletoe hung where ___ can see",
    solutions: ["tree", "party", "you"],
    mode: "containsAll",
    hint: "💡 Tipp: Ein fröhlicher Weihnachtsklassiker 🎄",
    hintImage: "assets/images/rockin-tree.png"
  },
  {
    type: "text",
    title: "🧩 Rätsel 10",
    question: "Wie viele Rentiere hat der Weihnachtsmann?",
    solutions: ["9"],
    image: "assets/images/rentier-santa.png",
    hint: "💡 Tipp: Denk an Rudolph & Co.",
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

  startScreen.style.display = "none";
  gameScreen.style.display = "block";

  // Timer startet ERST hier
  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);

  loadPuzzle();
});


// 🔄 Rätsel laden
function loadPuzzle() {
  const puzzle = puzzles[currentPuzzle];
  // Next-Button Text anpassen
  if (currentPuzzle === puzzles.length - 1) {
    nextBtn.textContent = "🎁 Ergebnis ansehen";
  } else {
    nextBtn.textContent = "Zum nächsten Rätsel →";
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

  title.textContent = puzzle.title;
  question.innerHTML = puzzle.question;
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
          feedback.textContent = "🎉 Richtig!";
          nextBtn.style.display = "block";
        } else {
          feedback.textContent = "❌ Falsch!";
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
    correct = puzzle.solutions.every(w => answer.includes(w));
  } else {
    correct = puzzle.solutions.some(sol => sol === answer);
  }

  if (correct) {
  feedback.textContent = "🎉 Richtig!";
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
  errorCounter.textContent = `Fehlversuche: ${wrongAttempts} / 5`;
  answerInput.value = "";

  if (wrongAttempts === 3 && puzzle.hint) {
    hint.textContent = puzzle.hint;
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
    }
  }
});

// ➡️ Weiter
nextBtn.addEventListener("click", () => {
  currentPuzzle++;
  if (currentPuzzle < puzzles.length) {
    loadPuzzle();
  } else {
    gameScreen.style.display = "none";
    endScreen.style.display = "block";

    finalTitle.textContent = `🎉 Klasse, ${playerName}!`;
    finalTime.textContent = `⏱️ Deine Zeit: ${getFinalTime()}`;
    finalErrors.textContent = `❌ Fehlversuche gesamt: ${totalWrongAttempts}`;

    // 🏁 Rangliste
    saveResult();
    renderLeaderboard();
  }
});

// 🔄 Neustart
restartBtn.addEventListener("click", () => {
  location.reload();
});

//Rangliste wird zurückgesetzt
resetLeaderboardBtn.addEventListener("click", () => {
  const password = prompt("Admin-Passwort eingeben:");

  if (password !== "0000") {
    alert("❌ Falsches Passwort");
    return;
  }

  localStorage.removeItem("results");
  renderLeaderboard();
  alert("✅ Rangliste wurde zurückgesetzt");
});


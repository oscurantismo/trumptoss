// game.js – updated with username display and backend-safe token decode (non-module)

let game;
let punches = 0;
let username = "Anonymous";
let activeTab = "game";

window.onload = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const gameConfig = {
    type: Phaser.AUTO,
    width: width,
    height: height,
    backgroundColor: "#ffffff",
    scene: {
      preload,
      create,
      update,
    },
  };

  game = new Phaser.Game(gameConfig);
};

let trump, shoeCursor, punchesText;
let punchSounds = [];
let trumpOriginalTexture = "trump";
let trumpHitTexture = "trump_hit";
let hitCooldown = false;
let soundEnabled = true;
let soundButton;

function preload() {
  this.load.image("trump", "trump.png");
  this.load.image("trump_hit", "trump_hit.png");
  this.load.image("shoe", "shoe.png");
  this.load.image("sound_on", "sound_on.png");
  this.load.image("sound_off", "sound_off.png");

  for (let i = 1; i <= 4; i++) {
    this.load.audio("punch" + i, `punch${i}.mp3`);
  }
}

function create() {
  decodeToken();
  renderTabs();
  showTab("game", this);
  displayUsername();
}

function decodeToken() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (token && window.jwt_decode) {
    try {
      const decoded = jwt_decode(token);
      console.log("✅ Decoded JWT:", decoded);
      if (decoded.username) {
        username = decoded.username;
      }
    } catch (e) {
      console.error("❌ Invalid JWT token", e);
    }
  } else {
    console.warn("⚠️ No token found in URL");
  }
}

function displayUsername() {
  const tag = document.createElement("div");
  tag.innerText = `👤 ${username}`;
  tag.style.position = "absolute";
  tag.style.top = "50px";
  tag.style.left = "0";
  tag.style.width = "100%";
  tag.style.textAlign = "center";
  tag.style.fontSize = "16px";
  tag.style.fontWeight = "bold";
  tag.style.color = "#333";
  tag.style.background = "#ffffffcc";
  tag.style.padding = "6px 10px";
  tag.style.zIndex = "1000";
  document.body.appendChild(tag);
}

function renderTabs() {
  const tabContainer = document.createElement("div");
  tabContainer.id = "tab-container";
  tabContainer.style.position = "absolute";
  tabContainer.style.top = "0";
  tabContainer.style.left = "0";
  tabContainer.style.width = "100%";
  tabContainer.style.display = "flex";
  tabContainer.style.justifyContent = "center";
  tabContainer.style.backgroundColor = "#eee";

  ["game", "leaderboard"].forEach((tab) => {
    const button = document.createElement("button");
    button.innerText = tab.charAt(0).toUpperCase() + tab.slice(1);
    button.style.margin = "10px";
    button.onclick = () => showTab(tab, game.scene.scenes[0]);
    tabContainer.appendChild(button);
  });

  document.body.appendChild(tabContainer);
}

function showTab(tabName, scene) {
  activeTab = tabName;
  if (tabName === "game") {
    setupGame(scene);
  } else if (tabName === "leaderboard") {
    window.location.href = "https://trumptossleaderboard-production.up.railway.app/leaderboard-page";
  }
}

function setupGame(scene) {
  trump = scene.physics.add.sprite(400, 300, "trump").setInteractive();
  shoeCursor = scene.physics.add.sprite(400, 600, "shoe").setCollideWorldBounds(true);

  for (let i = 1; i <= 4; i++) {
    punchSounds.push(scene.sound.add("punch" + i));
  }

  trump.on("pointerdown", () => handlePunch(scene));

  punches = parseInt(localStorage.getItem("punches")) || 0;
  punchesText = scene.add.text(20, 90, "Punches: " + punches, {
    fontSize: "24px",
    fill: "#000"
  });

  soundButton = scene.add.image(scene.sys.game.config.width - 40, 40, "sound_on").setInteractive().setScale(0.5);
  soundButton.on("pointerdown", () => toggleSound());
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const texture = soundEnabled ? "sound_on" : "sound_off";
  soundButton.setTexture(texture);
}

function handlePunch(scene) {
  punches++;
  punchesText.setText("Punches: " + punches);
  localStorage.setItem("punches", punches);

  if (soundEnabled && punchSounds.length > 0) {
    const randomSound = Phaser.Math.RND.pick(punchSounds);
    randomSound.play();
  }

  if (!hitCooldown) {
    hitCooldown = true;
    trump.setTexture(trumpHitTexture);
    setTimeout(() => {
      trump.setTexture(trumpOriginalTexture);
      hitCooldown = false;
    }, 200);
  }

  submitScore(punches);
}

function submitScore(score) {
  console.log(`📤 Submitting score: ${score} for ${username}`);

  fetch("https://trumptossleaderboard-production.up.railway.app/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, score }),
  })
    .then((res) => res.json())
    .then((data) => console.log("✅ Score submitted:", data))
    .catch((err) => console.error("❌ Error submitting score:", err));
}

function update() {
  // game loop, if needed
}

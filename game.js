let username = "Anonymous";
let userId = null;
let punches = 0;
let punchesText;
let hitCooldown = false;
let soundEnabled = true;

let trump;
let trumpOriginalTexture = "trump";
let trumpHitTexture = "trump_hit";
let punchSounds = [];

// Decode JWT token from URL and extract username
function decodeToken() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (token && window.jwt_decode) {
    try {
      const decoded = jwt_decode(token);
      username = decoded.username || decoded.name || "Anonymous";
      userId = decoded.user_id || null;
      console.log("✅ Decoded user:", username);
    } catch (err) {
      console.error("❌ Invalid JWT token", err);
    }
  } else {
    console.warn("⚠️ No token provided in URL");
  }
}

// Show username at the top-left
function showUsername() {
  const tag = document.createElement("div");
  tag.innerText = `👤 ${username}`;
  tag.style.position = "absolute";
  tag.style.top = "10px";
  tag.style.left = "10px";
  tag.style.fontSize = "16px";
  tag.style.fontWeight = "bold";
  tag.style.color = "#333";
  tag.style.background = "#ffffffcc";
  tag.style.padding = "6px 10px";
  tag.style.borderRadius = "10px";
  tag.style.zIndex = "1000";
  document.body.appendChild(tag);
}

// Submit score to Railway leaderboard
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

// Game logic setup
decodeToken();
showUsername();

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  scene: {
    preload,
    create,
    update
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 600 },
      debug: false
    }
  }
};

const game = new Phaser.Game(config);

function preload() {
  this.load.image("trump", "trump.png");
  this.load.image("trump_hit", "trump_hit.png");
  this.load.image("shoe", "shoe.png");
  this.load.audio("punch1", "punch1.mp3");
  this.load.audio("punch2", "punch2.mp3");
  this.load.audio("punch3", "punch3.mp3");
}

function create() {
  trump = this.physics.add.sprite(400, 300, "trump").setInteractive();
  const shoe = this.physics.add.sprite(400, 600, "shoe").setCollideWorldBounds(true);

  punchSounds = [
    this.sound.add("punch1"),
    this.sound.add("punch2"),
    this.sound.add("punch3")
  ];

  trump.on("pointerdown", handlePunch.bind(this));

  punches = parseInt(localStorage.getItem("punches")) || 0;
  punchesText = this.add.text(20, 50, "Punches: " + punches, {
    fontSize: "24px",
    fill: "#000"
  });
}

function handlePunch() {
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

function update() {
  // No dynamic physics needed for now
}

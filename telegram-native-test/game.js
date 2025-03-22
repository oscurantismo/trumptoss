let game;
let punches = 0;

window.onload = () => {
  const gameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#ffffff",
    scene: { preload, create, update }
  };
  game = new Phaser.Game(gameConfig);
};

let trump, shoeCursor, punchesText, punchSounds = [];
let hitCooldown = false, soundEnabled = true;
let soundButton;
let trumpOriginal = "trump", trumpHit = "trump_hit";

function preload() {
  this.load.image("trump", "trump.png");
  this.load.image("trump_hit", "trump_hit.png");
  this.load.image("shoe", "shoe.png");
  this.load.image("sound_on", "sound_on.png");
  this.load.image("sound_off", "sound_off.png");

  for (let i = 1; i <= 4; i++) this.load.audio("punch" + i, `punch${i}.mp3`);
}

function create() {
  const heightTarget = this.scale.height * 0.6;
  const scale = heightTarget / this.textures.get("trump").getSourceImage().height;

  trump = this.add.image(this.scale.width / 2, this.scale.height / 2, trumpOriginal)
    .setScale(scale)
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  punchesText = this.add.text(20, 20, "Punches: 0", {
    fontSize: Math.round(this.scale.width * 0.05) + "px", fill: "#000"
  });

  for (let i = 1; i <= 4; i++) punchSounds.push(this.sound.add("punch" + i));

  this.input.setDefaultCursor("none");
  shoeCursor = this.add.image(0, 0, "shoe").setScale(0.5).setDepth(999);

  // Sound toggle
  const iconSize = 50;
  soundButton = this.add.image(this.scale.width - iconSize / 2 - 20, iconSize / 2 + 20, "sound_on")
    .setInteractive()
    .setDisplaySize(iconSize, iconSize)
    .setOrigin(0.5);

  soundButton.on("pointerdown", () => {
    soundEnabled = !soundEnabled;
    soundButton.setTexture(soundEnabled ? "sound_on" : "sound_off");
  });

  // Enable punching
  trump.on("pointerdown", handlePunch);
}

function handlePunch() {
  punches++;
  punchesText.setText("Punches: " + punches);

  if (soundEnabled) {
    const sound = Phaser.Math.RND.pick(punchSounds);
    sound.play();
  }

  if (!hitCooldown) {
    hitCooldown = true;
    trump.setTexture(trumpHit);
    setTimeout(() => {
      trump.setTexture(trumpOriginal);
      hitCooldown = false;
    }, 200);
  }

  // ✅ Submit score to Telegram built-in leaderboard
  if (typeof TelegramGameProxy !== "undefined" && TelegramGameProxy.postEvent) {
    TelegramGameProxy.postEvent("score", punches);
    console.log("🎯 Score submitted:", punches);
  } else {
    console.warn("⚠️ TelegramGameProxy not available");
  }
}

function update() {
  const pointer = this.input.activePointer;
  shoeCursor.x = pointer.x;
  shoeCursor.y = pointer.y;
}

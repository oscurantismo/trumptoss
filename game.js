let game;
let punches = 0;

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
            update
        }
    };

    game = new Phaser.Game(gameConfig);
};

let trump, shoeCursor, punchesText, punchSounds = [], hitCooldown = false;
let trumpOriginalTexture = "trump";
let trumpHitTexture = "trump_hit";
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
    // Telegram WebApp setup
    Telegram.WebApp.ready();
    console.log("✅ Telegram WebApp ready");

    const initData = Telegram.WebApp.initData;
    const initDataUnsafe = Telegram.WebApp.initDataUnsafe;

    console.log("🧾 Telegram initData:", initData);
    console.log("🧾 Telegram initDataUnsafe:", initDataUnsafe);

    let username = "Anonymous";

    if (initDataUnsafe && initDataUnsafe.user) {
        console.log("👤 Telegram user object:", initDataUnsafe.user);
        username = initDataUnsafe.user.username || `user_${initDataUnsafe.user.id}`;
    } else {
        console.warn("⚠️ No Telegram user info found. Game may have been opened outside Telegram.");
    }

    fetch("https://trumptossleaderboard-production.up.railway.app/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
    })
    .then(res => res.json())
    .then(data => console.log("📝 Register response:", data))
    .catch(err => console.error("❌ Register error:", err));

    // Game UI
    const savedScore = localStorage.getItem("punches");
    if (savedScore !== null) punches = parseInt(savedScore);

    const targetHeight = this.scale.height * 0.6;
    const trumpScale = targetHeight / this.textures.get("trump").getSourceImage().height;

    trump = this.add.image(this.scale.width / 2, this.scale.height / 2, trumpOriginalTexture)
        .setScale(trumpScale)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

    punchesText = this.add.text(20, 20, "Punches: " + punches, {
        fontSize: Math.round(this.scale.width * 0.05) + "px",
        fill: "#000"
    });

    for (let i = 1; i <= 4; i++) {
        punchSounds.push(this.sound.add("punch" + i));
    }

    this.input.setDefaultCursor("none");
    shoeCursor = this.add.image(this.input.activePointer.x, this.input.activePointer.y, "shoe")
        .setScale(0.5)
        .setDepth(999);

    const iconSize = 50;
    soundButton = this.add.image(this.scale.width - iconSize / 2 - 20, iconSize / 2 + 20, "sound_on")
        .setInteractive()
        .setDisplaySize(iconSize, iconSize)
        .setOrigin(0.5);

    soundButton.on("pointerdown", () => {
        soundEnabled = !soundEnabled;
        soundButton.setTexture(soundEnabled ? "sound_on" : "sound_off");
    });

    trump.on("pointerdown", () => handlePunch(username));
}

function handlePunch(username) {
    punches++;
    punchesText.setText("Punches: " + punches);
    localStorage.setItem("punches", punches);

    if (soundEnabled) {
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

    console.log(`📤 Submitting score: ${punches} for ${username}`);

    fetch("https://trumptossleaderboard-production.up.railway.app/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, score: punches })
    })
    .then(res => res.json())
    .then(data => console.log("✅ Score submitted:", data))
    .catch(err => console.error("❌ Error submitting score:", err));
}

function update() {
    const pointer = this.input.activePointer;
    if (shoeCursor) {
        shoeCursor.setPosition(pointer.x, pointer.y);
    }
}

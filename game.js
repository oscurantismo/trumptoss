// === game.js ===

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

let trump, shoeCursor, punchesText, leaderboardButton, closeLeaderboardButton;
let punchSounds = [];
let trumpOriginalTexture = "trump";
let trumpHitTexture = "trump_hit";
let hitCooldown = false;
let soundEnabled = true;
let soundButton;
let leaderboardPanel, leaderboardIframe;

function preload() {
    this.load.image("trump", "trump.png");
    this.load.image("trump_hit", "trump_hit.png");
    this.load.image("shoe", "shoe.png");
    this.load.image("sound_on", "sound_on.png");
    this.load.image("sound_off", "sound_off.png");
    this.load.image("leaderboard_btn", "leaderboard_btn.png");

    for (let i = 1; i <= 4; i++) {
        this.load.audio("punch" + i, `punch${i}.mp3`);
    }
}

function create() {
    const savedScore = localStorage.getItem("punches");
    if (savedScore !== null) punches = parseInt(savedScore);

    const targetHeight = this.scale.height * 0.6;
    const originalTrumpImage = this.textures.get("trump").getSourceImage();
    const trumpScale = targetHeight / originalTrumpImage.height;

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

    leaderboardButton = this.add.text(20, 80, "🏆 Leaderboard", {
        fontSize: Math.round(this.scale.width * 0.045) + "px",
        fill: "#0077cc",
        backgroundColor: "#eee",
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
        borderRadius: 5
    }).setInteractive();

    leaderboardButton.on("pointerdown", () => {
        showEmbeddedLeaderboard(this);
    });

    trump.on("pointerdown", () => handlePunch());
}

function showEmbeddedLeaderboard(scene) {
    leaderboardPanel = scene.add.rectangle(scene.scale.width / 2, scene.scale.height / 2, scene.scale.width, scene.scale.height, 0xffffff)
        .setOrigin(0.5)
        .setDepth(2000);

    const domContainer = document.createElement("div");
    domContainer.id = "leaderboard-container";
    domContainer.style.position = "absolute";
    domContainer.style.top = "0";
    domContainer.style.left = "0";
    domContainer.style.width = "100%";
    domContainer.style.height = "100%";
    domContainer.style.zIndex = "1000";
    domContainer.style.backgroundColor = "rgba(255, 255, 255, 0.98)";

    leaderboardIframe = document.createElement("iframe");
    leaderboardIframe.src = "https://trumptossleaderboard-production.up.railway.app/leaderboard-page";
    leaderboardIframe.style.width = "100%";
    leaderboardIframe.style.height = "85%";
    leaderboardIframe.style.border = "none";

    const reloadBtn = document.createElement("button");
    reloadBtn.innerText = "🔄 Reload Leaderboard";
    reloadBtn.style.width = "100%";
    reloadBtn.style.height = "7%";
    reloadBtn.style.border = "none";
    reloadBtn.style.fontSize = "1em";
    reloadBtn.style.cursor = "pointer";
    reloadBtn.style.background = "#d9d9d9";

    reloadBtn.onclick = () => {
        leaderboardIframe.contentWindow.location.reload();
    };

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "✖ Close";
    closeBtn.style.width = "100%";
    closeBtn.style.height = "8%";
    closeBtn.style.border = "none";
    closeBtn.style.fontSize = "1.2em";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.background = "#eee";

    closeBtn.onclick = () => {
        domContainer.remove();
        leaderboardPanel.destroy();
    };

    domContainer.appendChild(leaderboardIframe);
    domContainer.appendChild(reloadBtn);
    domContainer.appendChild(closeBtn);
    document.body.appendChild(domContainer);
}

function handlePunch() {
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

    const username = typeof Telegram !== "undefined" && Telegram.WebApp?.initDataUnsafe?.user?.username
        ? Telegram.WebApp.initDataUnsafe.user.username
        : "Anonymous";

    console.log("Submitting score:", punches, "as", username);

    fetch("https://trumptossleaderboard-production.up.railway.app/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, score: punches })
    })
    .then(res => {
        if (!res.ok) {
            console.error("❌ Submission failed:", res.status);
        } else {
            console.log("✅ Score submitted");
        }
    })
    .catch(err => {
        console.error("❌ Error submitting score:", err);
    });

}

function update() {
    const pointer = this.input.activePointer;
    shoeCursor.setPosition(pointer.x, pointer.y);
}

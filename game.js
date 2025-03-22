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

let trump, shoeCursor, punchesText, leaderboardButton;
let punchSounds = [];
let trumpOriginalTexture = "trump";
let trumpHitTexture = "trump_hit";
let hitCooldown = false;
let soundEnabled = true;
let soundButton;
let pointerPreviouslyDown = false;

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
        .setOrigin(0.5);

    punchesText = this.add.text(20, 20, "Punches: " + punches, {
        fontSize: Math.round(this.scale.width * 0.05) + "px",
        fill: "#000"
    });

    for (let i = 1; i <= 4; i++) {
        punchSounds.push(this.sound.add("punch" + i));
    }

    this.input.setDefaultCursor("none");
    shoeCursor = this.add.image(0, 0, "shoe").setScale(0.5).setDepth(1);

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
        fetch("https://web-production-5454.up.railway.app/")
            .then(res => res.json())
            .then(data => {
                const text = data.map((entry, i) =>
                    `${i + 1}. ${entry.username}: ${entry.score}`
                ).join("\n");

                alert("🏆 Top Players:\n\n" + text);
            })
            .catch(() => alert("Failed to load leaderboard."));
    });
}

function update() {
    const pointer = this.input.activePointer;
    shoeCursor.x = pointer.x;
    shoeCursor.y = pointer.y;

    if (pointer.isDown && !pointerPreviouslyDown) {
        const bounds = trump.getBounds();
        if (Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y)) {
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

            fetch("https://web-production-5454.up.railway.app/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: Telegram.WebApp.initDataUnsafe.user?.username || "Anonymous",
                    score: punches
                })
            });
        }
    }

    pointerPreviouslyDown = pointer.isDown;
}

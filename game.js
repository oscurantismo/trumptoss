let game;

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

let trump, shoeCursor, punches = 0, punchesText;
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
    this.load.image("sound_on", "sound_on.png");   // Add a speaker icon
    this.load.image("sound_off", "sound_off.png"); // Add a muted speaker icon

    for (let i = 1; i <= 4; i++) {
        this.load.audio("punch" + i, `punch${i}.mp3`);
    }
}

function create() {
    // Centered Trump
    trump = this.add.image(this.scale.width / 2, this.scale.height / 2, trumpOriginalTexture).setScale(0.8);
    trump.setOrigin(0.5);

    // Punch counter
    punchesText = this.add.text(20, 20, "Punches: 0", {
        fontSize: Math.round(this.scale.width * 0.05) + "px",
        fill: "#000"
    });

    // Load punch sounds
    for (let i = 1; i <= 4; i++) {
        punchSounds.push(this.sound.add("punch" + i));
    }

    // Hide cursor and show shoe
    this.input.setDefaultCursor("none");
    shoeCursor = this.add.image(0, 0, "shoe").setScale(0.5).setDepth(1);

    // Add sound toggle button in top-right corner
    const iconSize = 48;
    soundButton = this.add.image(this.scale.width - iconSize - 20, 20 + iconSize / 2, "sound_on")
        .setInteractive()
        .setScrollFactor(0)
        .setScale(0.8)
        .setOrigin(0.5);

    soundButton.on("pointerdown", () => {
        soundEnabled = !soundEnabled;
        soundButton.setTexture(soundEnabled ? "sound_on" : "sound_off");
    });
}

function update() {
    const pointer = this.input.activePointer;
    shoeCursor.x = pointer.x;
    shoeCursor.y = pointer.y;

    if (pointer.isDown && !pointer.wasDown) {
        pointer.wasDown = true;

        const bounds = trump.getBounds();
        if (Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y)) {
            punches++;
            punchesText.setText("Punches: " + punches);

            // Play punch sound if sound is on
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
        }
    }

    if (!pointer.isDown) {
        pointer.wasDown = false;
    }
}

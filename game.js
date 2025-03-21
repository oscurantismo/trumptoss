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

function preload() {
    this.load.image("trump", "trump.png");
    this.load.image("trump_hit", "trump_hit.png");
    this.load.image("shoe", "shoe.png");

    // Load multiple punch sounds
    for (let i = 1; i <= 4; i++) {
        this.load.audio("punch" + i, `punch${i}.mp3`);
    }
}

function create() {
    // Add Trump image
    trump = this.add.image(this.scale.width / 2, this.scale.height / 2, trumpOriginalTexture).setScale(0.8);

    // Add score text
    punchesText = this.add.text(20, 20, "Punches: 0", {
        fontSize: Math.round(this.scale.width * 0.05) + "px",
        fill: "#000"
    });

    // Add punch sounds to array
    for (let i = 1; i <= 4; i++) {
        punchSounds.push(this.sound.add("punch" + i));
    }

    // Custom cursor (shoe image)
    this.input.setDefaultCursor("none");
    shoeCursor = this.add.image(0, 0, "shoe").setScale(0.5).setDepth(1);
}

function update() {
    const pointer = this.input.activePointer;

    // Move shoe with pointer
    shoeCursor.x = pointer.x;
    shoeCursor.y = pointer.y;

    if (pointer.isDown && !pointer.wasDown) {
        pointer.wasDown = true;

        const bounds = trump.getBounds();
        if (Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y)) {
            // Increase punch count
            punches++;
            punchesText.setText("Punches: " + punches);

            // Play a random punch sound
            const randomSound = Phaser.Math.RND.pick(punchSounds);
            randomSound.play();

            // Change Trump texture briefly
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

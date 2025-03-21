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

let trump, shoeCursor, score = 0, scoreText;

function preload() {
    this.load.image("trump", "trump.png");
    this.load.image("shoe", "shoe.png");
}

function create() {
    // Add Trump in the centre with larger scale
    trump = this.add.image(this.scale.width / 2, this.scale.height / 2, "trump").setScale(0.8);

    // Score text (top-left, scalable size)
    scoreText = this.add.text(20, 20, "Score: 0", {
        fontSize: Math.round(this.scale.width * 0.05) + "px",
        fill: "#000"
    });

    // Hide cursor
    this.input.setDefaultCursor('none');

    // Shoe as fake cursor
    shoeCursor = this.add.image(0, 0, "shoe").setScale(0.5);
    shoeCursor.setDepth(1);
}

function update() {
    const pointer = this.input.activePointer;

    // Follow mouse/finger
    shoeCursor.x = pointer.x;
    shoeCursor.y = pointer.y;

    // On click/tap
    if (pointer.isDown && !pointer.wasDown) {
        pointer.wasDown = true;

        const bounds = trump.getBounds();
        if (Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y)) {
            score++;
            scoreText.setText("Score: " + score);
        }
    }

    if (!pointer.isDown) {
        pointer.wasDown = false;
    }
}

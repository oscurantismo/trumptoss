const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#ffffff", // White background
    scene: {
        preload,
        create,
        update
    }
};

let game = new Phaser.Game(gameConfig);

let trump, shoeCursor, score = 0, scoreText;

function preload() {
    this.load.image("trump", "trump.png"); // Your image must be present in root
    this.load.image("shoe", "shoe.png");
}

function create() {
    // Center Trump in the middle
    trump = this.add.image(game.config.width / 2, game.config.height / 2, "trump").setScale(0.5);

    // Score display
    scoreText = this.add.text(10, 10, "Score: 0", { fontSize: "28px", fill: "#000" });

    // Hide default cursor
    this.input.setDefaultCursor('none');

    // Add shoe cursor that follows mouse
    shoeCursor = this.add.image(0, 0, "shoe").setScale(0.3);
    shoeCursor.setDepth(1); // Always on top
}

function update() {
    // Shoe follows pointer
    const pointer = this.input.activePointer;
    shoeCursor.x = pointer.x;
    shoeCursor.y = pointer.y;

    // Handle click
    if (pointer.isDown && !pointer.wasDown) {
        pointer.wasDown = true;

        // Check if click is on Trump
        const bounds = trump.getBounds();
        if (Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y)) {
            score++;
            scoreText.setText("Score: " + score);
        }
    }

    // Reset click flag
    if (!pointer.isDown) {
        pointer.wasDown = false;
    }
}

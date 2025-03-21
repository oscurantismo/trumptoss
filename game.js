const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: { default: "arcade" },
    scene: { preload, create, update }
};

let game = new Phaser.Game(gameConfig);
let trump, shoe, score = 0, scoreText;

function preload() {
    this.load.image("trump", "trump.png");  // Replace with actual Trump image
    this.load.image("shoe", "shoe.png");    // Replace with actual shoe image
}

function create() {
    trump = this.add.image(400, 300, "trump").setScale(0.5);
    scoreText = this.add.text(10, 10, "Score: 0", { fontSize: "32px", fill: "#fff" });

    this.input.on("pointerdown", (pointer) => {
        shoe = this.add.image(pointer.x, pointer.y, "shoe").setScale(0.3);
        this.tweens.add({
            targets: shoe,
            x: trump.x,
            y: trump.y,
            duration: 500,
            onComplete: () => {
                score++;
                scoreText.setText("Score: " + score);
                shoe.destroy();
            }
        });
    });
}

function update() { }

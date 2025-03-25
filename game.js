let game;
let punches = 0;
let activeTab = "game";
let storedUsername = "Anonymous";
let userId = "";

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

let trump, shoeCursor, punchSounds = [], punchesText, soundButton;
let trumpFrames = [];
let hitCooldown = false;
let soundEnabled = true;

function preload() {
    for (let i = 1; i <= 30; i++) {
        const frameName = `trump${i}`;
        trumpFrames.push(frameName);
        // Note: use encoded space %20 for "trump (i).png"
        this.load.image(frameName, `trump-images/trump%20(${i}).png`);
    }

    this.load.image("shoe", "shoe.png");
    this.load.image("sound_on", "sound_on.png");
    this.load.image("sound_off", "sound_off.png");

    for (let i = 1; i <= 4; i++) {
        this.load.audio("punch" + i, "punch" + i + ".mp3");
    }
}

function create() {
    Telegram.WebApp.ready();
    const initUser = Telegram.WebApp.initDataUnsafe?.user;
    if (initUser) {
        storedUsername = initUser.username || `${initUser.first_name}_${initUser.last_name || ""}`.trim();
        userId = initUser.id.toString();
    }

    const cached = localStorage.getItem(`score_${userId}`);
    if (cached !== null) {
        punches = parseInt(cached);
    }

    fetch("https://trumptossleaderboard-production.up.railway.app/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: storedUsername, user_id: userId })
    })
    .then(() => fetch("https://trumptossleaderboard-production.up.railway.app/leaderboard"))
    .then(res => res.json())
    .then(scores => {
        const entry = scores.find(u => u.user_id == userId);
        if (entry && entry.score > punches) {
            punches = entry.score;
            localStorage.setItem(`score_${userId}`, punches);
        }
        renderTopBar();
        renderTabs();
        showTab("game", this);
    });
}

function renderTopBar() {
    const top = document.createElement("div");
    top.style.position = "absolute";
    top.style.top = "0";
    top.style.left = "1rem";
    top.style.background = "#fff";
    top.style.color = "#000";
    top.style.border = "2px solid #0047ab";
    top.style.borderRadius = "10px";
    top.style.fontFamily = "'Arial Black', sans-serif";
    top.style.padding = "6px 12px";
    top.style.zIndex = "1000";
    top.innerText = `🇺🇸 ${storedUsername}`;
    document.body.appendChild(top);

    const punchBar = document.createElement("div");
    punchBar.id = "punch-bar";
    punchBar.style.position = "absolute";
    punchBar.style.top = "50px";
    punchBar.style.left = "0";
    punchBar.style.width = "100%";
    punchBar.style.background = "#b22234";
    punchBar.style.color = "#ffffff";
    punchBar.style.textAlign = "center";
    punchBar.style.fontFamily = "'Arial Black', sans-serif";
    punchBar.style.fontSize = "18px";
    punchBar.style.padding = "6px 0";
    punchBar.style.zIndex = "999";
    punchBar.innerText = `🥾 Punches: ${punches}`;
    document.body.appendChild(punchBar);
}

function updatePunchDisplay() {
    const bar = document.getElementById("punch-bar");
    if (bar) bar.innerText = `🥾 Punches: ${punches}`;
}

function renderTabs() {
    const tabBar = document.createElement("div");
    tabBar.id = "tab-container";
    tabBar.style.position = "absolute";
    tabBar.style.bottom = "0";
    tabBar.style.left = "0";
    tabBar.style.width = "100%";
    tabBar.style.display = "flex";
    tabBar.style.justifyContent = "space-around";
    tabBar.style.background = "#002868";
    tabBar.style.zIndex = "1000";

    ["game", "leaderboard", "info"].forEach(tab => {
        const btn = document.createElement("button");
        btn.innerText = tab.toUpperCase();
        btn.style.flex = "1";
        btn.style.padding = "12px";
        btn.style.fontSize = "14px";
        btn.style.border = "none";
        btn.style.color = "#fff";
        btn.style.background = (tab === activeTab) ? "#003f8a" : "#002868";
        btn.onclick = () => {
            activeTab = tab;
            showTab(tab);
            document.querySelectorAll("#tab-container button").forEach(b => b.style.background = "#002868");
            btn.style.background = "#003f8a";
        };
        tabBar.appendChild(btn);
    });

    document.body.appendChild(tabBar);
}

function showTab(tab, scene = null) {
    ["game-container", "leaderboard-container", "info-container"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    if (tab === "game" && scene) {
        showGameUI(scene);
    } else if (tab === "leaderboard") {
        const container = document.createElement("div");
        container.id = "leaderboard-container";
        container.style.position = "absolute";
        container.style.top = "72px";
        container.style.bottom = "48px";
        container.style.left = "0";
        container.style.width = "100%";
        container.style.overflow = "hidden";
        container.style.zIndex = "999";

        const iframe = document.createElement("iframe");
        iframe.src = "https://trumptossleaderboard-production.up.railway.app/leaderboard-page";
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";

        container.appendChild(iframe);
        document.body.appendChild(container);
    } else if (tab === "info") {
        const info = document.createElement("div");
        info.id = "info-container";
        info.style.position = "absolute";
        info.style.top = "72px";
        info.style.bottom = "48px";
        info.style.left = "0";
        info.style.width = "100%";
        info.style.padding = "20px";
        info.style.background = "#ffffff";
        info.style.fontFamily = "Arial";
        info.style.overflowY = "auto";
        info.style.zIndex = "999";
        info.innerHTML = `
            <h2>👟 TrumpToss</h2>
            <p>Throw shoes at Trump. Earn points. Compete on the leaderboard.</p>
            <p>🏗 <b>Upcoming:</b> Event drops, airdrops, collectibles</p>
            <p>🤖 Powered by Telegram Mini Apps</p>
        `;
        document.body.appendChild(info);
    }
}

function showGameUI(scene) {
    const trumpScale = (scene.scale.width * 0.7) / scene.textures.get("trump1").getSourceImage().width;

    trump = scene.add.image(scene.scale.width / 2, scene.scale.height / 2, `trump${Math.min(punches, 30)}`)
        .setScale(trumpScale)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

    for (let i = 1; i <= 4; i++) {
        punchSounds.push(scene.sound.add("punch" + i));
    }

    scene.input.setDefaultCursor("none");
    shoeCursor = scene.add.image(scene.input.activePointer.x, scene.input.activePointer.y, "shoe")
        .setScale(0.5)
        .setDepth(999);

    const iconSize = 50;
    soundButton = scene.add.image(scene.scale.width - iconSize / 2 - 20, iconSize / 2 + 60, "sound_on")
        .setInteractive()
        .setDisplaySize(iconSize, iconSize)
        .setOrigin(0.5);

    soundButton.on("pointerdown", () => {
        soundEnabled = !soundEnabled;
        soundButton.setTexture(soundEnabled ? "sound_on" : "sound_off");
    });

    trump.on("pointerdown", () => handlePunch());
}

function handlePunch() {
    punches++;
    updatePunchDisplay();
    localStorage.setItem(`score_${userId}`, punches);

    if (soundEnabled) {
        const sound = Phaser.Math.RND.pick(punchSounds);
        sound.play();
    }

    if (!hitCooldown) {
        hitCooldown = true;
        const newFrame = Math.min(punches, 30);
        if (punches <= 30) {
            trump.setTexture(`trump${newFrame}`);
        }

        const floatingText = trump.scene.add.text(trump.x, trump.y - 100, "+1", {
            font: "bold 24px Arial",
            fill: "#ff0000",
            stroke: "#fff",
            strokeThickness: 3
        }).setOrigin(0.5);

        trump.scene.tweens.add({
            targets: floatingText,
            y: floatingText.y - 50,
            alpha: 0,
            duration: 800,
            ease: 'Power1',
            onComplete: () => floatingText.destroy()
        });

        setTimeout(() => {
            hitCooldown = false;
        }, 200);
    }

    fetch("https://trumptossleaderboard-production.up.railway.app/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: storedUsername, user_id: userId, score: punches })
    });
}

function update() {
    if (shoeCursor && game && game.input && game.input.activePointer) {
        const pointer = game.input.activePointer;
        shoeCursor.setPosition(pointer.x, pointer.y);
    }
}

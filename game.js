// === game.js ===

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
let trumpOriginalTexture = "trump";
let trumpHitTexture = "trump_hit";
let hitCooldown = false;
let soundEnabled = true;

function preload() {
    this.load.image("trump", "trump.png");
    this.load.image("trump_hit", "trump_hit.png");
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

    fetch("https://trumptossleaderboard-production.up.railway.app/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: storedUsername, user_id: userId })
    })
    .then(() => fetch("https://trumptossleaderboard-production.up.railway.app/leaderboard"))
    .then(res => res.json())
    .then(scores => {
        const entry = scores.find(u => u.user_id == userId);
        if (entry) {
            punches = entry.score;
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
    top.style.left = "0";
    top.style.width = "100%";
    top.style.background = "#111";
    top.style.color = "#fff";
    top.style.fontFamily = "Arial";
    top.style.textAlign = "center";
    top.style.padding = "8px 0";
    top.style.zIndex = "1000";
    top.innerText = `👤 ${storedUsername}`;
    document.body.appendChild(top);

    const punchBar = document.createElement("div");
    punchBar.id = "punch-bar";
    punchBar.style.position = "absolute";
    punchBar.style.top = "36px";
    punchBar.style.left = "0";
    punchBar.style.width = "100%";
    punchBar.style.background = "#ffcc00";
    punchBar.style.color = "#000";
    punchBar.style.textAlign = "center";
    punchBar.style.fontWeight = "bold";
    punchBar.style.padding = "6px 0";
    punchBar.style.zIndex = "1000";
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
    tabBar.style.background = "#222";
    tabBar.style.zIndex = "1000";

    ["game", "leaderboard", "info"].forEach(tab => {
        const btn = document.createElement("button");
        btn.innerText = tab.toUpperCase();
        btn.style.flex = "1";
        btn.style.padding = "12px";
        btn.style.fontSize = "14px";
        btn.style.border = "none";
        btn.style.color = "#fff";
        btn.style.background = (tab === activeTab) ? "#444" : "#222";
        btn.onclick = () => {
            activeTab = tab;
            showTab(tab);
            document.querySelectorAll("#tab-container button").forEach(b => b.style.background = "#222");
            btn.style.background = "#444";
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
        info.style.background = "#fff";
        info.style.fontFamily = "Arial";
        info.style.overflowY = "auto";
        info.style.zIndex = "999";
        info.innerHTML = `
            <h2>👟 TrumpToss</h2>
            <p>Throw shoes at Trump. Earn points. Compete on the leaderboard.</p>
            <p>🏗 <b>Upcoming Updates</b>: Event drops, airdrops, collectibles.</p>
            <p>🤖 Bot powered by Telegram Mini App tech.</p>
        `;
        document.body.appendChild(info);
    }
}

function showGameUI(scene) {
    const targetHeight = scene.scale.height * 0.6;
    const trumpScale = targetHeight / scene.textures.get("trump").getSourceImage().height;

    trump = scene.add.image(scene.scale.width / 2, scene.scale.height / 2, trumpOriginalTexture)
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
    localStorage.setItem("punches", punches);

    if (soundEnabled) {
        const sound = Phaser.Math.RND.pick(punchSounds);
        sound.play();
    }

    if (!hitCooldown) {
        hitCooldown = true;
        trump.setTexture(trumpHitTexture);
        setTimeout(() => {
            trump.setTexture(trumpOriginalTexture);
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

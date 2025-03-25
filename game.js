// === game.js ===

let game;
let punches = 0;
let activeTab = "game";
let usernameDisplayText = null;
let storedUsername = "Anonymous";

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

let trump, shoeCursor, punchesText, overlayText;
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
    this.load.image("sound_on", "sound_on.png");
    this.load.image("sound_off", "sound_off.png");

    for (let i = 1; i <= 4; i++) {
        this.load.audio("punch" + i, "punch" + i + ".mp3");
    }
}

function create() {
    Telegram.WebApp.ready();
    console.log("✅ Telegram WebApp ready");

    const initUser = Telegram.WebApp.initDataUnsafe?.user;
    console.log("📦 Telegram WebApp.initDataUnsafe.user =", initUser);
    if (initUser) {
        storedUsername =
            initUser.username ||
            `${initUser.first_name || "user"}${initUser.last_name ? "_" + initUser.last_name : ""}` ||
            `user_${initUser.id}`;
    } else {
        storedUsername = "anonymous_client";
    }
    console.log("👤 Username for registration:", storedUsername);

    // Register and fetch user score
    fetch("https://trumptossleaderboard-production.up.railway.app/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: storedUsername })
    })
    .then(res => res.json())
    .then(data => {
        console.log(`📝 Register result for ${storedUsername}:`, data);
        fetch(`https://trumptossleaderboard-production.up.railway.app/leaderboard`)
            .then(res => res.json())
            .then(scores => {
                const match = scores.find(u => u.username.toLowerCase() === storedUsername.toLowerCase());
                if (match) {
                    punches = match.score;
                    localStorage.setItem("punches", punches);
                    console.log(`📥 Synced score for ${storedUsername}: ${punches}`);
                }
                renderTabs();
                showTab("game", this);
            })
            .catch(err => {
                console.error("❌ Failed to load score:", err);
                renderTabs();
                showTab("game", this);
            });
    })
    .catch(err => {
        console.error("❌ Register error:", err);
        renderTabs();
        showTab("game", this);
    });
}

function renderTabs() {
    const tabContainer = document.createElement("div");
    tabContainer.id = "tab-container";
    tabContainer.style.position = "absolute";
    tabContainer.style.top = "0";
    tabContainer.style.left = "0";
    tabContainer.style.width = "100%";
    tabContainer.style.display = "flex";
    tabContainer.style.justifyContent = "space-around";
    tabContainer.style.background = "#eee";
    tabContainer.style.zIndex = "9999";

    ["game", "leaderboard", "info"].forEach(tab => {
        const btn = document.createElement("button");
        btn.innerText = tab.charAt(0).toUpperCase() + tab.slice(1);
        btn.style.flex = "1";
        btn.style.padding = "10px";
        btn.style.fontSize = "1em";
        btn.style.border = "none";
        btn.style.background = tab === activeTab ? "#ddd" : "#eee";
        btn.onclick = () => {
            activeTab = tab;
            showTab(tab);
            document.querySelectorAll("#tab-container button").forEach(b => b.style.background = "#eee");
            btn.style.background = "#ddd";
        };
        tabContainer.appendChild(btn);
    });

    document.body.appendChild(tabContainer);

    const userOverlay = document.createElement("div");
    userOverlay.innerText = `👤 Player: ${storedUsername}`;
    userOverlay.style.position = "absolute";
    userOverlay.style.top = "40px";
    userOverlay.style.left = "0";
    userOverlay.style.width = "100%";
    userOverlay.style.textAlign = "center";
    userOverlay.style.fontSize = "16px";
    userOverlay.style.fontFamily = "Arial";
    userOverlay.style.background = "#fff";
    userOverlay.style.zIndex = "9998";
    userOverlay.style.padding = "5px 0";
    userOverlay.id = "username-display";
    document.body.appendChild(userOverlay);
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
        container.style.top = "70px";
        container.style.left = "0";
        container.style.width = "100%";
        container.style.height = "calc(100% - 70px)";
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
        info.style.top = "70px";
        info.style.left = "0";
        info.style.width = "100%";
        info.style.height = "calc(100% - 70px)";
        info.style.background = "#fefefe";
        info.style.padding = "20px";
        info.style.fontFamily = "Arial";
        info.style.fontSize = "1em";
        info.style.overflowY = "auto";
        info.style.zIndex = "999";
        info.innerHTML = `
            <h2>👾 TrumpToss Game</h2>
            <p>Created by @mora_dev</p>
            <p>Contact: <a href="https://t.me/mora_dev" target="_blank">@mora_dev</a></p>
            <p>© 2025 TrumpToss</p>
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

    punchesText = scene.add.text(20, 80, "Punches: " + punches, {
        fontSize: Math.round(scene.scale.width * 0.05) + "px",
        fill: "#000"
    });

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

    console.log(`📤 Submitting score for ${storedUsername}: ${punches} punches`);

    fetch("https://trumptossleaderboard-production.up.railway.app/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: storedUsername, score: punches })
    })
    .then(res => res.json())
    .then(data => console.log(`✅ Server response for ${storedUsername}:`, data))
    .catch(err => console.error("❌ Error submitting score:", err));
}

function update() {
    if (shoeCursor && game && game.input && game.input.activePointer) {
        const pointer = game.input.activePointer;
        shoeCursor.setPosition(pointer.x, pointer.y);
    }
}

let game;
let punches = 0;
let activeTab = "game";
let storedUsername = "Anonymous";
let userId = "";
let loadedTrumpFrames = new Set(["trump1"]);

window.onload = () => {
    createLoader();

    const gameConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: "#ffffff",
        scene: { preload, create, update }
    };

    game = new Phaser.Game(gameConfig);
};

let trump, shoeCursor, punchSounds = [], soundButton;
let hitCooldown = false;
let soundEnabled = true;

function createLoader() {
    const loader = document.createElement("div");
    loader.id = "loader";
    loader.style.position = "fixed";
    loader.style.top = "0";
    loader.style.left = "0";
    loader.style.width = "100%";
    loader.style.height = "100%";
    loader.style.display = "flex";
    loader.style.alignItems = "center";
    loader.style.justifyContent = "center";
    loader.style.background = "#ffffff";
    loader.style.zIndex = "2000";
    loader.innerHTML = `
        <div class="spinner"></div>
        <style>
        .spinner {
            border: 6px solid #eee;
            border-top: 6px solid #b22234;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        </style>
    `;
    document.body.appendChild(loader);
}

function removeLoader() {
    const el = document.getElementById("loader");
    if (el) el.remove();
}

function preload() {
    this.load.image("trump1", "trump-images/trump%20(1).webp");
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
        removeLoader();
        renderTopBar();
        renderTabs();
        renderShareButton();
        showTab("game", this);
    });
}

function renderTopBar() {
    const top = document.createElement("div");
    top.style.position = "fixed";
    top.style.top = "0";
    top.style.left = "1rem";
    top.style.background = "#fff";
    top.style.color = "#000";
    top.style.border = "2px solid #0047ab";
    top.style.borderRadius = "10px";
    top.style.fontFamily = "'Arial Black', sans-serif";
    top.style.padding = "6px 12px";
    top.style.zIndex = "1000";
    top.innerText = `${storedUsername}`;
    document.body.appendChild(top);

    const punchBar = document.createElement("div");
    punchBar.id = "punch-bar";
    punchBar.style.position = "fixed";
    punchBar.style.top = "50px";
    punchBar.style.left = "1rem";
    punchBar.style.right = "1rem";
    punchBar.style.background = "#b22234";
    punchBar.style.color = "#ffffff";
    punchBar.style.textAlign = "center";
    punchBar.style.fontFamily = "'Arial Black', sans-serif";
    punchBar.style.fontSize = "18px";
    punchBar.style.padding = "6px 0";
    punchBar.style.borderRadius = "8px";
    punchBar.style.zIndex = "999";
    punchBar.innerText = `🥾 Punches: ${punches}`;
    document.body.appendChild(punchBar);

    const iconSize = 32;
    soundButton = document.createElement("img");
    soundButton.src = "sound_on.png";
    soundButton.style.position = "fixed";
    soundButton.style.top = "8px";
    soundButton.style.right = "12px";
    soundButton.style.width = iconSize + "px";
    soundButton.style.height = iconSize + "px";
    soundButton.style.cursor = "pointer";
    soundButton.style.zIndex = "1001";
    soundButton.onclick = () => {
        soundEnabled = !soundEnabled;
        soundButton.src = soundEnabled ? "sound_on.png" : "sound_off.png";
    };
    document.body.appendChild(soundButton);
}

function updatePunchDisplay() {
    const bar = document.getElementById("punch-bar");
    if (bar) bar.innerText = `🥾 Punches: ${punches}`;
}

function renderTabs() {
    const tabBar = document.createElement("div");
    tabBar.id = "tab-container";
    tabBar.style.position = "fixed";
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

function renderShareButton() {
    const btn = document.createElement("button");
    btn.innerText = "📣 Share Score";
    btn.style.position = "fixed";
    btn.style.bottom = "60px";
    btn.style.right = "20px";
    btn.style.padding = "10px 14px";
    btn.style.fontSize = "14px";
    btn.style.background = "#0077cc";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.borderRadius = "8px";
    btn.style.fontFamily = "'Arial Black', sans-serif";
    btn.style.zIndex = "1001";

    btn.onclick = () => {
        const botLink = "https://t.me/TrumpToss_bot";
        const message = `I punched ${punches} points in TrumpToss. Wanna punch to earn?`;

        const shareOptions = [
            {
                id: "telegram",
                label: "Telegram",
                url: `https://t.me/share/url?url=${encodeURIComponent(botLink)}&text=${encodeURIComponent(message)}`
            },
            {
                id: "whatsapp",
                label: "WhatsApp",
                url: `https://api.whatsapp.com/send?text=${encodeURIComponent(message + ' ' + botLink)}`
            },
            {
                id: "x",
                label: "X (Twitter)",
                url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message + ' ' + botLink)}`
            },
            {
                id: "discord",
                label: "Discord",
                url: `https://discord.com/channels/@me`
            }
        ];

        const buttons = shareOptions.map(opt => ({
            id: opt.id,
            text: opt.label,
            type: "default"
        }));

        buttons.push({ type: "cancel" });

        Telegram.WebApp.showPopup({
            title: "Share your score",
            message: `Choose where to share your ${punches} punches:`,
            buttons: [
                { id: "telegram", type: "default", text: "Telegram" },
                { id: "whatsapp", type: "default", text: "WhatsApp" },
                { id: "x", type: "default", text: "X (Twitter)" },
                { type: "cancel" }
            ]
        }, (btnId) => {
            const links = {
                telegram: `https://t.me/share/url?url=https://t.me/TrumpToss_bot&text=${encodeURIComponent(`I punched ${punches} points in TrumpToss. Wanna punch to earn?`)}`,
                whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`I punched ${punches} points in TrumpToss. Wanna punch to earn? https://t.me/TrumpToss_bot`)}`,
                x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I punched ${punches} points in TrumpToss. Wanna punch to earn? https://t.me/TrumpToss_bot`)}`
            };
            if (btnId && links[btnId]) {
                window.open(links[btnId], "_blank");
            }
        });
        
        document.body.appendChild(btn);
    }


function renderResetButton() {
    const btn = document.createElement("button");
    btn.innerText = "🔁 Reset Score";
    btn.style.position = "fixed";
    btn.style.bottom = "110px";
    btn.style.right = "20px";
    btn.style.padding = "10px 14px";
    btn.style.fontSize = "14px";
    btn.style.background = "#dc3545";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.borderRadius = "8px";
    btn.style.fontFamily = "'Arial Black', sans-serif";
    btn.style.zIndex = "1001";

    btn.onclick = () => {
        punches = 0;
        updatePunchDisplay();
        localStorage.setItem(`score_${userId}`, punches);
        trump.setTexture("trump27"); // stick with angry Trump
        fetch("https://trumptossleaderboard-production.up.railway.app/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: storedUsername, user_id: userId, score: punches })
        });
    };

    document.body.appendChild(btn);
}

renderResetButton();



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
        container.style.position = "fixed";
        container.style.top = "100px"; // below punch bar
        container.style.bottom = "48px"; // above nav tabs
        container.style.left = "0";
        container.style.width = "100%";
        container.style.zIndex = "999";

        const iframe = document.createElement("iframe");
        iframe.src = `https://trumptossleaderboard-production.up.railway.app/leaderboard-page?user_id=${userId}`;
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";

        container.appendChild(iframe);
        document.body.appendChild(container);
    } else if (tab === "info") {
        const info = document.createElement("div");
        info.id = "info-container";
        info.style.position = "fixed";
        info.style.top = "100px";
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
    const current = Math.min(punches, 27);
    const textureKey = `trump${current}`;
    if (!loadedTrumpFrames.has(textureKey)) {
        scene.load.image(textureKey, `trump-images/trump%20(${current}).webp`);
        scene.load.once('complete', () => {
            loadedTrumpFrames.add(textureKey);
            drawTrump(scene, textureKey);
        });
        scene.load.start();
    } else {
        drawTrump(scene, textureKey);
    }

    for (let i = 1; i <= 4; i++) {
        punchSounds.push(scene.sound.add("punch" + i));
    }

    scene.input.setDefaultCursor("none");
    shoeCursor = scene.add.image(scene.input.activePointer.x, scene.input.activePointer.y, "shoe")
        .setScale(0.5)
        .setDepth(999);
}

function drawTrump(scene, textureKey) {
    const imageWidth = scene.textures.get(textureKey).getSourceImage().width;
    const trumpScale = (scene.scale.width * 0.7) / imageWidth;

    trump = scene.add.image(scene.scale.width / 2, scene.scale.height / 2.3, textureKey)
        .setScale(trumpScale)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

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
        const frameNum = Math.min(punches, 27);
        const key = `trump${frameNum}`;
        if (!loadedTrumpFrames.has(key)) {
            game.scene.scenes[0].load.image(key, `trump-images/trump%20(${frameNum}).webp`);
            game.scene.scenes[0].load.once('complete', () => {
                loadedTrumpFrames.add(key);
                trump.setTexture(key);
            });
            game.scene.scenes[0].load.start();
        } else {
            trump.setTexture(key);
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
    if (shoeCursor && game.input && game.input.activePointer) {
        const pointer = game.input.activePointer;
        shoeCursor.setPosition(pointer.x, pointer.y);
    }
}

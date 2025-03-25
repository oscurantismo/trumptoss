import { Bot, InlineKeyboard } from "grammy";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN); // Place your bot token in .env

const GAME_SHORT_NAME = "TrumpToss";
const GAME_URL = "https://oscurantismo.github.io/trumptoss/";
const REGISTER_API = "https://trumptossleaderboard-production.up.railway.app/register";

// Helper: Register user
async function registerUser(id, first_name, last_name, username) {
    try {
        const fullUsername = username || `user_${id}`;
        const res = await axios.post(REGISTER_API, { username: fullUsername });
        console.log(`✅ Registered ${fullUsername} → ${res.data.status}`);
        return fullUsername;
    } catch (err) {
        console.error("❌ Registration error:", err.message);
        return null;
    }
}

// === /start ===
bot.command("start", async (ctx) => {
    const from = ctx.from;
    const name = await registerUser(from.id, from.first_name, from.last_name, from.username);

    await ctx.replyWithPhoto(
        "https://upload.wikimedia.org/wikipedia/commons/5/5f/President_Donald_Trump.jpg",
        {
            caption: `<b>Hi, ${from.first_name}!</b>\nPlay TrumpToss and climb the leaderboard!`,
            parse_mode: "HTML"
        }
    );
});

// === /play ===
bot.command("play", async (ctx) => {
    await registerUser(ctx.from.id, ctx.from.first_name, ctx.from.last_name, ctx.from.username);

    const keyboard = new InlineKeyboard()
        .game("🎮 Play TrumpToss")
        .row()
        .text("📊 Leaderboard", "leaderboard")
        .text("ℹ️ About", "about");

    await ctx.replyWithGame(GAME_SHORT_NAME, {
        reply_markup: keyboard,
        protect_content: true,
        disable_notification: true
    });
});

// === /leaderboard ===
bot.command("leaderboard", async (ctx) => {
    await ctx.reply("🏆 Leaderboard:\n1. Player1\n2. Player2\n3. Player3");
});

// === /about ===
bot.command("about", async (ctx) => {
    await ctx.reply("👟 TrumpToss is a Telegram game where you throw a shoe at Trump to score points.");
});

// === /help ===
bot.command("help", async (ctx) => {
    await ctx.reply(
        "<b>TrumpToss Help</b>\nThrow a shoe, score points, and hit the top leaderboard!\nContact @mora_dev for support.",
        { parse_mode: "HTML" }
    );
});

// === Inline Button Callbacks ===
bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    if (data === "leaderboard") {
        await ctx.answerCallbackQuery();
        await ctx.reply("🏆 Leaderboard:\n1. Player1\n2. Player2\n3. Player3");
    } else if (data === "about") {
        await ctx.answerCallbackQuery();
        await ctx.reply("ℹ️ TrumpToss is just for fun.\nMade with love by @mora_dev.");
    }
});

// === Game Launch Callback ===
bot.on("callback_query:game_short_name", async (ctx) => {
    if (ctx.callbackQuery.game_short_name === GAME_SHORT_NAME) {
        await ctx.answerCallbackQuery({
            url: GAME_URL
        });
    } else {
        await ctx.answerCallbackQuery({
            text: "Unknown game",
            show_alert: true
        });
    }
});

// === Error Handling ===
bot.catch((err) => {
    console.error("❌ Bot Error:", err);
});

// === Start Bot ===
bot.start();

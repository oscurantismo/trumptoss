import os
import logging
import requests
from telegram import (
    Update,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo
)
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    ContextTypes,
    CallbackQueryHandler
)

# === Config ===
BOT_TOKEN = os.getenv("BOT_TOKEN")
WEB_APP_URL = "https://oscurantismo.github.io/drumppunch2earn/"

# === Logging ===
logging.basicConfig(format="%(asctime)s - %(levelname)s - %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

# === /start ===
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    logger.info(f"👋 /start triggered by {user.username} ({user.id})")

    # Show main options menu after pressing /start
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🕹 Play Drump | Punch2Earn", web_app=WebAppInfo(url=WEB_APP_URL))],
        [InlineKeyboardButton("📊 Check Leaderboard", callback_data="leaderboard")],
        [InlineKeyboardButton("ℹ️ Info", callback_data="info")]
    ])

    await update.message.reply_text(
        text="Welcome to Drump | Punch2Earn! Choose an option below:",
        reply_markup=keyboard
    )

# === Live leaderboard ===
async def send_leaderboard(chat_id, context: ContextTypes.DEFAULT_TYPE, user_id: str):
    try:
        res = requests.get("https://drumppunch2earnleaderboard-production.up.railway.app/leaderboard")
        scores = res.json()
    except Exception as e:
        await context.bot.send_message(chat_id, "❌ Failed to load leaderboard. Try again later.")
        return

    if not scores:
        await context.bot.send_message(chat_id, "No scores yet.")
        return

    medals = ["🥇", "🥈", "🥉"]
    msg = "🏆 <b>Drump | Punch2Earn Leaderboard</b>\n\n"
    for i, entry in enumerate(scores):
        medal = medals[i] if i < 3 else f"{i+1}."
        name = entry['username']
        score = entry['score']
        is_user = (entry.get("user_id") == user_id)
        row = f"{medal} <b>{name}</b> — {score} punches" if is_user else f"{medal} {name} — {score} punches"
        msg += row + "\n"

    await context.bot.send_message(chat_id, msg, parse_mode="HTML")

# === Button callbacks ===
async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    user = query.from_user

    if query.data == "leaderboard":
        await send_leaderboard(query.message.chat_id, context, str(user.id))
    elif query.data == "info":
        await query.message.reply_text(
            "ℹ️ Drump | Punch2Earn is a Telegram Mini App where you throw shoes at Drump and climb the leaderboard.\n\n" +
            "🏗 Upcoming: Airdrops, upgrades, and seasonal events."
        )

# === Error Logger ===
async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE):
    logger.error("❌ Exception occurred:", exc_info=context.error)
    if update:
        logger.warning(f"⚠️ Update that caused error: {update}")

# === Entry Point ===
if __name__ == "__main__":
    if not BOT_TOKEN:
        print("❌ BOT_TOKEN not set. Set it as an environment variable.")
        exit()

    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(button_callback, pattern="^(leaderboard|info)$"))
    app.add_error_handler(error_handler)

    print("🚀 Drump | Punch2Earn Mini App bot is running...")
    app.run_polling()

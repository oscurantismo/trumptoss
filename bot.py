import os
import logging
import requests
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import (
    ApplicationBuilder, CommandHandler, CallbackQueryHandler, ContextTypes
)

# === Config ===
BOT_TOKEN = os.getenv("BOT_TOKEN")
GAME_SHORT_NAME = "TrumpToss"
GAME_URL = "https://oscurantismo.github.io/trumptoss/"
REGISTER_API = "https://trumptossleaderboard-production.up.railway.app/register"

# === Logging ===
logging.basicConfig(format="%(asctime)s - %(levelname)s - %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

# === User Registration ===
def register_user(user_id, first_name, last_name, username):
    user = username or f"user_{user_id}"
    try:
        response = requests.post(REGISTER_API, json={"username": user})
        logger.info(f"✅ Registered: {user} – {response.status_code}")
    except Exception as e:
        logger.error(f"❌ Failed to register user {user}: {e}")

# === /start command ===
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    register_user(user.id, user.first_name, user.last_name, user.username)

    keyboard = InlineKeyboardMarkup(
        [[InlineKeyboardButton("👉 Play TrumpToss", callback_game={"game_short_name": GAME_SHORT_NAME})]]
    )
    await context.bot.send_game(
        chat_id=update.effective_chat.id,
        game_short_name=GAME_SHORT_NAME,
        reply_markup=keyboard
    )
    logger.info(f"🎮 Game sent to user {user.username} ({user.id})")

# === /play command (alias) ===
async def play(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await start(update, context)

# === /leaderboard command ===
async def leaderboard(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🏆 Leaderboard:\n1. Player1\n2. Player2\n3. Player3")

# === /about command ===
async def about(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("👟 TrumpToss is a fun game where you throw a shoe at Trump!")

# === /help command ===
async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_html(
        "<b>TrumpToss Help</b>\nTap the game button to start playing and climb the leaderboard.\nContact @mora_dev for help."
    )

# === Game Callback Handler ===
async def game_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query

    if query.game_short_name == GAME_SHORT_NAME:
        await context.bot.answer_callback_query(
            callback_query_id=query.id,
            url=GAME_URL
        )
        logger.info(f"✅ Game launched for user {query.from_user.username}")
    else:
        await context.bot.answer_callback_query(
            callback_query_id=query.id,
            text="Unknown game 🤔"
        )
        logger.warning(f"⚠️ Invalid game_short_name received: {query.game_short_name}")

# === Error Handler ===
async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.error("❌ Exception occurred:", exc_info=context.error)
    if update:
        logger.warning(f"⚠️ Update that caused error: {update}")

# === Entry Point ===
if __name__ == "__main__":
    if not BOT_TOKEN:
        print("❌ BOT_TOKEN missing. Add it to your environment variables.")
        exit()

    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("play", play))
    app.add_handler(CommandHandler("leaderboard", leaderboard))
    app.add_handler(CommandHandler("about", about))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(CallbackQueryHandler(game_callback, pattern="^" + GAME_SHORT_NAME + "$", block=False))
    app.add_handler(CallbackQueryHandler(game_callback, block=False))
    app.add_error_handler(error_handler)

    print("🚀 TrumpToss bot is running...")
    app.run_polling()

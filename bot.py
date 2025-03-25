import os
import logging
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
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

# === Helper: Register user ===
def register_user(user_id, first_name, last_name, username):
    user = username or f"user_{user_id}"
    try:
        response = requests.post(REGISTER_API, json={"username": user})
        logger.info(f"✅ Registered: {user} → {response.status_code} – {response.json()}")
    except Exception as e:
        logger.error(f"❌ Registration failed for {user}: {e}")
    return user

# === /start ===
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await play(update, context)

# === /play ===
async def play(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    user_id = str(user.id)
    username = register_user(user_id, user.first_name, user.last_name, user.username)
    logger.info(f"🧾 User doc id: {username}")

    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🎮 Play now!", callback_game={"game_short_name": GAME_SHORT_NAME})],
        [InlineKeyboardButton("📊 Leaderboard", callback_data="leaderboard")],
        [InlineKeyboardButton("ℹ️ About", callback_data="about")]
    ])

    await context.bot.send_game(
        chat_id=update.effective_chat.id,
        game_short_name=GAME_SHORT_NAME,
        reply_markup=keyboard,
        protect_content=True,
        disable_notification=True
    )

# === Game Callback Handler (Telegram spec-compliant) ===
async def game_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    if not query:
        logger.warning("⚠️ No callback query received.")
        return

    logger.info(f"🎮 Callback received from {query.from_user.username} – game_short_name: {query.game_short_name}")

    if query.game_short_name == GAME_SHORT_NAME:
        await query.answer(url=GAME_URL)
        logger.info(f"✅ Game URL sent: {GAME_URL}")
    else:
        await query.answer(
            text="❌ Invalid game launch attempt.",
            show_alert=True
        )
        logger.warning(f"⚠️ Invalid game_short_name: {query.game_short_name}")

# === Button Callbacks (Leaderboard/About) ===
async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    data = query.data

    await query.answer()  # Acknowledge callback

    if data == "leaderboard":
        await query.message.reply_text("🏆 Leaderboard:\n1. Player1\n2. Player2\n3. Player3")
    elif data == "about":
        await query.message.reply_text("ℹ️ TrumpToss is a fun Telegram game where you throw shoes at Trump!")

# === /leaderboard ===
async def leaderboard(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🏆 Leaderboard:\n1. Player1\n2. Player2\n3. Player3")

# === /about ===
async def about(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("ℹ️ TrumpToss is a game about throwing shoes at Trump for points.")

# === /help ===
async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_html(
        "<b>TrumpToss Help</b>\nPlay the game, hit Trump, and climb the leaderboard!\nContact @mora_dev for help."
    )

# === Error Logger ===
async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.error("❌ Exception occurred:", exc_info=context.error)
    if update:
        logger.warning(f"⚠️ Update that caused error: {update}")

# === Entry Point ===
if __name__ == "__main__":
    if not BOT_TOKEN:
        print("❌ BOT_TOKEN missing. Set it as an environment variable.")
        exit()

    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("play", play))
    app.add_handler(CommandHandler("leaderboard", leaderboard))
    app.add_handler(CommandHandler("about", about))
    app.add_handler(CommandHandler("help", help_cmd))

    app.add_handler(CallbackQueryHandler(game_callback, pattern=f"^{GAME_SHORT_NAME}$", block=False))
    app.add_handler(CallbackQueryHandler(button_callback, pattern="^(leaderboard|about)$", block=False))

    app.add_error_handler(error_handler)

    print("🚀 TrumpToss bot is running...")
    app.run_polling()

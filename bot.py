import os
import logging
import requests
from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
)
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
)

# === Config ===
BOT_TOKEN = os.getenv("BOT_TOKEN")
GAME_SHORT_NAME = "TrumpToss"  # Must match your BotFather entry exactly
GAME_URL = "https://oscurantismo.github.io/trumptoss/"
REGISTER_API = "https://trumptossleaderboard-production.up.railway.app/register"

# === Logging ===
logging.basicConfig(format="%(asctime)s - %(levelname)s - %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

# === Register user helper ===
def register_user(user_id, first_name, last_name, username):
    username = username or f"user_{user_id}"
    try:
        res = requests.post(REGISTER_API, json={"username": username})
        logger.info(f"✅ Registered user: {username} → {res.status_code} – {res.json()}")
    except Exception as e:
        logger.error(f"❌ Registration failed: {e}")
    return username

# === /start command ===
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await play(update, context)

# === /play command ===
async def play(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    username = register_user(
        str(user.id), user.first_name or "", user.last_name or "", user.username
    )

    logger.info(f"🎮 Sending game to user: @{username}")

    # Keyboard with game button first
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🎮 Play TrumpToss", callback_game={"game_short_name": GAME_SHORT_NAME})],
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

# === /leaderboard command ===
async def leaderboard(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🏆 Leaderboard:\n1. Player1\n2. Player2\n3. Player3")

# === /about command ===
async def about(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("ℹ️ TrumpToss is a mini-game to throw shoes at Trump.")

# === /help command ===
async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_html(
        "<b>TrumpToss Help</b>\nHit Trump. Score points. Climb the leaderboard.\nContact @mora_dev for help."
    )

# === Game callback (button with callback_game) ===
async def game_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    if not query:
        logger.warning("⚠️ No callback query detected.")
        return

    logger.info(f"🎮 Game callback triggered from @{query.from_user.username}, game_short_name: {query.game_short_name}")

    if query.game_short_name == GAME_SHORT_NAME:
        await query.answer(url=GAME_URL)  # This launches the game
        logger.info(f"✅ Launched game for user via answerCallbackQuery: {GAME_URL}")
    else:
        await query.answer(
            text="Unknown game reference 🤔",
            show_alert=True
        )
        logger.warning(f"⚠️ Received unknown game_short_name: {query.game_short_name}")

# === Callback for Leaderboard / About buttons ===
async def extra_buttons(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()  # Required to avoid timeout spinner

    if query.data == "leaderboard":
        await query.message.reply_text("🏆 Leaderboard:\n1. Player1\n2. Player2\n3. Player3")
    elif query.data == "about":
        await query.message.reply_text("ℹ️ TrumpToss: A game where you hit Trump with a shoe for fun and glory!")

# === Error handler ===
async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE):
    logger.error("❌ Exception occurred:", exc_info=context.error)
    if update:
        logger.warning(f"⚠️ Update that caused the error: {update}")

# === App entry point ===
if __name__ == "__main__":
    if not BOT_TOKEN:
        print("❌ BOT_TOKEN not set in environment variables.")
        exit()

    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("play", play))
    app.add_handler(CommandHandler("leaderboard", leaderboard))
    app.add_handler(CommandHandler("about", about))
    app.add_handler(CommandHandler("help", help_cmd))

    # Game launch callback (MUST match game_short_name)
    app.add_handler(CallbackQueryHandler(game_callback, pattern=f"^{GAME_SHORT_NAME}$", block=False))

    # Info buttons
    app.add_handler(CallbackQueryHandler(extra_buttons, pattern="^(leaderboard|about)$", block=False))

    # Error log handler
    app.add_error_handler(error_handler)

    print("🚀 TrumpToss bot is running...")
    app.run_polling()

import os
import logging
import requests
import jwt
import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Updater, CommandHandler, CallbackQueryHandler, CallbackContext

# === Config ===
BOT_TOKEN = os.getenv("BOT_TOKEN")
REGISTER_API = "https://trumptossleaderboard-production.up.railway.app/register"
GAME_SHORT_NAME = "TrumpToss"
GAME_URL = "https://oscurantismo.github.io/trumptoss/"

JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")  # Change in production
JWT_ALGORITHM = "HS256"

if not BOT_TOKEN:
    print("❌ BOT_TOKEN not found in environment!")
    exit()
else:
    print("✅ BOT_TOKEN loaded.")

# === Logging ===
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# === JWT Token Generator ===
def generate_jwt(user_id, username):
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token

# === Helper ===
def register_user(username: str):
    try:
        response = requests.post(REGISTER_API, json={"username": username})
        logger.info(f"📨 Registered {username} → {response.status_code} – {response.json()}")
    except Exception as e:
        logger.error(f"❌ Failed to register {username}: {e}")

# === /start command ===
def start(update: Update, context: CallbackContext):
    user = update.effective_user
    username = user.username or f"user_{user.id}"
    logger.info(f"💬 /start by {username} (ID: {user.id})")

    register_user(username)
    token = generate_jwt(user.id, username)
    logger.info(f"🔐 Generated JWT for {username}: {token}")

    keyboard = [
        [InlineKeyboardButton("👉 Play TrumpToss", callback_game={"game_short_name": GAME_SHORT_NAME})]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    context.bot.send_game(
        chat_id=update.effective_chat.id,
        game_short_name=GAME_SHORT_NAME,
        reply_markup=reply_markup
    )

# === Game Callback ===
def game_callback(update: Update, context: CallbackContext):
    query = update.callback_query
    user = query.from_user
    username = user.username or f"user_{user.id}"
    logger.info(f"🎮 Game launch request: {query.game_short_name} by {username}")

    if query.game_short_name == GAME_SHORT_NAME:
        token = generate_jwt(user.id, username)
        game_url_with_token = f"{GAME_URL}?token={token}"

        context.bot.answer_callback_query(
            callback_query_id=query.id,
            url=game_url_with_token
        )
        logger.info("✅ Game launched via answerCallbackQuery with token")
    else:
        context.bot.answer_callback_query(
            callback_query_id=query.id,
            text="Unknown game 🤔"
        )
        logger.warning("⚠️ Game short name did not match")

# === /status command ===
def status(update: Update, context: CallbackContext):
    update.message.reply_text("✅ TrumpToss bot is online and running!")

# === Optional bot status description ===
def set_bot_status(bot):
    try:
        bot.set_my_description("🟢 Online – TrumpToss bot is running!")
        logger.info("📍 Bot description updated")
    except Exception as e:
        logger.error(f"❌ Failed to set bot description: {e}")

# === Error Logger ===
def error_handler(update, context):
    logger.error(f"❌ Error: {context.error}")
    if update:
        logger.warning(f"⚠️ Caused by update: {update}")

# === Entry Point ===
def main():
    logger.info("🚀 Starting bot using long polling...")
    updater = Updater(BOT_TOKEN, use_context=True)
    dp = updater.dispatcher

    set_bot_status(updater.bot)

    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(CommandHandler("status", status))
    dp.add_handler(CallbackQueryHandler(game_callback))
    dp.add_error_handler(error_handler)

    updater.start_polling()
    updater.idle()

if __name__ == "__main__":
    main()

import os
import logging
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Updater, CommandHandler, CallbackQueryHandler, CallbackContext

# === Configuration ===
BOT_TOKEN = os.getenv("BOT_TOKEN")
REGISTER_API = "https://trumptossleaderboard-production.up.railway.app/register"
GAME_SHORT_NAME = "TrumpToss"
GAME_URL = "https://oscurantismo.github.io/trumptoss/"

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

# === Helpers ===
def register_user(username: str):
    try:
        res = requests.post(REGISTER_API, json={"username": username})
        logger.info(f"📨 Register response: {res.status_code} – {res.json()}")
    except Exception as e:
        logger.error(f"❌ Failed to register user {username}: {e}")

# === Handlers ===
def start(update: Update, context: CallbackContext):
    user = update.effective_user
    username = user.username or f"user_{user.id}"
    logger.info(f"/start by {username} (ID: {user.id})")

    register_user(username)

    keyboard = [
        [InlineKeyboardButton("👉 Play TrumpToss", callback_game={"game_short_name": GAME_SHORT_NAME})]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    context.bot.send_game(
        chat_id=update.effective_chat.id,
        game_short_name=GAME_SHORT_NAME,
        reply_markup=reply_markup
    )

def game_callback(update: Update, context: CallbackContext):
    query = update.callback_query
    logger.info(f"🎮 Game callback for: {query.game_short_name}")

    if query.game_short_name == GAME_SHORT_NAME:
        context.bot.answer_callback_query(callback_query_id=query.id, url=GAME_URL)
    else:
        context.bot.answer_callback_query(callback_query_id=query.id, text="Unknown game 🤔")

def status(update: Update, context: CallbackContext):
    update.message.reply_text("✅ TrumpToss bot is online and running!")

def set_bot_status(bot):
    try:
        bot.set_my_description("🟢 Online – TrumpToss bot is running!")
        logger.info("✅ Bot description updated.")
    except Exception as e:
        logger.error(f"❌ Failed to set bot description: {e}")

def error_handler(update, context):
    logger.error(f"❌ Error: {context.error}")
    if update:
        logger.warning(f"⚠️ Caused by update: {update}")

# === Main ===
def main():
    updater = Updater(BOT_TOKEN, use_context=True)
    dp = updater.dispatcher

    set_bot_status(updater.bot)

    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(CommandHandler("status", status))
    dp.add_handler(CallbackQueryHandler(game_callback))
    dp.add_error_handler(error_handler)

    logger.info("🚀 Bot is starting with long polling...")
    updater.start_polling()
    updater.idle()

if __name__ == "__main__":
    main()

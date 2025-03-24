from flask import Flask, request
import logging
import os
from telegram import Bot, Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Dispatcher, CommandHandler, CallbackQueryHandler

# Flask app setup
app = Flask(__name__)

# Environment variables
BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBHOOK_DOMAIN = os.getenv("WEBHOOK_DOMAIN")  # e.g., https://your-app-name.up.railway.app

if not BOT_TOKEN or not WEBHOOK_DOMAIN:
    print("❌ BOT_TOKEN or WEBHOOK_DOMAIN not set!")
    exit()
else:
    print(f"✅ BOT_TOKEN and WEBHOOK_DOMAIN loaded:\n→ DOMAIN: {WEBHOOK_DOMAIN}")

# Telegram bot setup
bot = Bot(token=BOT_TOKEN)
dispatcher = Dispatcher(bot=bot, update_queue=None, workers=4, use_context=True)

# Telegram game config
GAME_SHORT_NAME = "TrumpToss"
GAME_URL = "https://oscurantismo.github.io/trumptoss/"

# Logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# /start command

def start(update: Update, context):
    logger.info(f"/start command by user {update.effective_user.username} (ID: {update.effective_user.id})")
    keyboard = [[InlineKeyboardButton("👉 Play TrumpToss", callback_game={"game_short_name": GAME_SHORT_NAME})]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    context.bot.send_game(chat_id=update.effective_chat.id, game_short_name=GAME_SHORT_NAME, reply_markup=reply_markup)

# /status command

def status(update: Update, context):
    update.message.reply_text("✅ TrumpToss bot is online and running!")

# Callback for launching game

def game_callback(update: Update, context):
    query = update.callback_query
    logger.info(f"Game callback received: {query.game_short_name}")

    if query.game_short_name == GAME_SHORT_NAME:
        context.bot.answer_callback_query(callback_query_id=query.id, url=GAME_URL)
        logger.info("✅ Game URL sent to user.")
    else:
        context.bot.answer_callback_query(callback_query_id=query.id, text="Unknown game 🤔")
        logger.warning("⚠️ Unknown game short name in callback!")

# Optional: update bot bio

def set_bot_status():
    try:
        bot.set_my_description("🟢 Online – TrumpToss bot is running!")
        logger.info("✅ Bot description set.")
    except Exception as e:
        logger.error(f"❌ Failed to set bot description: {e}")

# Error handler

def error_handler(update, context):
    logger.error(f"❌ Error occurred: {context.error}")
    if update:
        logger.warning(f"⚠️ Caused by update: {update}")

# Register handlers
dispatcher.add_handler(CommandHandler("start", start))
dispatcher.add_handler(CommandHandler("status", status))
dispatcher.add_handler(CallbackQueryHandler(game_callback))
dispatcher.add_error_handler(error_handler)

# Webhook route
@app.route(f"/{BOT_TOKEN}", methods=["POST"])
def webhook():
    update = Update.de_json(request.get_json(force=True), bot)
    dispatcher.process_update(update)
    return "ok"

# Root route for debug
@app.route("/")
def index():
    return "🤖 TrumpToss bot is running!"

# Start the Flask app
if __name__ == "__main__":
    set_bot_status()
    PORT = int(os.environ.get("PORT", 8443))
    app.run(host="0.0.0.0", port=PORT)

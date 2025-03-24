import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Updater, CommandHandler, CallbackQueryHandler, CallbackContext

# Load environment variables
BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBHOOK_DOMAIN = os.getenv("WEBHOOK_DOMAIN")  # e.g., https://your-app-name.up.railway.app

if not BOT_TOKEN or not WEBHOOK_DOMAIN:
    print("❌ BOT_TOKEN or WEBHOOK_DOMAIN not set!")
    exit()
else:
    print(f"✅ BOT_TOKEN and WEBHOOK_DOMAIN loaded:\n→ DOMAIN: {WEBHOOK_DOMAIN}")

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
def start(update: Update, context: CallbackContext):
    logger.info(f"/start command by user {update.effective_user.username} (ID: {update.effective_user.id})")
    keyboard = [
        [InlineKeyboardButton("👉 Play TrumpToss", callback_game={"game_short_name": GAME_SHORT_NAME})]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    context.bot.send_game(
        chat_id=update.effective_chat.id,
        game_short_name=GAME_SHORT_NAME,
        reply_markup=reply_markup
    )

# Game launch
def game_callback(update: Update, context: CallbackContext):
    query = update.callback_query
    logger.info(f"Game callback received: {query.game_short_name}")

    if query.game_short_name == GAME_SHORT_NAME:
        context.bot.answer_callback_query(callback_query_id=query.id, url=GAME_URL)
        logger.info("✅ Game URL sent to user.")
    else:
        context.bot.answer_callback_query(callback_query_id=query.id, text="Unknown game 🤔")
        logger.warning("⚠️ Unknown game short name in callback!")

# Bot /status command
def status(update: Update, context: CallbackContext):
    logger.info("✅ /status command received")
    update.message.reply_text("✅ TrumpToss bot is online and running!")

# Optional: update bot bio
def set_bot_status(bot):
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

# Main
def main():
    logger.info("🚀 Starting bot...")
    updater = Updater(BOT_TOKEN, use_context=True)
    dp = updater.dispatcher

    set_bot_status(updater.bot)

    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(CommandHandler("status", status))
    dp.add_handler(CallbackQueryHandler(game_callback))
    dp.add_error_handler(error_handler)

    PORT = int(os.environ.get("PORT", "8443"))
    WEBHOOK_URL = f"{WEBHOOK_DOMAIN}/{BOT_TOKEN}"

    logger.info(f"🌐 Setting webhook at: {WEBHOOK_URL}")
    updater.start_webhook(
        listen="0.0.0.0",
        port=PORT,
        url_path=BOT_TOKEN,
        webhook_url=WEBHOOK_URL
    )

    logger.info("✅ Bot is now listening for updates via webhook.")
    updater.idle()

if __name__ == "__main__":
    main()

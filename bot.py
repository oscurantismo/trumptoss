import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Updater, CommandHandler, CallbackQueryHandler, CallbackContext

# Load bot token and domain from environment variables
BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBHOOK_DOMAIN = os.getenv("WEBHOOK_DOMAIN")  # e.g. https://your-app-name.up.railway.app

if not BOT_TOKEN or not WEBHOOK_DOMAIN:
    print("❌ BOT_TOKEN or WEBHOOK_DOMAIN not set!")
    exit()
else:
    print("✅ Bot token and webhook domain loaded.")

# Game configuration
GAME_SHORT_NAME = "TrumpToss"
GAME_URL = "https://oscurantismo.github.io/trumptoss/"

# Logging setup
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

# /start command
def start(update: Update, context: CallbackContext):
    keyboard = [
        [InlineKeyboardButton("👉 Play TrumpToss", callback_game={"game_short_name": GAME_SHORT_NAME})]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    context.bot.send_game(
        chat_id=update.effective_chat.id,
        game_short_name=GAME_SHORT_NAME,
        reply_markup=reply_markup
    )

# Game launch handler
def game_callback(update: Update, context: CallbackContext):
    query = update.callback_query

    if query.game_short_name == GAME_SHORT_NAME:
        context.bot.answer_callback_query(callback_query_id=query.id, url=GAME_URL)
    else:
        context.bot.answer_callback_query(callback_query_id=query.id, text="Unknown game 🤔")

# /status command
def status(update: Update, context: CallbackContext):
    update.message.reply_text("✅ TrumpToss bot is online and running!")

# Optional: update bot profile description
def set_bot_status(bot):
    try:
        bot.set_my_description("🟢 Online – TrumpToss bot is running!")
        print("✅ Bot description updated.")
    except Exception as e:
        print("❌ Failed to set bot description:", e)

# Error handler
def error_handler(update, context):
    error_message = str(context.error)
    if "Query is too old" in error_message:
        print("⚠️ Stale callback query ignored.")
    else:
        print(f"❌ Error: {context.error}")

# Start the bot with webhook
def main():
    updater = Updater(BOT_TOKEN, use_context=True)
    dp = updater.dispatcher

    set_bot_status(updater.bot)

    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(CommandHandler("status", status))
    dp.add_handler(CallbackQueryHandler(game_callback))
    dp.add_error_handler(error_handler)

    PORT = int(os.environ.get("PORT", 8443))
    webhook_url = f"{WEBHOOK_DOMAIN}/{BOT_TOKEN}"

    updater.start_webhook(
        listen="0.0.0.0",
        port=PORT,
        url_path=BOT_TOKEN,
        webhook_url=webhook_url
    )

    print(f"🚀 Webhook started at {webhook_url}")
    updater.idle()

if __name__ == "__main__":
    main()

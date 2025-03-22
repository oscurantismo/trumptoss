import os
import logging
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Updater, CommandHandler, CallbackQueryHandler, CallbackContext

# Load bot token from environment
BOT_TOKEN = os.getenv("BOT_TOKEN")

if not BOT_TOKEN:
    print("❌ BOT_TOKEN not received!")
    exit()
else:
    print("✅ BOT_TOKEN received.")

# Configuration
GAME_SHORT_NAME = "TrumpToss"
GAME_URL = "https://oscurantismo.github.io/trumptoss/"
LEADERBOARD_API = "https://trumptossleaderboard-production.up.railway.app/leaderboard"


# Logging setup
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

# /start handler with game + leaderboard buttons
def start(update: Update, context: CallbackContext):
    keyboard = [
        [InlineKeyboardButton("👉 Play TrumpToss", callback_game={"game_short_name": GAME_SHORT_NAME})],
        [InlineKeyboardButton("🏆 See Leaderboard", callback_data="leaderboard")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    context.bot.send_game(
        chat_id=update.effective_chat.id,
        game_short_name=GAME_SHORT_NAME,
        reply_markup=reply_markup
    )

# Handles leaderboard button press
def show_leaderboard(update: Update, context: CallbackContext):
    query = update.callback_query
    try:
        res = requests.get(LEADERBOARD_API)
        res.raise_for_status()
        leaderboard = res.json()

        if not leaderboard:
            message = "🏆 Leaderboard is empty. Be the first to score!"
        else:
            message = "🏆 Top Players:\n\n" + "\n".join(
                [f"{i + 1}. {entry['username']}: {entry['score']}" for i, entry in enumerate(leaderboard)]
            )

        context.bot.send_message(chat_id=query.message.chat_id, text=message)
        context.bot.answer_callback_query(callback_query_id=query.id)

    except Exception as e:
        context.bot.send_message(chat_id=query.message.chat_id, text="⚠️ Failed to load leaderboard.")
        context.bot.answer_callback_query(callback_query_id=query.id)
        print(f"❌ Error fetching leaderboard: {e}")

# Game launch callback
def game_callback(update: Update, context: CallbackContext):
    query = update.callback_query
    if query.game_short_name == GAME_SHORT_NAME:
        context.bot.answer_callback_query(callback_query_id=query.id, url=GAME_URL)
    else:
        context.bot.answer_callback_query(callback_query_id=query.id, text="Unknown game 🤔")

# /status command
def status(update: Update, context: CallbackContext):
    update.message.reply_text("✅ TrumpToss bot is online and running!")

# Sets profile description to 'Online'
def set_bot_status(bot):
    try:
        bot.set_my_description("🟢 Online – TrumpToss bot is running!")
        print("✅ Bot description updated.")
    except Exception as e:
        print("❌ Failed to set bot description:", e)

# Error logger
def error_handler(update, context):
    error_message = str(context.error)
    if "Query is too old" in error_message:
        print("⚠️ Stale callback query ignored.")
    else:
        print(f"❌ Error: {context.error}")

# Entry point
def main():
    updater = Updater(BOT_TOKEN, use_context=True)
    dp = updater.dispatcher

    set_bot_status(updater.bot)

    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(CommandHandler("status", status))
    dp.add_handler(CallbackQueryHandler(game_callback))
    dp.add_handler(CallbackQueryHandler(show_leaderboard, pattern="leaderboard"))
    dp.add_error_handler(error_handler)

    updater.start_polling()
    print("✅ Bot is running...")
    updater.idle()

if __name__ == "__main__":
    main()

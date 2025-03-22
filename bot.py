import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Updater, CommandHandler, CallbackQueryHandler, CallbackContext

BOT_TOKEN = os.getenv("BOT_TOKEN")

if not BOT_TOKEN:
    print("❌ BOT_TOKEN not received!")
    exit()
else:
    print("✅ BOT_TOKEN received.")

GAME_SHORT_NAME = "TrumpToss"
GAME_URL = "https://oscurantismo.github.io/trumptoss/"  # Your GitHub Pages game link

# /start handler with "Play" and "Leaderboard" buttons
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
    context.bot.send_message(
        chat_id=query.message.chat_id,
        text="To see your position, tap the 🏆 Leaderboard button inside the game UI."
    )
    context.bot.answer_callback_query(callback_query_id=query.id)

# Respond to the callback query by giving Telegram the game URL
def game_callback(update: Update, context: CallbackContext):
    query = update.callback_query

    if query.game_short_name == GAME_SHORT_NAME:
        context.bot.answer_callback_query(
            callback_query_id=query.id,
            url=GAME_URL
        )
    else:
        context.bot.answer_callback_query(
            callback_query_id=query.id,
            text="Unknown game 🤔"
        )

# /status command

def status(update: Update, context: CallbackContext):
    update.message.reply_text("✅ TrumpToss bot is online and running!")

# Set bot's visible description in the profile

def set_bot_status(bot):
    try:
        bot.set_my_description("🟢 Online – TrumpToss bot is running!")
        print("✅ Bot description updated.")
    except Exception as e:
        print("❌ Failed to set bot description:", e)

def main():
    updater = Updater(BOT_TOKEN, use_context=True)
    dp = updater.dispatcher

    set_bot_status(updater.bot)  # Set the bot's profile description

    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(CommandHandler("status", status))
    dp.add_handler(CallbackQueryHandler(game_callback))  # Handles game URL launch
    dp.add_handler(CallbackQueryHandler(show_leaderboard, pattern="leaderboard"))  # Handles leaderboard button

    updater.start_polling()
    print("✅ Bot is running...")
    updater.idle()

if __name__ == "__main__":
    main()

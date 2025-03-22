import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Updater, CommandHandler, CallbackQueryHandler, CallbackContext

BOT_TOKEN = "7998134637:AAFAm8jl483eovZoS8dMkfMpDKlCqqc1KAc"
GAME_SHORT_NAME = "trumptest"
GAME_URL = "https://oscurantismo.github.io/trumptoss/telegram-native-test"  # path to your test game folder

def start(update: Update, context: CallbackContext):
    keyboard = [
        [InlineKeyboardButton("👉 Play TrumpToss", callback_game={"game_short_name": GAME_SHORT_NAME})]
    ]
    context.bot.send_game(chat_id=update.effective_chat.id, game_short_name=GAME_SHORT_NAME, reply_markup=InlineKeyboardMarkup(keyboard))

def game_callback(update: Update, context: CallbackContext):
    query = update.callback_query
    if query.game_short_name == GAME_SHORT_NAME:
        context.bot.answer_callback_query(callback_query_id=query.id, url=GAME_URL)
    else:
        context.bot.answer_callback_query(callback_query_id=query.id, text="Unknown game")

def main():
    updater = Updater(BOT_TOKEN, use_context=True)
    dp = updater.dispatcher
    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(CallbackQueryHandler(game_callback))
    updater.start_polling()
    updater.idle()

if __name__ == "__main__":
    main()

import os
import logging
from telegram import (
    Update,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo
)
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    ContextTypes,
    CallbackQueryHandler
)

# === Config ===
BOT_TOKEN = os.getenv("BOT_TOKEN")
WEB_APP_URL = "https://oscurantismo.github.io/trumptoss/"

# === Logging ===
logging.basicConfig(format="%(asctime)s - %(levelname)s - %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

# === /start ===
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    logger.info(f"👋 /start triggered by {user.username} ({user.id})")

    # Show main options menu after pressing /start
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🕹 Play TrumpToss", web_app=WebAppInfo(url=WEB_APP_URL))],
        [InlineKeyboardButton("📊 Check Leaderboard", callback_data="leaderboard")],
        [InlineKeyboardButton("ℹ️ Info", callback_data="info")]
    ])

    await update.message.reply_text(
        text="Welcome to TrumpToss! Choose an option below:",
        reply_markup=keyboard
    )

# === Button callbacks ===
async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    if query.data == "leaderboard":
        await query.message.reply_text("🏆 Leaderboard:\n1. Player1\n2. Player2\n3. Player3")
    elif query.data == "info":
        await query.message.reply_text("ℹ️ TrumpToss is a Telegram Mini App where you throw shoes at Trump and climb the leaderboard.")

# === Error Logger ===
async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE):
    logger.error("❌ Exception occurred:", exc_info=context.error)
    if update:
        logger.warning(f"⚠️ Update that caused error: {update}")

# === Entry Point ===
if __name__ == "__main__":
    if not BOT_TOKEN:
        print("❌ BOT_TOKEN not set. Set it as an environment variable.")
        exit()

    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(button_callback, pattern="^(leaderboard|info)$"))
    app.add_error_handler(error_handler)

    print("🚀 TrumpToss Mini App bot is running...")
    app.run_polling()

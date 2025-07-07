from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.types import WebAppInfo

main_markup = (
    InlineKeyboardBuilder()
    .button(text="Открыть MiniApp", 
            web_app=WebAppInfo(url="https://yume-miniapp.ru"))
).as_markup()
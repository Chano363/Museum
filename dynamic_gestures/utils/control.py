import pyautogui
import time

# 设置延迟，避免操作过快
pyautogui.PAUSE = 1  # 每个操作后暂停1秒
pyautogui.FAILSAFE = True  # 启用安全模式（鼠标移到左上角可中断）

def PressKey(arg: str):

    pyautogui.press(arg)



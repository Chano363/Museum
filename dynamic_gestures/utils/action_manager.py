from .enums import Event
from comm.client import ShowImg
from .control import PressKey

class ActionManager:
    _instance = None
    _handlers = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def register_action_handler(self, action_type, handler):
        """注册动作处理器"""
        if action_type not in self._handlers:
            self._handlers[action_type] = []
        self._handlers[action_type].append(handler)
    
    def trigger_action(self, action_type, hand_object=None):
        """触发动作响应"""
        if action_type in self._handlers:
            for handler in self._handlers[action_type]:
                handler(action_type, hand_object)

def fistAction(action_type, hand_object):
    ShowImg(0)

def showAction(action_type, hand_object):
    if action_type in [Event.SWIPE_LEFT, Event.SWIPE_LEFT2, Event.SWIPE_LEFT3]:
        id = 1
    if action_type in [Event.SWIPE_RIGHT, Event.SWIPE_RIGHT2, Event.SWIPE_RIGHT3]:
        id = 2
    if action_type in [Event.SWIPE_UP, Event.SWIPE_UP2, Event.SWIPE_UP3, Event.FAST_SWIPE_UP]:
        id = 3
    if action_type in [Event.SWIPE_DOWN, Event.SWIPE_DOWN2, Event.SWIPE_DOWN3, Event.FAST_SWIPE_DOWN]:
        id = 4

    ShowImg(id)

def keyAction(action_type, hand_object):
    if action_type in [Event.SWIPE_LEFT, Event.SWIPE_LEFT2, Event.SWIPE_LEFT3]:
        arg = "left"
    if action_type in [Event.SWIPE_RIGHT, Event.SWIPE_RIGHT2, Event.SWIPE_RIGHT3]:
        arg = "right"
    if action_type in [Event.SWIPE_UP, Event.SWIPE_UP2, Event.SWIPE_UP3, Event.FAST_SWIPE_UP]:
        arg = "up"
    if action_type in [Event.SWIPE_DOWN, Event.SWIPE_DOWN2, Event.SWIPE_DOWN3, Event.FAST_SWIPE_DOWN]:
        arg = "down"

    PressKey(arg)

for action in [Event.SWIPE_LEFT, Event.SWIPE_LEFT2, Event.SWIPE_LEFT3,
               Event.SWIPE_RIGHT, Event.SWIPE_RIGHT2, Event.SWIPE_RIGHT3,
               Event.SWIPE_UP, Event.SWIPE_UP2, Event.SWIPE_UP3, Event.FAST_SWIPE_UP,
               Event.SWIPE_DOWN, Event.SWIPE_DOWN2, Event.SWIPE_DOWN3, Event.FAST_SWIPE_DOWN]:
    
    ActionManager().register_action_handler(action, showAction)
    ActionManager().register_action_handler(action, keyAction)

ActionManager().register_action_handler(Event.FIST, fistAction)
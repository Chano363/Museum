export interface BoundingBox {
  x1: number
  y1: number
  x2: number
  y2: number
  confidence: number
}

export interface HandDetection {
  bbox: BoundingBox
  gesture: number
  gestureName: string
}

export interface GestureEvent {
  type: string
  timestamp: number
  confidence: number
}

export enum GestureType {
  HAND_DOWN = 0,
  HAND_RIGHT = 1,
  HAND_LEFT = 2,
  THUMB_INDEX = 3,
  THUMB_LEFT = 4,
  THUMB_RIGHT = 5,
  THUMB_DOWN = 6,
  HALF_UP = 7,
  HALF_LEFT = 8,
  HALF_RIGHT = 9,
  HALF_DOWN = 10,
  PART_HAND_HEART = 11,
  PART_HAND_HEART2 = 12,
  FIST_INVERTED = 13,
  TWO_LEFT = 14,
  TWO_RIGHT = 15,
  TWO_DOWN = 16,
  GRABBING = 17,
  GRIP = 18,
  POINT = 19,
  CALL = 20,
  THREE3 = 21,
  LITTLE_FINGER = 22,
  MIDDLE_FINGER = 23,
  DISLIKE = 24,
  FIST = 25,
  FOUR = 26,
  LIKE = 27,
  MUTE = 28,
  OK = 29,
  ONE = 30,
  PALM = 31,
  PEACE = 32,
  PEACE_INVERTED = 33,
  ROCK = 34,
  STOP = 35,
  STOP_INVERTED = 36,
  THREE = 37,
  THREE2 = 38,
  TWO_UP = 39,
  TWO_UP_INVERTED = 40,
  THREE_GUN = 41,
  ONE_LEFT = 42,
  ONE_RIGHT = 43,
  ONE_DOWN = 44
}

export enum ActionType {
  ZOOM_IN = 'zoom_in',
  ZOOM_OUT = 'zoom_out',
  RESET = 'reset',
  TOGGLE_THUMBBAR = 'toggle_thumbbar',
  ROTATE = 'rotate',
  SWITCH = 'switch'
}

export const GESTURE_NAMES: Record<number, string> = {
  0: 'hand_down',
  1: 'hand_right',
  2: 'hand_left',
  3: 'thumb_index',
  4: 'thumb_left',
  5: 'thumb_right',
  6: 'thumb_down',
  7: 'half_up',
  8: 'half_left',
  9: 'half_right',
  10: 'half_down',
  11: 'part_hand_heart',
  12: 'part_hand_heart2',
  13: 'fist_inverted',
  14: 'two_left',
  15: 'two_right',
  16: 'two_down',
  17: 'grabbing',
  18: 'grip',
  19: 'point',
  20: 'call',
  21: 'three3',
  22: 'little_finger',
  23: 'middle_finger',
  24: 'dislike',
  25: 'fist',
  26: 'four',
  27: 'like',
  28: 'mute',
  29: 'ok',
  30: 'one',
  31: 'palm',
  32: 'peace',
  33: 'peace_inverted',
  34: 'rock',
  35: 'stop',
  36: 'stop_inverted',
  37: 'three',
  38: 'three2',
  39: 'two_up',
  40: 'two_up_inverted',
  41: 'three_gun',
  42: 'one_left',
  43: 'one_right',
  44: 'one_down'
}
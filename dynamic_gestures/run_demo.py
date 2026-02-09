import argparse
import time
import signal
import os

import cv2
import numpy as np

from main_controller import MainController
from utils import Drawer, Event, targets
from parser import parse_args
from config_manager import DynamicConfigManager

def run(args):
    # Initialize dynamic config manager - monitor configs/remote_debugger_config.json
    dynamic_config = DynamicConfigManager("configs/remote_debugger_config.json")
    
    # Initialize controller with initial parameters
    controller = MainController(
        args.detector, 
        args.classifier,
        max_age=args.max_age,
        min_hits=args.min_hits,
        iou_threshold=args.iou_threshold,
        confidence_threshold=args.confidence
    )
    
    # Store initial args for reinitialization
    initial_args = args
    
    # Set config change callback to reinitialize controller with new parameters
    def on_config_change(config):
        print(f"Configuration updated: {config}")
        
        # Get new parameter values from config
        new_confidence = config.get("confidence", initial_args.confidence)
        new_iou_threshold = config.get("iou_threshold", initial_args.iou_threshold)
        new_max_age = config.get("max_age", initial_args.max_age)
        new_min_hits = config.get("min_hits", initial_args.min_hits)
        
        # Reinitialize controller with new parameters
        nonlocal controller
        try:
            controller = MainController(
                initial_args.detector,
                initial_args.classifier,
                max_age=new_max_age,
                min_hits=new_min_hits,
                iou_threshold=new_iou_threshold,
                confidence_threshold=new_confidence
            )
            print(f"Controller reinitialized with new parameters: "
                  f"confidence={new_confidence}, iou_threshold={new_iou_threshold}, "
                  f"max_age={new_max_age}, min_hits={new_min_hits}")
        except Exception as e:
            print(f"Error reinitializing controller: {e}")
            print("Keeping original controller")
    
    dynamic_config.set_config_change_callback(on_config_change)
    
    # Create PID file
    pid_file = "/tmp/model.pid"
    with open(pid_file, 'w') as f:
        f.write(str(os.getpid()))
    print(f"PID file created: {pid_file}")
    
    cap = cv2.VideoCapture(args.camera_id)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, args.resolution_width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, args.resolution_height)

    actual_width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    actual_height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    print(f"Resolution: {actual_width}x{actual_height}")

    drawer = Drawer()
    debug_mode = args.debug
    
    while cap.isOpened():
        ret, frame = cap.read()
        frame = cv2.flip(frame, 1)
        if ret:
            start_time = time.time()
            
            # Use current controller (which may have been updated)
            bboxes, ids, labels = controller(frame)
            
            if debug_mode:
                if bboxes is not None and len(bboxes) > 0:
                    bboxes = bboxes.astype(np.int32)
                    for i in range(bboxes.shape[0]):
                        box = bboxes[i, :]
                        gesture = targets[labels[i]] if labels[i] is not None else "None"
                        
                        cv2.rectangle(frame, (box[0], box[1]), (box[2], box[3]), (255, 255, 0), 4)
                        cv2.putText(
                            frame,
                            f"ID {ids[i]} : {gesture}",
                            (box[0], box[1] - 10),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            1,
                            (0, 0, 255),
                            2,
                        )

                fps = 1.0 / ((time.time() - start_time) + 0.0001)
                cv2.putText(frame, f"fps {fps:.2f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                
            if len(controller.tracks) > 0:
                count_of_zoom = 0
                thumb_boxes = []
                for trk in controller.tracks:
                    if trk["tracker"].time_since_update < 1:
                        if len(trk['hands']):
                            count_of_zoom += (trk['hands'][-1].gesture == 3)

                            thumb_boxes.append(trk['hands'][-1].bbox)
                            if len(trk['hands']) > 3 and [trk['hands'][-1].gesture, trk['hands'][-2].gesture, trk['hands'][-3].gesture] == [23, 23, 23]:
                                x, y, x2, y2 = map(int, trk['hands'][-1].bbox)
                                x, y, x2, y2 = max(x, 0), max(y, 0), max(x2, 0), max(y2, 0)
                                bbox_area = frame[y:y2, x:x2]
                                blurred_bbox = cv2.GaussianBlur(bbox_area, (51, 51), 10)
                                frame[y:y2, x:x2] = blurred_bbox

                        if trk["hands"].action is not None:
                            if Event.SWIPE_LEFT == trk["hands"].action or  Event.SWIPE_LEFT2 == trk["hands"].action or  Event.SWIPE_LEFT3 == trk["hands"].action:
                                drawer.set_action(trk["hands"].action)
                                trk["hands"].action = None
                                ...
                            elif Event.SWIPE_RIGHT == trk["hands"].action or Event.SWIPE_RIGHT2 == trk["hands"].action or Event.SWIPE_RIGHT3 == trk["hands"].action:
                                drawer.set_action(trk["hands"].action)
                                trk["hands"].action = None
                                ...
                            elif Event.SWIPE_UP == trk["hands"].action or Event.SWIPE_UP2 == trk["hands"].action or Event.SWIPE_UP3 == trk["hands"].action:
                                drawer.set_action(trk["hands"].action)
                                trk["hands"].action = None
                                ...
                            elif Event.SWIPE_DOWN == trk["hands"].action or Event.SWIPE_DOWN2 == trk["hands"].action or Event.SWIPE_DOWN3 == trk["hands"].action:
                                drawer.set_action(trk["hands"].action)
                                trk["hands"].action = None
                                ...
                            elif Event.DRAG == trk["hands"].action:
                                drawer.set_action(trk["hands"].action)
                                ...
                            elif Event.DROP == trk["hands"].action:
                                drawer.set_action(trk["hands"].action)
                                trk["hands"].action = None
                                ...
                            elif Event.FAST_SWIPE_DOWN == trk["hands"].action:
                                drawer.set_action(trk["hands"].action)
                                trk["hands"].action = None
                                ...
                            elif Event.FAST_SWIPE_UP == trk["hands"].action:
                                drawer.set_action(trk["hands"].action)
                                trk["hands"].action = None
                                ...
                            elif Event.ZOOM_IN == trk["hands"].action:
                                drawer.set_action(trk["hands"].action)
                                trk["hands"].action = None
                                ...
                            elif Event.ZOOM_OUT == trk["hands"].action:
                                drawer.set_action(trk["hands"].action)
                                trk["hands"].action = None
                                ...
                            elif Event.DOUBLE_TAP == trk["hands"].action:
                                drawer.set_action(trk["hands"].action)
                                trk["hands"].action = None
                                ...
                            elif Event.DRAG2 == trk["hands"].action or Event.DRAG3 == trk["hands"].action:
                                drawer.set_action(trk["hands"].action)
                                ...
                            elif Event.DROP2 == trk["hands"].action or Event.DROP3 == trk["hands"].action:
                                drawer.set_action(trk["hands"].action)
                                trk["hands"].action = None
                                ...
                            elif Event.TAP == trk["hands"].action:
                                drawer.set_action(trk["hands"].action)
                                trk["hands"].action = None
                                ...
                            elif Event.COUNTERCLOCK == trk["hands"].action:
                                drawer.set_action(trk["hands"].action)
                                trk["hands"].action = None
                                ...
                            elif Event.CLOCKWISE == trk["hands"].action:
                                drawer.set_action(trk["hands"].action)
                                trk["hands"].action = None
                                ...
                                
                if count_of_zoom == 2:
                    drawer.draw_two_hands(frame, thumb_boxes)
            if debug_mode:
                frame = drawer.draw(frame)
            cv2.imshow("frame", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    # Clean up resources
    dynamic_config.stop()
    if os.path.exists(pid_file):
        os.remove(pid_file)
    print("Resources cleaned up")


if __name__ == "__main__":
    # Parse command line arguments
    args = parse_args()
    run(args)
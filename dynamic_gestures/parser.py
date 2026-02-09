import argparse
import json
import os
import sys
from typing import Dict, Any


class RemoteDebugParser:
    """Remote debugging parameter parser"""
    
    def __init__(self):
        self.parser = argparse.ArgumentParser(
            description='Gesture recognition remote debugging console',
            formatter_class=argparse.RawTextHelpFormatter,
            epilog="""
Examples:
  # Basic run
  python run_demo.py
  
  # Debug mode with parameter adjustment
  python run_demo.py --debug --confidence 0.7 --fps_limit 20
  
  # Load parameters from config file
  python run_demo.py --config configs/test_config.json
  
  # Save current parameters to config file
  python run_demo.py --debug --save_config configs/my_config.json
            """
        )
        self._setup_arguments()
    
    def _setup_arguments(self):
        """Setup all command line arguments"""
        
        # Model parameters
        model_group = self.parser.add_argument_group('Model Parameters')
        model_group.add_argument(
            '--detector',
            default='models/YOLOv10n_hands.onnx',
            type=str,
            help='Path to hand detection model'
        )
        model_group.add_argument(
            '--classifier',
            default='models/crops_classifier.onnx',
            type=str,
            help='Path to hand classification model'
        )
        
        # Algorithm parameters
        algo_group = self.parser.add_argument_group('Algorithm Parameters')
        algo_group.add_argument(
            '--confidence',
            type=float,
            default=0.5,
            help='Detection confidence threshold (0.1-0.9)'
        )
        algo_group.add_argument(
            '--iou_threshold',
            type=float,
            default=0.3,
            help='Tracking IOU threshold'
        )
        algo_group.add_argument(
            '--max_age',
            type=int,
            default=30,
            help='Maximum age of track'
        )
        algo_group.add_argument(
            '--min_hits',
            type=int,
            default=3,
            help='Minimum hits to confirm track'
        )
        
        # Performance parameters
        perf_group = self.parser.add_argument_group('Performance Parameters')
        perf_group.add_argument(
            '--fps_limit',
            type=int,
            default=0,
            help='FPS limit (0=no limit)'
        )
        perf_group.add_argument(
            '--resolution',
            type=str,
            default='1280x720',
            choices=['640x480', '1280x720', '1920x1080'],
            help='Camera resolution'
        )
        
        # Debug parameters
        debug_group = self.parser.add_argument_group('Debug Parameters')
        debug_group.add_argument(
            '--debug',
            action='store_true',
            help='Enable debug mode (show FPS, bounding boxes)'
        )
        debug_group.add_argument(
            '--log_level',
            type=str,
            default='INFO',
            choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
            help='Log level'
        )
        debug_group.add_argument(
            '--show_fps',
            action='store_true',
            help='Show FPS (auto-enabled in debug mode)'
        )
        debug_group.add_argument(
            '--show_tracks',
            action='store_true',
            help='Show tracking trails'
        )
        debug_group.add_argument(
            '--record_output',
            action='store_true',
            help='Record output video'
        )
        debug_group.add_argument(
            '--output_dir',
            type=str,
            default='./output',
            help='Output directory'
        )
        
        # Config file parameters
        config_group = self.parser.add_argument_group('Config File Parameters')
        config_group.add_argument(
            '--config',
            type=str,
            help='Load parameters from JSON config file'
        )
        config_group.add_argument(
            '--save_config',
            type=str,
            help='Save current parameters to JSON config file'
        )
        config_group.add_argument(
            '--list_params',
            action='store_true',
            help='List all available parameters and exit'
        )
        
        # Camera parameters
        camera_group = self.parser.add_argument_group('Camera Parameters')
        camera_group.add_argument(
            '--camera_id',
            type=int,
            default=0,
            help='Camera device ID'
        )
        camera_group.add_argument(
            '--flip_code',
            type=int,
            default=1,
            choices=[-1, 0, 1],
            help='Image flip mode: -1=both, 0=vertical, 1=horizontal'
        )
    
    def parse_args(self, input_args=None):
        """Parse command line arguments"""
        args = self.parser.parse_args(input_args)
        
        if args.config:
            self._load_from_config(args, args.config)
        
        if args.debug:
            args.show_fps = True
        
        if args.resolution:
            width, height = map(int, args.resolution.split('x'))
            args.resolution_width = width
            args.resolution_height = height
        
        self._validate_args(args)
        
        if args.list_params:
            self._print_all_params(args)
            sys.exit(0)
        
        if args.save_config:
            self._save_to_config(args, args.save_config)
        
        return args
    
    def _load_from_config(self, args, config_path):
        """Load parameters from JSON config file"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            for key, value in config.items():
                if hasattr(args, key):
                    setattr(args, key, value)
            
            print(f"Loaded config from {config_path}")
            
        except FileNotFoundError:
            print(f"Config file not found: {config_path}")
        except json.JSONDecodeError:
            print(f"Config file format error: {config_path}")
    
    def _save_to_config(self, args, config_path):
        """Save parameters to JSON config file"""
        os.makedirs(os.path.dirname(config_path), exist_ok=True)
        
        config = {}
        for key, value in vars(args).items():
            if key not in ['config', 'save_config', 'list_params']:
                config[key] = value
        
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        
        print(f"Parameters saved to: {config_path}")
        print("Use --config to load this config")
    
    def _validate_args(self, args):
        """Validate parameter values"""
        if not 0 < args.confidence < 1:
            print(f"Confidence out of range (0-1): {args.confidence}, reset to 0.5")
            args.confidence = 0.5
        
        if args.fps_limit < 0:
            print(f"FPS limit cannot be negative: {args.fps_limit}, reset to 0")
            args.fps_limit = 0
        
        if not os.path.exists(args.detector):
            print(f"Detection model file not found: {args.detector}")
        
        if not os.path.exists(args.classifier):
            print(f"Classification model file not found: {args.classifier}")
    
    def _print_all_params(self, current_args=None):
        """Print all available parameters"""
        print("=" * 60)
        print("GESTURE RECOGNITION PARAMETERS")
        print("=" * 60)

        if current_args:
            print("\nCURRENT VALUES:")
            for key, value in vars(current_args).items():
                if not key.startswith('_') and key not in ['config', 'save_config', 'list_params']:
                    print(f"{key:20} = {value}")
            print("-" * 40)

        print("\nALL PARAMETERS:")

        for action in self.parser._actions:
            if action.dest != 'help':
                param_names = ', '.join(action.option_strings)
                print(f"{param_names:30} {action.help}")

        print("\nExample: python run_demo.py --confidence 0.7 --debug")
    
    def get_args_dict(self, args=None):
        """Get parameter dictionary"""
        if args is None:
            args = self.parse_args()
        return vars(args)


def parse_args(input_args=None):
    """Quick parse function"""
    return RemoteDebugParser().parse_args(input_args)


def get_args_dict(input_args=None):
    """Get parameter dictionary"""
    parser = RemoteDebugParser()
    args = parser.parse_args(input_args)
    return parser.get_args_dict(args)


if __name__ == "__main__":
    print("Testing parameter parser...")
    
    test_args = ["--debug", "--confidence", "0.7", "--fps_limit", "20"]
    args = parse_args(test_args)
    
    print(f"\nParsed parameters:")
    for key, value in vars(args).items():
        if not key.startswith('_'):
            print(f"{key:20} = {value}")
import json
import os
import signal
import threading
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ConfigManager:
    """Configuration manager class for parsing JSON files and updating parameters in real-time"""
    
    def __init__(self, config_path="/tmp/remote_debugger_config.json"):
        self.config_path = config_path
        self.config_data = {}
        self.default_config = {
            "batchSize": 1,
            "inputSize": 224,
            "threads": 2,
            "precision": "int8",
            "confidence": 0.5,
            "iou_threshold": 0.3,
            "max_age": 30,
            "min_hits": 3,
            "fps_limit": 0
        }
        self.lock = threading.Lock()  # Thread lock to ensure safe config access
        self.config_change_callback = None  # Callback function for config changes
        
        # Initialize configuration
        self.load_config()
    
    def load_config(self):
        """Load configuration from file"""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    new_config = json.load(f)
                
                # Validate config format and parameter ranges
                validated_config = self.validate_config(new_config)
                
                with self.lock:
                    self.config_data.update(validated_config)
                
                logger.info(f"Configuration loaded from {self.config_path}: {self.config_data}")
                
                # Call callback function if available
                if self.config_change_callback:
                    self.config_change_callback(self.config_data)
                    
                return True
            else:
                # Use default configuration
                with self.lock:
                    self.config_data = self.default_config.copy()
                logger.info(f"Config file does not exist, using default config: {self.config_data}")
                return True
        except Exception as e:
            logger.error(f"Failed to load config file: {e}")
            # Use default config on error
            with self.lock:
                self.config_data = self.default_config.copy()
            return False
    
    def validate_config(self, config):
        """Validate config format and parameter ranges"""
        validated = {}
        
        # Validate and set batch size
        if "batchSize" in config:
            try:
                batch_size = int(config["batchSize"])
                if 1 <= batch_size <= 128:  # Set reasonable range
                    validated["batchSize"] = batch_size
                else:
                    logger.warning(f"Batch size out of range (1-128), using default value")
                    validated["batchSize"] = self.default_config["batchSize"]
            except (ValueError, TypeError):
                logger.warning("Batch size is not a valid number, using default value")
                validated["batchSize"] = self.default_config["batchSize"]
        else:
            validated["batchSize"] = self.default_config["batchSize"]
        
        # Validate and set input size
        if "inputSize" in config:
            try:
                input_size = int(config["inputSize"])
                if 32 <= input_size <= 1024:  # Set reasonable range
                    validated["inputSize"] = input_size
                else:
                    logger.warning(f"Input size out of range (32-1024), using default value")
                    validated["inputSize"] = self.default_config["inputSize"]
            except (ValueError, TypeError):
                logger.warning("Input size is not a valid number, using default value")
                validated["inputSize"] = self.default_config["inputSize"]
        else:
            validated["inputSize"] = self.default_config["inputSize"]
        
        # Validate and set thread count
        if "threads" in config:
            try:
                threads = int(config["threads"])
                if 1 <= threads <= 16:  # Set reasonable range
                    validated["threads"] = threads
                else:
                    logger.warning(f"Thread count out of range (1-16), using default value")
                    validated["threads"] = self.default_config["threads"]
            except (ValueError, TypeError):
                logger.warning("Thread count is not a valid number, using default value")
                validated["threads"] = self.default_config["threads"]
        else:
            validated["threads"] = self.default_config["threads"]
        
        # Validate and set precision
        if "precision" in config:
            precision = str(config["precision"]).lower()
            if precision in ["fp32", "fp16", "int8", "int4"]:
                validated["precision"] = precision
            else:
                logger.warning(f"Invalid precision type, using default value")
                validated["precision"] = self.default_config["precision"]
        else:
            validated["precision"] = self.default_config["precision"]
        
        # Validate and set confidence threshold
        if "confidence" in config:
            try:
                confidence = float(config["confidence"])
                if 0 < confidence < 1:  # Valid confidence range
                    validated["confidence"] = confidence
                else:
                    logger.warning(f"Confidence out of range (0-1), using default value")
                    validated["confidence"] = self.default_config["confidence"]
            except (ValueError, TypeError):
                logger.warning("Confidence is not a valid number, using default value")
                validated["confidence"] = self.default_config["confidence"]
        else:
            validated["confidence"] = self.default_config["confidence"]
        
        # Validate and set IOU threshold
        if "iou_threshold" in config:
            try:
                iou_threshold = float(config["iou_threshold"])
                if 0 <= iou_threshold <= 1:  # Valid IOU range
                    validated["iou_threshold"] = iou_threshold
                else:
                    logger.warning(f"IOU threshold out of range (0-1), using default value")
                    validated["iou_threshold"] = self.default_config["iou_threshold"]
            except (ValueError, TypeError):
                logger.warning("IOU threshold is not a valid number, using default value")
                validated["iou_threshold"] = self.default_config["iou_threshold"]
        else:
            validated["iou_threshold"] = self.default_config["iou_threshold"]
        
        # Validate and set max age
        if "max_age" in config:
            try:
                max_age = int(config["max_age"])
                if 1 <= max_age <= 100:  # Reasonable range for max age
                    validated["max_age"] = max_age
                else:
                    logger.warning(f"Max age out of range (1-100), using default value")
                    validated["max_age"] = self.default_config["max_age"]
            except (ValueError, TypeError):
                logger.warning("Max age is not a valid number, using default value")
                validated["max_age"] = self.default_config["max_age"]
        else:
            validated["max_age"] = self.default_config["max_age"]
        
        # Validate and set min hits
        if "min_hits" in config:
            try:
                min_hits = int(config["min_hits"])
                if 1 <= min_hits <= 20:  # Reasonable range for min hits
                    validated["min_hits"] = min_hits
                else:
                    logger.warning(f"Min hits out of range (1-20), using default value")
                    validated["min_hits"] = self.default_config["min_hits"]
            except (ValueError, TypeError):
                logger.warning("Min hits is not a valid number, using default value")
                validated["min_hits"] = self.default_config["min_hits"]
        else:
            validated["min_hits"] = self.default_config["min_hits"]
        
        # Validate and set FPS limit
        if "fps_limit" in config:
            try:
                fps_limit = int(config["fps_limit"])
                if fps_limit >= 0:  # FPS limit should be non-negative
                    validated["fps_limit"] = fps_limit
                else:
                    logger.warning(f"FPS limit cannot be negative, using default value")
                    validated["fps_limit"] = self.default_config["fps_limit"]
            except (ValueError, TypeError):
                logger.warning("FPS limit is not a valid number, using default value")
                validated["fps_limit"] = self.default_config["fps_limit"]
        else:
            validated["fps_limit"] = self.default_config["fps_limit"]
        
        # Copy other unvalidated config items
        for key, value in config.items():
            if key not in validated:
                validated[key] = value
        
        return validated
    
    def get_config(self, key, default=None):
        """Get configuration item"""
        with self.lock:
            return self.config_data.get(key, default)
    
    def update_config(self, new_config):
        """Update configuration"""
        validated_config = self.validate_config(new_config)
        with self.lock:
            self.config_data.update(validated_config)
        logger.info(f"Configuration updated: {self.config_data}")
        
        # Call callback function if available
        if self.config_change_callback:
            self.config_change_callback(self.config_data)
    
    def set_config_change_callback(self, callback):
        """Set callback function for config changes"""
        self.config_change_callback = callback


class ConfigFileHandler(FileSystemEventHandler):
    """Configuration file change handler"""
    
    def __init__(self, config_manager):
        self.config_manager = config_manager
    
    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith(self.config_manager.config_path.split('/')[-1]):
            logger.info(f"Detected config file change: {event.src_path}")
            self.config_manager.load_config()


class DynamicConfigManager:
    """Dynamic configuration manager with signal and file monitoring support"""
    
    def __init__(self, config_path="/tmp/remote_debugger_config.json"):
        self.config_manager = ConfigManager(config_path)
        self.running = True
        self.setup_signal_handlers()
        self.setup_file_watcher()
    
    def setup_signal_handlers(self):
        """Set up signal handlers"""
        signal.signal(signal.SIGUSR1, self.handle_config_reload_signal)
        logger.info("Signal handler set up")
    
    def handle_config_reload_signal(self, signum, frame):
        """Handle configuration reload signal"""
        logger.info(f"Received signal {signum}, reloading config file")
        self.config_manager.load_config()
    
    def setup_file_watcher(self):
        """Set up file monitoring"""
        self.event_handler = ConfigFileHandler(self.config_manager)
        self.observer = Observer()
        config_dir = os.path.dirname(self.config_manager.config_path) or '.'
        self.observer.schedule(self.event_handler, config_dir, recursive=False)
        self.observer.start()
        logger.info(f"File monitoring started, monitoring directory: {config_dir}")
    
    def get_config(self, key, default=None):
        """Get configuration item"""
        return self.config_manager.get_config(key, default)
    
    def update_config(self, new_config):
        """Update configuration"""
        self.config_manager.update_config(new_config)
    
    def set_config_change_callback(self, callback):
        """Set callback function for config changes"""
        self.config_manager.set_config_change_callback(callback)
    
    def get_all_configs(self):
        """Get all configuration values"""
        with self.config_manager.lock:
            return self.config_manager.config_data.copy()
    
    def stop(self):
        """Stop monitoring"""
        self.observer.stop()
        self.observer.join()
        logger.info("Config monitoring stopped")
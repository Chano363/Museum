import pytest
import numpy as np
import cv2
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from dynamic_gestures.onnx_models import HandDetection, HandClassification

class TestDynamicGestureModule:
    """测试动态手势识别模块"""
    
    @pytest.fixture(scope="class")
    def detection_model(self):
        """创建手部检测模型实例"""
        model_path = "dynamic_gestures/models/hand_detector.onnx"
        return HandDetection(model_path, confidence_threshold=0.5)
    
    @pytest.fixture(scope="class")
    def classification_model(self):
        """创建手势分类模型实例"""
        model_path = "dynamic_gestures/models/crops_classifier.onnx"
        return HandClassification(model_path)
    
    @pytest.fixture
    def test_image(self):
        """创建测试图像"""
        # 创建一个简单的测试图像
        img = np.zeros((480, 640, 3), dtype=np.uint8)
        # 在图像中央绘制一个白色矩形模拟手
        cv2.rectangle(img, (200, 150), (400, 350), (255, 255, 255), -1)
        return img
    
    def test_hand_detection_initialization(self, detection_model):
        """测试手部检测模型初始化"""
        assert detection_model is not None
        assert hasattr(detection_model, "__call__")
        assert hasattr(detection_model, "set_confidence")
    
    def test_hand_classification_initialization(self, classification_model):
        """测试手势分类模型初始化"""
        assert classification_model is not None
        assert hasattr(classification_model, "__call__")
        assert hasattr(classification_model, "get_crops")
    
    def test_hand_detection_basic(self, detection_model, test_image):
        """测试基本的手部检测功能"""
        boxes, probs = detection_model(test_image)
        assert isinstance(boxes, np.ndarray)
        assert isinstance(probs, np.ndarray)
        # 检测结果应该是可迭代的
        assert hasattr(boxes, '__iter__')
        assert hasattr(probs, '__iter__')
    
    def test_hand_detection_empty_image(self, detection_model):
        """测试空图像的处理"""
        # 创建空图像
        empty_img = np.zeros((0, 0, 3), dtype=np.uint8)
        boxes, probs = detection_model(empty_img)
        assert len(boxes) == 0
        assert len(probs) == 0
    
    def test_hand_detection_confidence_threshold(self, detection_model, test_image):
        """测试置信度阈值的调整"""
        # 测试默认阈值
        boxes, probs = detection_model(test_image)
        
        # 降低置信度阈值
        detection_model.set_confidence(0.1)
        boxes_low, probs_low = detection_model(test_image)
        
        # 恢复默认阈值
        detection_model.set_confidence(0.5)
        
        # 应该能够处理阈值调整
        assert isinstance(boxes_low, np.ndarray)
        assert isinstance(probs_low, np.ndarray)
    
    def test_hand_classification_basic(self, classification_model, test_image):
        """测试基本的手势分类功能"""
        # 创建模拟的边界框
        boxes = np.array([[200, 150, 400, 350]], dtype=np.int32)
        
        labels = classification_model(test_image, boxes)
        assert isinstance(labels, list)
    
    def test_hand_classification_empty_boxes(self, classification_model, test_image):
        """测试空边界框的处理"""
        labels = classification_model(test_image, np.array([]))
        assert isinstance(labels, list)
        assert len(labels) == 0
    
    def test_hand_classification_invalid_boxes(self, classification_model, test_image):
        """测试无效边界框的处理"""
        # 创建无效的边界框（宽度或高度为0）
        invalid_boxes = np.array([[200, 150, 200, 350]], dtype=np.int32)  # 宽度为0
        labels = classification_model(test_image, invalid_boxes)
        assert isinstance(labels, list)
    
    def test_get_square(self, classification_model, test_image):
        """测试get_square方法"""
        # 测试非正方形边界框
        box = (200, 150, 400, 350)  # 200x200的正方形
        square_box = classification_model.get_square(box, test_image)
        assert isinstance(square_box, tuple)
        assert len(square_box) == 4
        
        # 测试长方形边界框
        rectangle_box = (200, 150, 500, 350)  # 300x200的长方形
        square_box = classification_model.get_square(rectangle_box, test_image)
        assert isinstance(square_box, tuple)
        assert len(square_box) == 4
    
    def test_get_crops(self, classification_model, test_image):
        """测试get_crops方法"""
        # 创建测试边界框
        boxes = np.array([[200, 150, 400, 350]], dtype=np.int32)
        crops = classification_model.get_crops(test_image, boxes)
        assert isinstance(crops, list)
        assert len(crops) == 1
    
    def test_model_performance(self, detection_model, classification_model, test_image):
        """测试模型性能"""
        import time
        
        # 测试手部检测性能
        start_time = time.time()
        boxes, probs = detection_model(test_image)
        detection_time = time.time() - start_time
        print(f"手部检测时间: {detection_time:.3f}秒")
        assert detection_time < 1  # 检测时间应该小于1秒
        
        # 测试手势分类性能
        if len(boxes) > 0:
            start_time = time.time()
            labels = classification_model(test_image, boxes)
            classification_time = time.time() - start_time
            print(f"手势分类时间: {classification_time:.3f}秒")
            assert classification_time < 1  # 分类时间应该小于1秒

if __name__ == '__main__':
    pytest.main(['-v', __file__])

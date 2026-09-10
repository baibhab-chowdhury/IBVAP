import cv2
import torch
from ultralytics import YOLO

class YoloDetector:
    def __init__(self, model_name="yolov8n.pt"):
        self.model_name = model_name
        self.model = None
        self.target_classes = [0, 1, 2, 3, 5, 7]  # person, bicycle, car, motorcycle, bus, truck

    def load(self):
        if self.model is None:
            # Load with FP16 for speed and VRAM savings if CUDA is available
            self.model = YOLO(self.model_name)
            if torch.cuda.is_available():
                self.model.to('cuda')

    def is_loaded(self):
        return self.model is not None

    def apply_clahe(self, img):
        # Apply CLAHE on the L channel of LAB color space
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        return cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

    def predict(self, img, night_mode=False):
        self.load()
        
        if night_mode:
            img = self.apply_clahe(img)
            
        results = self.model(img, verbose=False, classes=self.target_classes, half=torch.cuda.is_available())
        
        detections = []
        for r in results:
            for box in r.boxes:
                detections.append({
                    "class_name": self.model.names[int(box.cls)],
                    "class_id": int(box.cls),
                    "confidence": float(box.conf),
                    "bbox": box.xyxy[0].tolist() # [x1, y1, x2, y2]
                })
        return detections

# Singleton pattern for lazy loading
_detector_instance = None

def get_detector():
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = YoloDetector()
    return _detector_instance

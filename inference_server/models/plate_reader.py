import cv2
import numpy as np
import re
from paddleocr import PaddleOCR

class PlateReader:
    def __init__(self):
        self.ocr = None

    def load(self):
        if self.ocr is None:
            # Initialize PaddleOCR
            # use_angle_cls=True helps with skewed plates
            # show_log=False prevents spamming the terminal
            self.ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)

    def is_loaded(self):
        return self.ocr is not None

    def clean_plate_text(self, text):
        """Removes spaces, hyphens, and non-alphanumeric characters."""
        return re.sub(r'[^A-Z0-9]', '', text.upper())

    def is_valid_indian_plate(self, text):
        """
        Basic heuristic for Indian plates (e.g. MH 12 AB 1234 -> MH12AB1234).
        Must be 8-10 characters, start with 2 letters, end with numbers.
        """
        cleaned = self.clean_plate_text(text)
        if 8 <= len(cleaned) <= 10 and cleaned[:2].isalpha() and cleaned[-2:].isdigit():
            return True
        return False

    def read_plate(self, img):
        self.load()
        # Run OCR on the image (expected to be a cropped vehicle or plate region)
        result = self.ocr.ocr(img, cls=True)
        
        if not result or not result[0]:
            return None
            
        best_plate = None
        highest_conf = 0.0
        
        # result[0] contains lines of detected text: [ [[box], (text, confidence)], ... ]
        for line in result[0]:
            text = line[1][0]
            confidence = float(line[1][1])
            
            cleaned_text = self.clean_plate_text(text)
            
            # Primary check: Does it match Indian plate formats?
            if self.is_valid_indian_plate(cleaned_text):
                if confidence > highest_conf:
                    highest_conf = confidence
                    best_plate = cleaned_text
                    
        # Fallback: If no strict match, grab the most confident alphanumeric string > 5 chars
        # (Useful for dirty plates or partial reads)
        if not best_plate:
            for line in result[0]:
                text = self.clean_plate_text(line[1][0])
                confidence = float(line[1][1])
                if len(text) >= 6 and confidence > 0.8 and confidence > highest_conf:
                    highest_conf = confidence
                    best_plate = text

        if best_plate:
            return {
                "plate_text": best_plate,
                "confidence": highest_conf
            }
        return None

# Singleton pattern for lazy loading
_plate_instance = None

def get_plate_reader():
    global _plate_instance
    if _plate_instance is None:
        _plate_instance = PlateReader()
    return _plate_instance

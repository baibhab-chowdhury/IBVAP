import cv2
import numpy as np

class NightEnhancer:
    def __init__(self, brightness_threshold=50, clip_limit=2.0, grid_size=(8, 8)):
        self.brightness_threshold = brightness_threshold
        self.clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=grid_size)

    def is_low_light(self, frame):
        """Calculates the mean brightness of the frame to determine if it's night."""
        # Convert to grayscale for a fast brightness check
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        mean_brightness = np.mean(gray)
        return mean_brightness < self.brightness_threshold

    def enhance(self, frame):
        """Applies CLAHE and lightweight noise reduction for dark frames."""
        # 1. Convert to LAB color space (separates lightness from color)
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # 2. Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to Lightness channel
        cl = self.clahe.apply(l)
        
        # 3. Merge back and convert to BGR
        limg = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        
        # 4. Lightweight noise reduction
        # CCTV night footage gets very grainy when brightened.
        # We use a Bilateral Filter instead of Non-Local Means because it's much faster on CPU
        # while still preserving the sharp edges of bounding boxes/people.
        enhanced = cv2.bilateralFilter(enhanced, d=5, sigmaColor=50, sigmaSpace=50)
        
        return enhanced

    def process(self, frame):
        """Returns the frame and a boolean indicating if night mode was applied."""
        if self.is_low_light(frame):
            return self.enhance(frame), True
        return frame, False

night_enhancer = NightEnhancer()

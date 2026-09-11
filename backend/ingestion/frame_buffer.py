import collections
import cv2
import os
import threading
from datetime import datetime

class FrameBuffer:
    def __init__(self, maxlen=300):
        # 300 frames @ 30fps = 10 seconds rolling window
        self.buffer = collections.deque(maxlen=maxlen)
        self._lock = threading.Lock()

    def add_frame(self, frame):
        with self._lock:
            self.buffer.append(frame)

    def get_snapshot(self):
        with self._lock:
            if self.buffer:
                return self.buffer[-1]
            return None

    def save_clip(self, output_dir, filename_prefix):
        """Saves the current buffer to an MP4 video clip."""
        with self._lock:
            if not self.buffer:
                return None
            frames = list(self.buffer)
        
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{filename_prefix}_{timestamp}.mp4"
        filepath = os.path.join(output_dir, filename)
        
        # Get dimensions from first frame
        height, width, _ = frames[0].shape
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(filepath, fourcc, 30.0, (width, height))
        
        for frame in frames:
            out.write(frame)
            
        out.release()
        return filepath

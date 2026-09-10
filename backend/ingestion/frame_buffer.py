import collections
import cv2
import os
from datetime import datetime

class FrameBuffer:
    def __init__(self, maxlen=300):
        # 300 frames @ 30fps = 10 seconds rolling window
        self.buffer = collections.deque(maxlen=maxlen)

    def add_frame(self, frame):
        self.buffer.append(frame)

    def get_snapshot(self):
        if self.buffer:
            return self.buffer[-1]
        return None

    def save_clip(self, output_dir, filename_prefix):
        """Saves the current buffer to an MP4 video clip."""
        if not self.buffer:
            return None
        
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{filename_prefix}_{timestamp}.mp4"
        filepath = os.path.join(output_dir, filename)
        
        # Get dimensions from first frame
        height, width, _ = self.buffer[0].shape
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(filepath, fourcc, 30.0, (width, height))
        
        for frame in self.buffer:
            out.write(frame)
            
        out.release()
        return filepath

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
        temp_filepath = filepath + ".temp.mp4"
        out = cv2.VideoWriter(temp_filepath, fourcc, 30.0, (width, height))
        
        for frame in frames:
            out.write(frame)
            
        out.release()
        
        # Convert to H.264 using FFmpeg for browser compatibility
        import subprocess
        try:
            # -y overwrites output, -vcodec libx264 encodes for HTML5 video
            subprocess.run(["ffmpeg", "-y", "-i", temp_filepath, "-vcodec", "libx264", "-preset", "fast", filepath], 
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)
        except Exception as e:
            print(f"[FrameBuffer] FFmpeg conversion failed, falling back to raw mp4v. {e}")
            # If it fails, just rename the temp file back
            if os.path.exists(temp_filepath):
                os.rename(temp_filepath, filepath)
                
        return filepath

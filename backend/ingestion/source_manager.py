import subprocess
import os
import signal
from pathlib import Path

class SourceManager:
    """Manages FFmpeg processes that push video to MediaMTX RTSP."""
    
    def __init__(self):
        self.processes = {}
        self.scripts_dir = Path(os.path.abspath(__file__)).parent.parent.parent / "scripts"
        
    def start_cam1_slideshow(self, footage_dir: str):
        """Generates concat playlist from all .mp4 files, starts FFmpeg."""
        if 1 in self.processes:
            self._kill_process(1)
            
        footage_path = Path(footage_dir)
        videos = list(footage_path.glob("*.mp4"))
        
        if not videos:
            print("No footage found for Cam 1 slideshow.")
            return

        playlist_path = self.scripts_dir / "playlist.txt"
        with open(playlist_path, "w") as f:
            for vid in videos:
                # Escape quotes in filename if any
                f.write(f"file '{vid.as_posix().replace(chr(39), chr(92)+chr(39))}'\n")

        # We re-encode to a standard resolution (720p) to avoid concat breaking due to different resolutions/codecs
        cmd = [
            "ffmpeg", "-stream_loop", "-1", "-re", "-f", "concat", "-safe", "0",
            "-i", str(playlist_path),
            "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
            "-an", "-c:v", "libx264", "-preset", "ultrafast", "-tune", "zerolatency",
            "-f", "rtsp", "-rtsp_transport", "tcp", "rtsp://localhost:8554/cam1"
        ]
        
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.processes[1] = {"source": "slideshow", "proc": proc}
        print("Cam 1 slideshow started.")

    def start_cam2(self, source_url_or_path: str):
        """Starts FFmpeg reading from source_url_or_path and pushing to cam2."""
        if 2 in self.processes:
            self._kill_process(2)
            
        # Standard copy stream for one file, or re-encode if it's IP webcam to be safe
        is_webcam = "http" in source_url_or_path or "rtsp" in source_url_or_path
        
        cmd = [
            "ffmpeg", "-stream_loop", "-1" if not is_webcam else "0", "-re",
            "-i", source_url_or_path,
            "-an",
            "-c:v", "copy" if not is_webcam else "libx264",
        ]
        
        if is_webcam:
            cmd.extend(["-preset", "ultrafast", "-tune", "zerolatency"])
            
        cmd.extend(["-f", "rtsp", "-rtsp_transport", "tcp", "rtsp://localhost:8554/cam2"])
        
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.processes[2] = {"source": source_url_or_path, "proc": proc}
        print(f"Cam 2 started with source: {source_url_or_path}")

    def switch_cam2(self, new_source: str):
        self.start_cam2(new_source)

    def _kill_process(self, cam_id: int):
        if cam_id in self.processes:
            proc_info = self.processes.pop(cam_id)
            proc = proc_info["proc"]
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    proc.kill()
                    
    def stop_all(self):
        self._kill_process(1)
        self._kill_process(2)

source_manager = SourceManager()

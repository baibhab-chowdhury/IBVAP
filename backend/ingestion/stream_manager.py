import cv2
import threading
import queue
import time
import asyncio
from ingestion.frame_buffer import FrameBuffer
from services.inference_client import get_detections
from analytics.tracker import MultiObjectTracker

class StreamWorker:
    def __init__(self, camera_id, rtsp_url):
        self.camera_id = camera_id
        self.rtsp_url = rtsp_url
        self.frame_buffer = FrameBuffer(maxlen=300) # 10 sec rolling window
        self.tracker = MultiObjectTracker()
        
        self.is_running = False
        self.thread = None
        self.frame_queue = queue.Queue(maxsize=1) # Drop all but newest frame to ensure ZERO lag
        
    def start(self):
        self.is_running = True
        self.thread = threading.Thread(target=self._read_stream, daemon=True)
        self.thread.start()
        
    def stop(self):
        self.is_running = False
        if self.thread:
            self.thread.join()

    def _read_stream(self):
        cap = cv2.VideoCapture(self.rtsp_url)
        
        # Hardcode frame skip for demo to keep up with real-time (process every Nth frame)
        frame_skip = 2 
        frame_count = 0
        
        while self.is_running:
            ret, frame = cap.read()
            if not ret:
                print(f"Camera {self.camera_id} disconnected. Reconnecting in 5s...")
                time.sleep(5)
                cap = cv2.VideoCapture(self.rtsp_url)
                continue
                
            # Always add to rolling buffer for recording
            self.frame_buffer.add_frame(frame.copy())
            
            # Only send every Nth frame to the AI pipeline to save GPU
            frame_count += 1
            if frame_count % frame_skip == 0:
                # Put in queue, drop oldest if full
                if self.frame_queue.full():
                    try:
                        self.frame_queue.get_nowait()
                    except queue.Empty:
                        pass
                self.frame_queue.put(frame)
                
        cap.release()

    async def process_next_frame(self):
        """Called by the main asyncio loop in pipeline.py to process one frame."""
        if self.frame_queue.empty():
            return None
            
        frame = self.frame_queue.get()
        
        # 1. Night Mode Auto-Enhancement
        from analytics.night_enhancer import night_enhancer
        processed_frame, is_night_mode = night_enhancer.process(frame)
        
        # 2. Send to GPU Server
        detections = await get_detections(processed_frame, night_mode=is_night_mode)
        
        # 3. Update ByteTrack
        annotated_frame, tracked_data = self.tracker.update(detections, processed_frame)
        
        # 4. Zone Intrusion Checks
        from analytics.virtual_fence import fence_manager
        intrusions = fence_manager.check_intrusions(tracked_data, self.camera_id)
        
        # 5. Behavior Analytics Checks
        from analytics.behavior import behavior_analyzer
        loitering_alerts = behavior_analyzer.analyze_loitering(intrusions, self.camera_id)
        crowd_alerts = behavior_analyzer.analyze_crowd_density(intrusions)
        
        # Check wrong direction (example usage for all tracked objects)
        from alerts.alert_engine import alert_engine
        from services.websocket_manager import manager
        from alerts.event_recorder import event_recorder
        
        new_alerts = alert_engine.process_intrusions(intrusions, self.camera_id)
        
        for alert_data in loitering_alerts:
            a = alert_engine.process_behavior("LOITERING", self.camera_id, alert_data["track_id"], alert_data["description"])
            if a: new_alerts.append(a)
            
        for alert_data in crowd_alerts:
            a = alert_engine.process_behavior("CROWD_DENSITY", self.camera_id, alert_data["zone_id"], alert_data["description"])
            if a: new_alerts.append(a)

        # Broadcast alerts and trigger event recording
        for alert in new_alerts:
            # Broadcast to frontend
            asyncio.create_task(manager.broadcast_json({"type": "alert", "data": alert}))
            # Save snapshot & video clip
            asyncio.create_task(event_recorder.record_event(alert, self.frame_buffer, processed_frame.copy()))
        
        return {
            "camera_id": self.camera_id,
            "raw_frame": processed_frame,
            "annotated_frame": annotated_frame,
            "raw_detections": detections,
            "tracking": tracked_data,
            "active_intrusions": intrusions
        }

class StreamManager:
    def __init__(self):
        self.workers = {} # {camera_id: StreamWorker}

    def add_stream(self, camera_id, rtsp_url):
        if camera_id in self.workers:
            return
        worker = StreamWorker(camera_id, rtsp_url)
        worker.start()
        self.workers[camera_id] = worker
        
    def remove_stream(self, camera_id):
        if camera_id in self.workers:
            self.workers[camera_id].stop()
            del self.workers[camera_id]

    def update_stream(self, camera_id, new_rtsp_url):
        self.remove_stream(camera_id)
        self.add_stream(camera_id, new_rtsp_url)

stream_manager = StreamManager()

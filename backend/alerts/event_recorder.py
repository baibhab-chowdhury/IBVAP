import os
import cv2
from datetime import datetime
import asyncio

class EventRecorder:
    def __init__(self, output_dir="events_storage"):
        # We store events outside the git tracking, locally for the demo
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def draw_alert_overlay(self, frame, alert_data):
        """Draws a red border and alert text on the snapshot frame."""
        annotated = frame.copy()
        
        # Draw red border around the whole frame
        cv2.rectangle(annotated, (0, 0), (annotated.shape[1]-1, annotated.shape[0]-1), (0, 0, 255), 8)
        
        # Draw Alert Type
        text = f"ALERT: {alert_data.get('type', 'UNKNOWN')} - {alert_data.get('description', '')}"
        
        # Add a black background rect for the text to make it readable
        (w, h), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
        cv2.rectangle(annotated, (15, 20), (15 + w + 10, 20 + h + 15), (0, 0, 0), -1)
        cv2.putText(annotated, text, (20, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2, cv2.LINE_AA)
        
        # Draw Timestamp
        time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(annotated, time_str, (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
        
        return annotated

    async def record_event(self, alert_data, frame_buffer, current_frame):
        """
        1. Saves a snapshot immediately.
        2. Waits a few seconds to capture post-event footage.
        3. Dumps the circular buffer to an MP4 clip.
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        prefix = f"{alert_data.get('type', 'EVENT')}_{timestamp}"
        
        # 1. Save Snapshot immediately
        snapshot_filename = f"{prefix}.jpg"
        snapshot_path = os.path.join(self.output_dir, snapshot_filename)
        
        annotated_frame = self.draw_alert_overlay(current_frame, alert_data)
        cv2.imwrite(snapshot_path, annotated_frame)
        
        alert_data["snapshot_path"] = snapshot_path
        
        # 2. Wait 3 seconds to capture post-event footage
        # Note: In a production app, we would branch this to an async queue 
        # so we don't block the pipeline, but using asyncio.create_task handles it.
        await asyncio.sleep(3)
        
        # 3. Save the rolling 10-second MP4 clip
        clip_path = frame_buffer.save_clip(self.output_dir, prefix)
        alert_data["clip_path"] = clip_path
        
        return alert_data

event_recorder = EventRecorder()

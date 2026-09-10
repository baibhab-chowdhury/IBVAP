import supervision as sv
import numpy as np

class MultiObjectTracker:
    def __init__(self):
        # ByteTrack is state-of-the-art and lightweight
        self.tracker = sv.ByteTrack()
        self.box_annotator = sv.BoxAnnotator()
        self.label_annotator = sv.LabelAnnotator(text_scale=0.5, text_thickness=1)
        
        # Store past trajectories: {track_id: [(x, y), (x, y), ...]}
        self.trajectories = {}

    def update(self, detections_json, frame):
        """
        Takes raw detections from the inference server, updates ByteTrack,
        and returns the annotated frame and tracked data.
        """
        if not detections_json:
            # Nothing detected
            return frame, None

        # Convert JSON detections to supervision Detections object
        boxes = []
        confidences = []
        class_ids = []
        
        for d in detections_json:
            boxes.append(d['bbox'])
            confidences.append(d['confidence'])
            class_ids.append(d['class_id'])
        
        sv_detections = sv.Detections(
            xyxy=np.array(boxes),
            confidence=np.array(confidences),
            class_id=np.array(class_ids)
        )
        
        # Update tracker (this assigns persistent IDs)
        tracked_detections = self.tracker.update_with_detections(sv_detections)
        
        # If no objects got tracked this frame
        if len(tracked_detections) == 0:
            return frame, tracked_detections

        # Update trajectories (centroids)
        for i in range(len(tracked_detections)):
            track_id = tracked_detections.tracker_id[i]
            bbox = tracked_detections.xyxy[i]
            
            # Calculate Centroid (cx, cy)
            cx = (bbox[0] + bbox[2]) / 2.0
            cy = (bbox[1] + bbox[3]) / 2.0
            
            if track_id not in self.trajectories:
                self.trajectories[track_id] = []
            
            self.trajectories[track_id].append((cx, cy))
            
            # Keep only the last 100 points to save memory
            if len(self.trajectories[track_id]) > 100:
                self.trajectories[track_id].pop(0)
        
        # Create labels for bounding boxes
        # Format: "Person #12 0.85"
        labels = [
            f"#{tracker_id} {conf:.2f}"
            for tracker_id, conf
            in zip(tracked_detections.tracker_id, tracked_detections.confidence)
        ]
        
        # Annotate the frame (for Option A / debugging)
        annotated_frame = frame.copy()
        annotated_frame = self.box_annotator.annotate(scene=annotated_frame, detections=tracked_detections)
        annotated_frame = self.label_annotator.annotate(scene=annotated_frame, detections=tracked_detections, labels=labels)
        
        return annotated_frame, tracked_detections

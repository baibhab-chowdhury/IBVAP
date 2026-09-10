from datetime import datetime
import time

class AlertEngine:
    def __init__(self):
        # Prevent spamming alerts for the same object in the same zone
        # Format: { "camera_1_zone_2_track_15": timestamp }
        self.recent_alerts = {}
        self.COOLDOWN_SECONDS = 15 

    def process_intrusions(self, intrusions, camera_id):
        """
        Takes the raw intrusions list and determines if a new alert should be generated.
        intrusions: list of dicts from fence_manager.check_intrusions()
        Returns: list of valid, unsuppressed alerts
        """
        new_alerts = []
        current_time = time.time()
        
        for intrusion in intrusions:
            zone_id = intrusion["zone_id"]
            track_id = intrusion["track_id"]
            
            # Create a unique key for deduplication
            alert_key = f"cam_{camera_id}_zone_{zone_id}_track_{track_id}"
            
            # Check cooldown
            if alert_key in self.recent_alerts:
                time_since_last = current_time - self.recent_alerts[alert_key]
                if time_since_last < self.COOLDOWN_SECONDS:
                    continue # Suppress this alert, it's a duplicate of a recent one
            
            # It's a new, valid alert
            self.recent_alerts[alert_key] = current_time
            
            alert = {
                "type": "ZONE_INTRUSION",
                "severity": "CRITICAL",
                "camera_id": camera_id,
                "zone_id": zone_id,
                "zone_name": intrusion["zone_name"],
                "track_id": track_id,
                "class_id": intrusion["class_id"],
                "timestamp": datetime.utcnow().isoformat(),
                "description": f"Intrusion detected in {intrusion['zone_name']}"
            }
            new_alerts.append(alert)
            
        return new_alerts

    def cleanup_old_alerts(self):
        """Removes old keys from memory to prevent memory leaks over time."""
        current_time = time.time()
        keys_to_delete = []
        for key, timestamp in self.recent_alerts.items():
            if current_time - timestamp > self.COOLDOWN_SECONDS * 2:
                keys_to_delete.append(key)
        for key in keys_to_delete:
            del self.recent_alerts[key]

alert_engine = AlertEngine()

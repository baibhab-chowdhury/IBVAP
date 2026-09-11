from datetime import datetime
import time

class AlertEngine:
    def __init__(self):
        # Prevent spamming alerts for the same object in the same zone
        # Format: { "camera_1_zone_2_track_15": timestamp }
        self.recent_alerts = {}
        self.COOLDOWN_SECONDS = 15 

    def _check_cooldown(self, alert_key):
        """Returns True if the alert is allowed (not in cooldown)."""
        current_time = time.time()
        if alert_key in self.recent_alerts:
            time_since_last = current_time - self.recent_alerts[alert_key]
            if time_since_last < self.COOLDOWN_SECONDS:
                return False
        self.recent_alerts[alert_key] = current_time
        return True

    def process_intrusions(self, intrusions, camera_id):
        """
        Takes the raw intrusions list and determines if a new alert should be generated.
        intrusions: list of dicts from fence_manager.check_intrusions()
        Returns: list of valid, unsuppressed alerts
        """
        new_alerts = []
        
        for intrusion in intrusions:
            zone_id = intrusion["zone_id"]
            track_id = intrusion["track_id"]
            
            alert_key = f"cam_{camera_id}_zone_{zone_id}_track_{track_id}"
            if not self._check_cooldown(alert_key):
                continue
            
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

    def process_face_match(self, match_data, camera_id, track_id=None):
        """
        Fires an alert when a known face is detected.
        match_data: dict from face_recognizer.identify() containing match_name, distance, is_watchlisted
        """
        name = match_data["match_name"]
        alert_key = f"cam_{camera_id}_face_{name}"
        if not self._check_cooldown(alert_key):
            return None
        
        is_watchlisted = match_data.get("is_watchlisted", False)
        
        alert = {
            "type": "FACE_WATCHLIST" if is_watchlisted else "FACE_AUTHORIZED",
            "severity": "CRITICAL" if is_watchlisted else "LOW",
            "camera_id": camera_id,
            "match_name": name,
            "distance": match_data["distance"],
            "track_id": track_id,
            "timestamp": datetime.utcnow().isoformat(),
            "description": f"{'⚠️ WATCHLISTED SUBJECT' if is_watchlisted else 'Authorized person'} \"{name}\" detected on Camera {camera_id}"
        }
        return alert

    def process_plate_detection(self, plate_text, camera_id):
        """Fires an alert when a number plate is successfully read."""
        alert_key = f"cam_{camera_id}_plate_{plate_text}"
        if not self._check_cooldown(alert_key):
            return None
        
        alert = {
            "type": "ANPR_READ",
            "severity": "INFO",
            "camera_id": camera_id,
            "plate_text": plate_text,
            "timestamp": datetime.utcnow().isoformat(),
            "description": f"Vehicle plate \"{plate_text}\" detected on Camera {camera_id}"
        }
        return alert

    def process_behavior(self, behavior_type, camera_id, track_id, details=""):
        """Fires an alert for behavioral analytics (loitering, wrong direction, crowd)."""
        alert_key = f"cam_{camera_id}_{behavior_type}_track_{track_id}"
        if not self._check_cooldown(alert_key):
            return None

        severity_map = {
            "LOITERING": "HIGH",
            "WRONG_DIRECTION": "MEDIUM",
            "CROWD_DENSITY": "HIGH",
        }

        alert = {
            "type": behavior_type,
            "severity": severity_map.get(behavior_type, "MEDIUM"),
            "camera_id": camera_id,
            "track_id": track_id,
            "timestamp": datetime.utcnow().isoformat(),
            "description": details or f"{behavior_type} detected on Camera {camera_id}"
        }
        return alert

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


import time
import numpy as np

class BehaviorAnalyzer:
    def __init__(self):
        # Track time spent by an object in a zone
        # Format: { "camId_zoneId_trackId": first_seen_timestamp }
        self.zone_entry_times = {}

    def analyze_loitering(self, intrusions, camera_id, loiter_threshold=60.0):
        """
        intrusions: current active intrusions from virtual_fence
        loiter_threshold: seconds an object must be in the zone to trigger an alert
        """
        current_time = time.time()
        loitering_alerts = []
        
        # Build a set of current active intrusion keys
        current_active_keys = set()
        
        for intrusion in intrusions:
            # Only monitor people for loitering
            if intrusion.get("class_id", -1) != 0: 
                continue
                
            zone_id = intrusion["zone_id"]
            track_id = intrusion["track_id"]
            
            key = f"{camera_id}_{zone_id}_{track_id}"
            current_active_keys.add(key)
            
            # If this is the first time we see this person in this zone
            if key not in self.zone_entry_times:
                self.zone_entry_times[key] = current_time
            else:
                # Calculate how long they've been here
                time_in_zone = current_time - self.zone_entry_times[key]
                if time_in_zone > loiter_threshold:
                    loitering_alerts.append({
                        "zone_id": zone_id,
                        "zone_name": intrusion["zone_name"],
                        "track_id": track_id,
                        "class_id": 0,
                        "time_in_zone": round(time_in_zone, 1),
                        "description": f"Subject loitering in {intrusion['zone_name']} for {round(time_in_zone, 1)}s"
                    })
                    
        # Cleanup tracking for people who have left the zone
        keys_to_remove = [k for k in self.zone_entry_times.keys() if k.startswith(f"{camera_id}_") and k not in current_active_keys]
        for k in keys_to_remove:
            del self.zone_entry_times[k]
            
        return loitering_alerts

    def analyze_crowd_density(self, intrusions, density_threshold=5):
        """Alerts if the number of people in a specific zone exceeds the threshold."""
        zone_counts = {}
        crowd_alerts = []
        
        for intrusion in intrusions:
            if intrusion.get("class_id", -1) == 0: # Person
                z_id = intrusion["zone_id"]
                zone_counts[z_id] = zone_counts.get(z_id, 0) + 1
                zone_counts[f"{z_id}_name"] = intrusion["zone_name"] # Cache name for alert
                
        for z_id, count in zone_counts.items():
            if isinstance(z_id, int) and count >= density_threshold:
                crowd_alerts.append({
                    "zone_id": z_id,
                    "zone_name": zone_counts[f"{z_id}_name"],
                    "count": count,
                    "description": f"Crowd of {count} people detected in {zone_counts[f'{z_id}_name']}"
                })
                
        return crowd_alerts

    def analyze_wrong_direction(self, trajectories, track_id, allowed_vector):
        """
        Checks if an object is moving opposite to the allowed direction.
        trajectories: dictionary from tracker.py containing past positions
        allowed_vector: (dx, dy) representing allowed flow direction
        """
        if track_id not in trajectories or len(trajectories[track_id]) < 15:
            return False
            
        # Get start and end points of the recent trajectory window
        history = trajectories[track_id]
        start_pt = history[-15] # Point from ~1 second ago
        end_pt = history[-1]    # Current point
        
        movement_vector = np.array([end_pt[0] - start_pt[0], end_pt[1] - start_pt[1]])
        allowed = np.array(allowed_vector)
        
        # Calculate dot product
        # Negative dot product means the vectors are pointing in opposite directions (>90 degrees apart)
        dot_product = np.dot(movement_vector, allowed)
        
        return dot_product < -0.5 

behavior_analyzer = BehaviorAnalyzer()

from shapely.geometry import Point, Polygon

class VirtualFence:
    def __init__(self):
        # Dictionary to store active zones
        # Format: { zone_id: {"name": "Restricted", "polygon": Polygon(), "camera_id": 1} }
        self.zones = {}
    
    def load_zones_from_db(self, zones_data):
        """Loads zones from the database (JSON dict)."""
        self.zones.clear()
        for zone in zones_data:
            if len(zone['coordinates']) >= 3:
                self.zones[zone['id']] = {
                    "name": zone['name'],
                    "camera_id": zone['camera_id'],
                    "polygon": Polygon([(pt['x'], pt['y']) for pt in zone['coordinates']])
                }

    def add_zone(self, zone_id, name, points, camera_id):
        """points is a list of (x, y) tuples."""
        if len(points) >= 3:
            self.zones[zone_id] = {
                "name": name,
                "camera_id": camera_id,
                "polygon": Polygon(points)
            }

    def check_intrusions(self, tracking_data, camera_id):
        """
        Evaluates if tracked objects' "feet" are inside any restricted zone.
        tracking_data: ByteTrack sv.Detections
        Returns: List of active intrusions
        """
        intrusions = []
        if not tracking_data or len(tracking_data) == 0:
            return intrusions

        # Filter zones belonging to this specific camera
        camera_zones = {k: v for k, v in self.zones.items() if v["camera_id"] == camera_id}
        if not camera_zones:
            return intrusions

        for i in range(len(tracking_data)):
            track_id = int(tracking_data.tracker_id[i]) if tracking_data.tracker_id is not None else -1
            if track_id == -1:
                continue
                
            bbox = tracking_data.xyxy[i]
            
            # Use the bottom-center of the bounding box to represent the object's "feet" location
            cx = (bbox[0] + bbox[2]) / 2.0
            bottom_y = bbox[3]
            point = Point(cx, bottom_y)

            for zone_id, zone_data in camera_zones.items():
                if zone_data["polygon"].contains(point):
                    intrusions.append({
                        "zone_id": zone_id,
                        "zone_name": zone_data["name"],
                        "track_id": track_id,
                        "class_id": int(tracking_data.class_id[i]),
                        "bbox": bbox.tolist()
                    })
                    
        return intrusions

fence_manager = VirtualFence()

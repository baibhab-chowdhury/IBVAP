from fastapi import APIRouter
from pydantic import BaseModel
from analytics.virtual_fence import fence_manager

router = APIRouter()

class ZonePoint(BaseModel):
    x: float
    y: float

class ZoneCreate(BaseModel):
    name: str
    camera_id: int
    coordinates: list[ZonePoint]

# In-memory zone storage for demo
_zones_store: list[dict] = []
_next_zone_id = 2  # Start at 2 since demo zone is ID 1

@router.get("/")
async def list_zones():
    return {"zones": _zones_store}

@router.post("/")
async def create_zone(zone: ZoneCreate):
    global _next_zone_id
    zone_data = {
        'id': _next_zone_id,
        'name': zone.name,
        'camera_id': zone.camera_id,
        'coordinates': [{'x': pt.x, 'y': pt.y} for pt in zone.coordinates]
    }
    _zones_store.append(zone_data)
    _next_zone_id += 1
    
    fence_manager.load_zones_from_db(_zones_store)
    
    return {"status": "success", "zone": zone_data}

@router.delete("/camera/{camera_id}")
async def clear_camera_zones(camera_id: int):
    global _zones_store
    _zones_store = [z for z in _zones_store if z['camera_id'] != camera_id]
    
    # Reload all zones into the fence manager
    fence_manager.load_zones_from_db(_zones_store)
    
    return {"status": "success", "message": f"Cleared all zones for camera {camera_id}"}

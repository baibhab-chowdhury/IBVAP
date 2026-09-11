from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from database.database import init_db
from api import routes_cameras

app = FastAPI(title="IBVAP Backend Server", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(routes_cameras.router, prefix="/api/cameras", tags=["cameras"])

import asyncio
from services.websocket_manager import manager
from ingestion.stream_manager import stream_manager

@app.on_event("startup")
async def on_startup():
    await init_db()
    
    # Auto-register the 2-Camera Mode
    cameras = [
        {"id": 1, "url": "rtsp://localhost:8554/cam1"},  # Slideshow Cam
        {"id": 2, "url": "rtsp://localhost:8554/cam2"},  # Subhodeep / Phone Cam
    ]
    
    for cam in cameras:
        stream_manager.add_stream(camera_id=cam["id"], rtsp_url=cam["url"])
    
    # Start the main background pipeline loop
    asyncio.create_task(run_pipeline())

from pydantic import BaseModel
class StreamSwitchRequest(BaseModel):
    url: str

@app.post("/api/cameras/{cam_id}/switch")
async def switch_camera(cam_id: int, request: StreamSwitchRequest):
    stream_manager.update_stream(camera_id=cam_id, new_rtsp_url=request.url)
    return {"status": "success", "message": f"Camera {cam_id} switched to {request.url}"}

async def run_pipeline():
    """Main background loop that processes frames and broadcasts tracking data."""
    while True:
        # Loop through all active camera workers
        for cam_id, worker in list(stream_manager.workers.items()):
            result = await worker.process_next_frame()
            if result and result["tracking"] is not None:
                # Convert ByteTrack detections to JSON-friendly format for the frontend
                tracker_data = result["tracking"]
                frame_h, frame_w, _ = result["raw_frame"].shape
                
                boxes = []
                
                # YOLOv8 default classes
                CLASS_MAP = {
                    0: "person", 1: "bicycle", 2: "car", 3: "motorcycle", 
                    5: "bus", 7: "truck"
                }
                
                for i in range(len(tracker_data)):
                    # Absolute pixels from YOLO/ByteTrack
                    x1, y1, x2, y2 = tracker_data.xyxy[i].tolist()
                    
                    # Normalize to 0-1 for the React Canvas
                    norm_box = [x1/frame_w, y1/frame_h, x2/frame_w, y2/frame_h]
                    
                    track_id = int(tracker_data.tracker_id[i]) if tracker_data.tracker_id is not None else -1
                    cls_id = int(tracker_data.class_id[i])
                    conf = float(tracker_data.confidence[i])
                    
                    class_name = CLASS_MAP.get(cls_id, "unknown")
                    
                    # Spatial matching: find the raw YOLO detection that matches this tracked box
                    face_name = "Unknown"
                    is_watchlisted = False
                    plate_text = None
                    
                    if "raw_detections" in result:
                        cx = (x1 + x2) / 2
                        cy = (y1 + y2) / 2
                        for raw_det in result["raw_detections"]:
                            if raw_det.get("class_name") == class_name:
                                rx1, ry1, rx2, ry2 = raw_det["bbox"]
                                if rx1 <= cx <= rx2 and ry1 <= cy <= ry2:
                                    if class_name == "person":
                                        face_name = raw_det.get("face_name", "Unknown")
                                        is_watchlisted = raw_det.get("is_watchlisted", False)
                                    elif class_name in ["car", "bus", "truck"]:
                                        plate_text = raw_det.get("plate_text")
                                    break
                    
                    boxes.append({
                        "bbox": norm_box,
                        "track_id": track_id,
                        "class_id": cls_id,
                        "class_name": class_name,
                        "confidence": conf,
                        "face_name": face_name,
                        "is_watchlisted": is_watchlisted,
                        "plate_text": plate_text
                    })
                
                # Broadcast the live tracking coordinates to the React Dashboard
                payload = {
                    "type": "tracking_update",
                    "camera_id": cam_id,
                    "detections": boxes
                }
                await manager.broadcast_json(payload)
                
        await asyncio.sleep(0.01) # Small sleep to yield control to event loop

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "IBVAP Backend"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Can handle incoming UI commands here if needed
    except Exception:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

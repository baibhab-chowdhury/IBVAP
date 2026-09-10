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
    
    # Example: Start a test stream (this will eventually be driven by DB config)
    # stream_manager.add_stream(camera_id=1, rtsp_url="rtsp://localhost:8554/cam1")
    
    # Start the main background pipeline loop
    asyncio.create_task(run_pipeline())

async def run_pipeline():
    """Main background loop that processes frames and broadcasts tracking data."""
    while True:
        # Loop through all active camera workers
        for cam_id, worker in list(stream_manager.workers.items()):
            result = await worker.process_next_frame()
            if result and result["tracking"] is not None:
                # Convert ByteTrack detections to JSON-friendly format for the frontend
                tracker_data = result["tracking"]
                boxes = []
                for i in range(len(tracker_data)):
                    box = tracker_data.xyxy[i].tolist()
                    track_id = int(tracker_data.tracker_id[i]) if tracker_data.tracker_id is not None else -1
                    cls_id = int(tracker_data.class_id[i])
                    conf = float(tracker_data.confidence[i])
                    boxes.append({
                        "bbox": box,
                        "track_id": track_id,
                        "class_id": cls_id,
                        "confidence": conf
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

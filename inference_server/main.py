from fastapi import FastAPI, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np

# Lazy loaded models to save VRAM
from models.detector import get_detector
from models.face_recognizer import get_face_recognizer

app = FastAPI(title="IBVAP Inference Server", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "IBVAP GPU Inference Server",
        "models_loaded": {
            "yolo": get_detector().is_loaded(),
            "face": get_face_recognizer().is_loaded()
        }
    }

@app.post("/detect")
async def detect(
    frame: UploadFile = File(...),
    night_mode: bool = Query(False, description="Apply CLAHE before detection")
):
    contents = await frame.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Process with YOLOv8
    detector = get_detector()
    detections = detector.predict(img, night_mode=night_mode)
    
    return {"detections": detections}

@app.post("/face/enroll")
async def face_enroll(person_name: str = Query(...), face_img: UploadFile = File(...)):
    contents = await face_img.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    frs = get_face_recognizer()
    success = frs.enroll(img, person_name)
    
    if success:
        return {"status": "success", "message": f"Enrolled {person_name}"}
    return {"status": "failed", "message": "No face found or face too small (>80x80px required)"}

@app.post("/face/identify")
async def face_identify(face_img: UploadFile = File(...)):
    contents = await face_img.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    frs = get_face_recognizer()
    match = frs.identify(img)
    
    if match:
        return {"status": "matched", "data": match}
    return {"status": "no_match"}

@app.post("/plate")
async def plate_recognize(plate_img: UploadFile = File(...)):
    contents = await plate_img.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    from models.plate_reader import get_plate_reader
    anpr = get_plate_reader()
    
    result = anpr.read_plate(img)
    if result:
        return {"status": "success", "data": result}
    
    return {"status": "failed", "message": "No readable plate found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

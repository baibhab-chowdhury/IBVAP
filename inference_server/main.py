from fastapi import FastAPI, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np

# Lazy loaded models to save VRAM
from models.detector import get_detector
from models.face_recognizer import get_face_recognizer
from models.plate_reader import get_plate_reader

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
            "face": get_face_recognizer().is_loaded(),
            "anpr": get_plate_reader().is_loaded()
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
    
    # Run Face Recognition and ANPR
    frs = get_face_recognizer()
    anpr = get_plate_reader()
    
    for det in detections:
        det["face_name"] = "Unknown"
        det["is_watchlisted"] = False
        det["plate_text"] = None
        
        x1, y1, x2, y2 = [int(v) for v in det["bbox"]]
        h, w, _ = img.shape
        crop = img[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
        
        if crop.size == 0:
            continue
            
        if det["class_name"] == "person":
            if frs.get_enrolled_count() > 0:
                match = frs.identify(crop)
                if match:
                    det["face_name"] = match["match_name"]
                    det["is_watchlisted"] = match["is_watchlisted"]
                    
        elif det["class_name"] in ["car", "truck", "bus"]:
            # Only run heavy OCR if the car is large enough (close to camera)
            if (x2 - x1) > 150: 
                plate_data = anpr.read_plate(crop)
                if plate_data:
                    det["plate_text"] = plate_data["text"]
    
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

@app.get("/face/list")
async def face_list():
    """Returns all enrolled faces and their names."""
    frs = get_face_recognizer()
    return {
        "enrolled_count": frs.get_enrolled_count(),
        "names": frs.get_enrolled_names()
    }

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

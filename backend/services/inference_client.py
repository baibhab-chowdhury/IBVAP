import httpx
import cv2
import os
from dotenv import load_dotenv

load_dotenv()

# Defaults to localhost if not specified (useful for testing on same machine)
INFERENCE_SERVER_URL = os.getenv("INFERENCE_SERVER_URL", "http://127.0.0.1:8001")

async def get_detections(frame, night_mode=False):
    """
    Encodes the frame as JPEG and sends it to the GPU inference server.
    Returns a list of detections: [{class_name, class_id, confidence, bbox}]
    """
    # Encode frame to JPEG to save network bandwidth
    success, encoded_image = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    if not success:
        return []
    
    image_bytes = encoded_image.tobytes()
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{INFERENCE_SERVER_URL}/detect",
                params={"night_mode": night_mode},
                files={"frame": ("frame.jpg", image_bytes, "image/jpeg")},
                timeout=2.0 # Fast timeout, drop frame if AI is lagging
            )
            if response.status_code == 200:
                return response.json().get("detections", [])
        except httpx.ReadTimeout:
            print("Warning: Inference server timed out. Dropping frame.")
        except Exception as e:
            print(f"Error calling inference server: {e}")
            
    return []

import os
import requests

# URL of your GPU Inference Server
API_URL = "http://localhost:8001/face/enroll"
FACES_DIR = r"c:\Users\Baibhab\OneDrive\Documents\BAibhab docs\workspace\smart_india_hackathon\registered_faces"

def register_all():
    if not os.path.exists(FACES_DIR):
        print(f"Directory not found: {FACES_DIR}")
        return

    # Check if directory is empty
    files = [f for f in os.listdir(FACES_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    if not files:
        print(f"No JPG or PNG images found in {FACES_DIR}")
        print("Please add your selfies there and try again.")
        return

    print(f"Found {len(files)} photos. Starting registration...")
    print("-" * 50)

    for filename in files:
        filepath = os.path.join(FACES_DIR, filename)
        
        # Determine the name from the filename (e.g., "Rahul_Authorized.jpg" -> "Rahul_Authorized")
        person_name = os.path.splitext(filename)[0]
        
        print(f"Registering: {person_name}...")
        
        with open(filepath, "rb") as f:
            files_payload = {"face_img": (filename, f, "image/jpeg")}
            try:
                response = requests.post(f"{API_URL}?person_name={person_name}", files=files_payload)
                result = response.json()
                
                if result.get("status") == "success":
                    print(f"  [OK] Successfully enrolled!")
                else:
                    print(f"  [ERROR] {result.get('message')}")
            except Exception as e:
                print(f"  [ERROR] Could not connect to API. Is the Inference Server running on port 8001?")
                break
                
    print("-" * 50)
    print("Registration process complete!")

if __name__ == "__main__":
    register_all()

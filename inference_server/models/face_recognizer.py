import cv2
import numpy as np
import faiss
import torch
from insightface.app import FaceAnalysis

class FaceRecognizer:
    def __init__(self):
        self.app = None
        # FAISS Index for 512-dimensional embeddings (ArcFace standard)
        self.index = faiss.IndexFlatL2(512) 
        self.identities = [] # Maps FAISS index to person name/ID
        
    def load(self):
        if self.app is None:
            # 'buffalo_l' pack includes RetinaFace (detection) and ArcFace (recognition)
            self.app = FaceAnalysis(name='buffalo_l')
            # Use GPU if available (ctx_id=0), else CPU (ctx_id=-1)
            ctx_id = 0 if torch.cuda.is_available() else -1
            self.app.prepare(ctx_id=ctx_id, det_size=(640, 640))

    def is_loaded(self):
        return self.app is not None

    def extract_embedding(self, img):
        self.load()
        faces = self.app.get(img)
        if not faces:
            return None
        
        # If multiple faces in crop, assume the largest face is the target
        faces = sorted(faces, key=lambda x: (x.bbox[2]-x.bbox[0]) * (x.bbox[3]-x.bbox[1]), reverse=True)
        target_face = faces[0]
        
        # QUALITY GATE: Face must be at least 80x80 pixels for reliable recognition
        width = target_face.bbox[2] - target_face.bbox[0]
        height = target_face.bbox[3] - target_face.bbox[1]
        
        if width < 80 or height < 80:
            return None # Face too blurry/distant, discard to save compute
            
        return target_face.embedding

    def enroll(self, img, person_name):
        """Enrolls a new face into the FAISS index."""
        embedding = self.extract_embedding(img)
        if embedding is not None:
            # FAISS requires 2D array of float32
            emb_array = np.array([embedding], dtype=np.float32)
            self.index.add(emb_array)
            self.identities.append(person_name)
            return True
        return False

    def identify(self, img, threshold=1.2): # L2 distance threshold
        """Searches the FAISS index for a matching face."""
        if self.index.ntotal == 0:
            return None
            
        embedding = self.extract_embedding(img)
        if embedding is None:
            return None
            
        emb_array = np.array([embedding], dtype=np.float32)
        distances, indices = self.index.search(emb_array, 1)
        
        # Lower L2 distance is better (closer match)
        if distances[0][0] < threshold:
            matched_idx = indices[0][0]
            return {
                "match_name": self.identities[matched_idx],
                "distance": float(distances[0][0])
            }
        return None

# Singleton pattern for lazy loading
_face_instance = None

def get_face_recognizer():
    global _face_instance
    if _face_instance is None:
        _face_instance = FaceRecognizer()
    return _face_instance

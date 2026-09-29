# IBVAP - Intelligent Video Analytics Platform

## 📌 About the System

This project was developed for the **Smart India Hackathon**. It is a comprehensive, microservices-based Intelligent Video Analytics Platform designed to process live video feeds, perform real-time computer vision inference (such as face detection and object tracking), and present analytics through a centralized dashboard. 

### 🏗 Architecture
The system consists of four primary components:
1. **Frontend**: A Next.js based web application providing a user interface for monitoring live feeds, reviewing stored events, and visualizing analytics using tools like React Leaflet and Recharts.
2. **Backend**: A FastAPI backend responsible for database management (SQLite), routing API requests, and managing event data.
3. **Inference Server**: A standalone Python service built to run GPU-accelerated computer vision models (e.g., YOLO). It includes dedicated endpoints for registering faces and running real-time inferences.
4. **MediaMTX**: An open-source RTSP/WebRTC media server for efficient video stream routing and broadcast.

---

## 📥 Prerequisites & Downloading Dependencies

To run the platform, it is highly recommended to use Docker, which handles all dependencies seamlessly. However, if you wish to run the modules independently, you'll need the appropriate local environments.

### Required Software
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) and Docker Compose (Recommended)
- **Node.js** (v18+) and **npm** (if running frontend locally)
- **Python** (v3.10+) (if running backend/inference locally)
- *Optional:* NVIDIA GPU with `nvidia-container-toolkit` for GPU-accelerated inference

### Installing Dependencies Locally (Without Docker)

If you are developing locally without Docker, install the dependencies for each module separately:

**1. Frontend Dependencies:**
```bash
cd frontend
npm install
```

**2. Backend Dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

**3. Inference Server Dependencies:**
```bash
cd inference_server
pip install -r requirements.txt
```

---

## 🚀 How to Set It Up

### Method 1: Using Docker Compose (Recommended & Easiest)

1. **Clone the repository:**
   ```bash
   git clone <your-github-repo-url>
   cd smart_india_hackathon
   ```

2. **Start the containers:**
   Run the following command in the root directory where `docker-compose.yml` is located:
   ```bash
   docker-compose up --build -d
   ```
   *Note: If you have an NVIDIA GPU, you can uncomment the `deploy` section under `inference_server` in the `docker-compose.yml` file to enable GPU support.*

3. **Access the platform:**
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Inference API**: [http://localhost:8001](http://localhost:8001)
   - **MediaMTX (WebRTC)**: `http://localhost:8889`

4. **Register Faces for Recognition:**
   To add authorized faces to the database:
   - Place your images (JPG/PNG format) inside the `registered_faces/` folder. Name the file with the person's name (e.g., `Rahul_Authorized.jpg`).
   - Run the enrollment script:
     ```bash
     python register_faces.py
     ```

### Method 2: Running Services Locally

If you prefer running everything natively:

1. **Start MediaMTX:**
   Download the latest release from the [bluenviron/mediamtx](https://github.com/bluenviron/mediamtx) GitHub repository and execute the binary.

2. **Start Inference Server:**
   ```bash
   cd inference_server
   uvicorn main:app --port 8001 --reload
   ```

3. **Start Backend Server:**
   Ensure MediaMTX and the Inference Server are running, then execute:
   ```bash
   cd backend
   uvicorn main:app --port 8000 --reload
   ```

4. **Start Frontend Client:**
   ```bash
   cd frontend
   npm run dev
   ```
   The web application will now be accessible at `http://localhost:3000`.

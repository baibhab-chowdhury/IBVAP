from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from database.database import get_db
from database.models import Camera

router = APIRouter()

class CameraCreate(BaseModel):
    name: str
    rtsp_url: str
    location: str
    latitude: float | None = None
    longitude: float | None = None

class CameraResponse(CameraCreate):
    id: int
    status: str

    class Config:
        orm_mode = True

@router.get("/", response_model=list[CameraResponse])
async def get_cameras(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Camera))
    return result.scalars().all()

@router.post("/", response_model=CameraResponse)
async def add_camera(camera: CameraCreate, db: AsyncSession = Depends(get_db)):
    new_camera = Camera(**camera.dict())
    db.add(new_camera)
    await db.commit()
    await db.refresh(new_camera)
    return new_camera

@router.delete("/{camera_id}")
async def delete_camera(camera_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    await db.delete(camera)
    await db.commit()
    return {"message": "Camera deleted"}

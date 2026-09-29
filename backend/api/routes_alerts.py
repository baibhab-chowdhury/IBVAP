from fastapi import APIRouter
from services.websocket_manager import manager

router = APIRouter()

# In-memory alert log for demo (stores last 100 alerts)
alert_log: list[dict] = []

def record_alert(alert_data: dict):
    """Called by the pipeline to persist alerts for the history page."""
    alert_log.insert(0, alert_data)
    if len(alert_log) > 100:
        alert_log.pop()

@router.get("/")
async def get_alerts():
    return {"alerts": alert_log}

@router.get("/plates")
async def get_plate_logs():
    """Returns only ANPR plate detection alerts."""
    plates = [a for a in alert_log if a.get("type") == "ANPR_READ"]
    return {"plates": plates}

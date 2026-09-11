from fastapi import WebSocket
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_json(self, message: dict):
        """Broadcasts a JSON message to all connected React clients."""
        if not self.active_connections:
            return
            
        results = await asyncio.gather(
            *[connection.send_json(message) for connection in self.active_connections],
            return_exceptions=True
        )
        
        # Clean up dead connections
        for conn, result in zip(self.active_connections[:], results):
            if isinstance(result, Exception):
                self.disconnect(conn)

manager = ConnectionManager()

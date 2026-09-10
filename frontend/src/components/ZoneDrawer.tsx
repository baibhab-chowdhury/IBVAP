"use client";
import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

interface Point {
  x: number;
  y: number;
}

interface ZoneDrawerProps {
  width: number;
  height: number;
  onSaveZone: (points: Point[]) => void;
  bgImageUrl?: string;
}

export default function ZoneDrawer({ width, height, onSaveZone, bgImageUrl }: ZoneDrawerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lines, setLines] = useState<fabric.Line[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const c = new fabric.Canvas(canvasRef.current, {
      selection: false,
      defaultCursor: 'crosshair',
    });

    if (bgImageUrl) {
      fabric.Image.fromURL(bgImageUrl, (img) => {
        img.scaleToWidth(width);
        img.scaleToHeight(height);
        c.setBackgroundImage(img, c.renderAll.bind(c));
      });
    }

    setCanvas(c);

    return () => {
      c.dispose();
    };
  }, [width, height, bgImageUrl]);

  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (o: fabric.IEvent) => {
      if (!isDrawing) return;
      const pointer = canvas.getPointer(o.e);
      const newPoint = { x: pointer.x, y: pointer.y };
      
      setPoints((prev) => [...prev, newPoint]);

      const circle = new fabric.Circle({
        radius: 4,
        fill: 'red',
        left: newPoint.x,
        top: newPoint.y,
        originX: 'center',
        originY: 'center',
        selectable: false,
      });
      canvas.add(circle);

      if (points.length > 0) {
        const lastPoint = points[points.length - 1];
        const line = new fabric.Line([lastPoint.x, lastPoint.y, newPoint.x, newPoint.y], {
          stroke: 'red',
          strokeWidth: 2,
          selectable: false,
        });
        setLines((prev) => [...prev, line]);
        canvas.add(line);
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    return () => {
      canvas.off('mouse:down', handleMouseDown);
    };
  }, [canvas, isDrawing, points]);

  const startDrawing = () => {
    setIsDrawing(true);
    setPoints([]);
    setLines([]);
    canvas?.clear();
  };

  const finishDrawing = () => {
    if (points.length < 3) {
      alert("A zone needs at least 3 points!");
      return;
    }
    setIsDrawing(false);
    
    // Close the polygon visually
    if (canvas) {
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];
      const line = new fabric.Line([lastPoint.x, lastPoint.y, firstPoint.x, firstPoint.y], {
        stroke: 'red',
        strokeWidth: 2,
        selectable: false,
      });
      canvas.add(line);
      
      const polygon = new fabric.Polygon(points, {
        fill: 'rgba(255,0,0,0.3)',
        stroke: 'red',
        strokeWidth: 2,
        selectable: false,
      });
      canvas.add(polygon);
      canvas.renderAll();
    }
    
    onSaveZone(points);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="border-2 border-gray-300 rounded shadow-sm">
        <canvas ref={canvasRef} width={width} height={height} />
      </div>
      <div className="flex space-x-4">
        <button 
          onClick={startDrawing} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {isDrawing ? "Restart Drawing" : "Draw New Zone"}
        </button>
        {isDrawing && (
          <button 
            onClick={finishDrawing} 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Finish Zone
          </button>
        )}
      </div>
    </div>
  );
}

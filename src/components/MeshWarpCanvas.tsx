import React, { useRef, useEffect, useState } from 'react';

interface Point {
  x: number;
  y: number;
}

interface MeshWarpCanvasProps {
  image: HTMLImageElement | null;
  metrics: number[]; // 0 to 1
  size?: number;
  labels: string[];
  isCalibrating?: boolean;
  uvPoints: Point[];
  onUVPointsChange: (points: Point[]) => void;
  onMetricsChange?: (metrics: number[]) => void;
}

export const MeshWarpCanvas: React.FC<MeshWarpCanvasProps> = ({ 
  image, 
  metrics, 
  size = 600,
  labels,
  uvPoints,
  onUVPointsChange,
  onMetricsChange,
  isCalibrating = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (image) {
      if (image.complete) {
        setIsLoaded(true);
      } else {
        image.onload = () => setIsLoaded(true);
      }
    }
  }, [image]);

  const getCanvasCoords = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!image) return;
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current!;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = (canvas.width / 2) * 0.8;
    
    if (isCalibrating) {
      // CALIBRATION DRAGGING
      const scale = Math.min(canvas.width / image.width, canvas.height / image.height) * 0.9;
      const drawW = image.width * scale;
      const drawH = image.height * scale;
      const drawX = (canvas.width - drawW) / 2;
      const drawY = (canvas.height - drawH) / 2;

      let nearestIdx = -1;
      let minDist = 25; 

      uvPoints.forEach((p, i) => {
        const vx = drawX + p.x * drawW;
        const vy = drawY + p.y * drawH;
        const dist = Math.hypot(x - vx, y - vy);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = i;
        }
      });

      if (nearestIdx !== -1) {
        setDraggingIdx(nearestIdx);
        (e.target as Element).setPointerCapture(e.pointerId);
      }
    } else if (onMetricsChange) {
      // METRICS DRAGGING
      let nearestIdx = -1;
      let minDist = 25;
      const numPoints = metrics.length;
      const angleStep = (Math.PI * 2) / numPoints;

      metrics.forEach((val, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = val * maxRadius;
        const vx = centerX + Math.cos(angle) * r;
        const vy = centerY + Math.sin(angle) * r;
        const dist = Math.hypot(x - vx, y - vy);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = i;
        }
      });

      if (nearestIdx !== -1) {
        setDraggingIdx(nearestIdx);
        (e.target as Element).setPointerCapture(e.pointerId);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIdx === null || !image) return;
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current!;

    if (isCalibrating) {
      const scale = Math.min(canvas.width / image.width, canvas.height / image.height) * 0.9;
      const drawW = image.width * scale;
      const drawH = image.height * scale;
      const drawX = (canvas.width - drawW) / 2;
      const drawY = (canvas.height - drawH) / 2;

      const newPoints = [...uvPoints];
      newPoints[draggingIdx] = {
        x: Math.max(0, Math.min(1, (x - drawX) / drawW)),
        y: Math.max(0, Math.min(1, (y - drawY) / drawH))
      };
      onUVPointsChange(newPoints);
    } else if (onMetricsChange) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = (canvas.width / 2) * 0.8;
      
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.hypot(dx, dy);
      const val = Math.max(0, Math.min(1.2, dist / maxRadius)); // Allow slight "over-extension" for effect

      const newMetrics = [...metrics];
      newMetrics[draggingIdx] = val;
      onMetricsChange(newMetrics);
    }
  };

  const handlePointerUp = () => setDraggingIdx(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || !isLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = (canvas.width / 2) * 0.8;
    const numPoints = metrics.length;
    const angleStep = (Math.PI * 2) / numPoints;

    const drawingUvPoints = uvPoints.map(p => ({
      x: p.x * image.width,
      y: p.y * image.height
    }));

    const uvCenter = { 
      x: drawingUvPoints.reduce((sum, p) => sum + p.x, 0) / numPoints,
      y: drawingUvPoints.reduce((sum, p) => sum + p.y, 0) / numPoints
    };

    if (isCalibrating) {
      // CALIBRATION MODE: Show original image and the sampling frame
      const scale = Math.min(canvas.width / image.width, canvas.height / image.height) * 0.9;
      const drawW = image.width * scale;
      const drawH = image.height * scale;
      const drawX = (canvas.width - drawW) / 2;
      const drawY = (canvas.height - drawH) / 2;

      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.drawImage(image, drawX, drawY, drawW, drawH);
      
      // Draw frame outline
      ctx.beginPath();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      uvPoints.forEach((p, i) => {
        const px = drawX + p.x * drawW;
        const py = drawY + p.y * drawH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.stroke();

      // Draw handles
      uvPoints.forEach((p, i) => {
        const px = drawX + p.x * drawW;
        const py = drawY + p.y * drawH;
        ctx.fillStyle = draggingIdx === i ? '#ea580c' : 'white';
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f97316';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(labels[i], px + 12, py + 4);
      });

      // Draw instruction
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DRAG VERTICES TO ALIGN WITH FACE', centerX, drawY - 20);
      
      ctx.restore();
      return;
    }

    // Calculate radar polygon points
    const radarPoints: Point[] = metrics.map((val, i) => {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      const r = val * maxRadius;
      return {
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r
      };
    });

    // Function to draw a textured triangle
    const drawTexturedTriangle = (
      p1: Point, p2: Point, p3: Point, // Canvas points
      u1: Point, u2: Point, u3: Point  // UV points
    ) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.clip();

      const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y, x3 = p3.x, y3 = p3.y;
      const u1x = u1.x, u1y = u1.y, u2x = u2.x, u2y = u2.y, u3x = u3.x, u3y = u3.y;

      const delta = u1x * (u2y - u3y) + u2x * (u3y - u1y) + u3x * (u1y - u2y);
      if (Math.abs(delta) < 0.0001) { ctx.restore(); return; }

      const a = (x1 * (u2y - u3y) + x2 * (u3y - u1y) + x3 * (u1y - u2y)) / delta;
      const b = (x1 * (u3x - u2x) + x2 * (u1x - u3x) + x3 * (u2x - u1x)) / delta;
      const c = (x1 * (u2x * u3y - u3x * u2y) + x2 * (u3x * u1y - u1x * u3y) + x3 * (u1x * u2y - u2x * u1y)) / delta;
      const d = (y1 * (u2y - u3y) + y2 * (u3y - u1y) + y3 * (u1y - u2y)) / delta;
      const e = (y1 * (u3x - u2x) + y2 * (u1x - u3x) + y3 * (u2x - u1x)) / delta;
      const f = (y1 * (u2x * u3y - u3x * u2y) + y2 * (u3x * u1y - u1x * u3y) + y3 * (u1x * u2y - u2x * u1y)) / delta;

      ctx.transform(a, d, b, e, c, f);
      ctx.drawImage(image, 0, 0);
      ctx.restore();
    };

    // Draw triangles sharing the center
    for (let i = 0; i < numPoints; i++) {
      const next = (i + 1) % numPoints;
      drawTexturedTriangle(
        { x: centerX, y: centerY }, radarPoints[i], radarPoints[next],
        uvCenter, drawingUvPoints[i], drawingUvPoints[next]
      );
    }

    // Post-processing: High-key "Skincare" filter overlay
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw Radar UI (Labels and Circle)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 0.5;
    
    // Grid circles
    [0.2, 0.4, 0.6, 0.8, 1.0].forEach(r => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r * maxRadius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Axis lines
    if (!isCalibrating) {
      for (let i = 0; i < numPoints; i++) {
        const angle = i * angleStep - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle) * maxRadius, centerY + Math.sin(angle) * maxRadius);
        ctx.stroke();

        // Labels with POLA-style typography
        ctx.fillStyle = '#000';
        ctx.font = '500 9px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelDist = maxRadius + 35;
        const lx = centerX + Math.cos(angle) * labelDist;
        const ly = centerY + Math.sin(angle) * labelDist;
        
        // Japanese/Scientific style label rendering
        ctx.save();
        ctx.translate(lx, ly);
        ctx.fillText(labels[i].toUpperCase(), 0, -5);
        ctx.fillStyle = '#999';
        ctx.font = '400 7px "JetBrains Mono"';
        ctx.fillText(`LV. ${(metrics[i] * 10).toFixed(1)}`, 0, 5);
        ctx.restore();
      }

      // Draw the polygon outline (very subtle)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(radarPoints[0].x, radarPoints[0].y);
      for (let i = 1; i < numPoints; i++) {
        ctx.lineTo(radarPoints[i].x, radarPoints[i].y);
      }
      ctx.closePath();
      ctx.stroke();
    }

  }, [image, metrics, isLoaded, labels, uvPoints, isCalibrating]);

  return (
    <div className="relative flex items-center justify-center p-8 bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size}
        className="max-w-full h-auto cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      {!image && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">
          <p className="text-gray-400 font-medium">Upload a photo to begin</p>
        </div>
      )}
    </div>
  );
};

import React from 'react';

interface FaceDetectionOverlayProps {
  detectedFaces: Array<{
    index: number;
    bbox: [number, number, number, number];
    confidence: number;
    sharpness_laplacian?: number;
  }>;
}

export const FaceDetectionOverlay: React.FC<FaceDetectionOverlayProps> = ({ detectedFaces }) => {
  if (!detectedFaces || detectedFaces.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {detectedFaces.map((face) => {
        const [x1, y1, x2, y2] = face.bbox;
        const w = Math.max(10, x2 - x1);
        const h = Math.max(10, y2 - y1);

        return (
          <div
            key={face.index}
            className="absolute border border-cyan-400/80 bg-cyan-500/10 font-mono"
            style={{
              left: `${x1}px`,
              top: `${y1}px`,
              width: `${w}px`,
              height: `${h}px`,
            }}
          >
            <div className="absolute -top-5 left-0 px-1.5 py-0.5 bg-slate-950/90 border border-cyan-500/60 text-[10px] text-cyan-300 whitespace-nowrap rounded">
              Face #{face.index + 1} ({(face.confidence * 100).toFixed(0)}%)
            </div>
          </div>
        );
      })}
    </div>
  );
};

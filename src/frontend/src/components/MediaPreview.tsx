import React from 'react';
import { FaceDetectionOverlay } from './FaceDetectionOverlay';
import { apiService } from '../services/api';

interface MediaPreviewProps {
  storedPath?: string;
  mediaType: 'image' | 'video' | 'audio';
  faces?: Record<string, any>;
  onFrameSelect?: (frameNum: number) => void;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  storedPath,
  mediaType,
  faces
}) => {
  const mediaUrl = apiService.getMediaUrl(storedPath);

  if (!storedPath || !mediaUrl) {
    return (
      <div className="forensic-card h-64 flex items-center justify-center text-slate-500 font-mono text-xs">
        No media stream available for preview
      </div>
    );
  }

  return (
    <div className="forensic-card overflow-hidden">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="uppercase font-semibold text-slate-300">Media Inspection Viewport</span>
        <span className="text-cyan-400 uppercase font-mono">{mediaType} STREAM</span>
      </div>

      <div className="relative bg-black flex items-center justify-center min-h-[300px] max-h-[460px]">
        {mediaType === 'image' && (
          <div className="relative inline-block max-w-full">
            <img
              src={mediaUrl}
              alt="Case Media"
              className="max-h-[450px] w-auto object-contain mx-auto block"
            />
            {faces?.detected_faces && (
              <FaceDetectionOverlay detectedFaces={faces.detected_faces} />
            )}
          </div>
        )}

        {mediaType === 'video' && (
          <video
            controls
            src={mediaUrl}
            className="max-h-[450px] w-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
        )}

        {mediaType === 'audio' && (
          <div className="p-8 w-full flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-cyan-950/60 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            </div>
            <audio controls src={mediaUrl} className="w-full max-w-md">
              Your browser does not support audio playback.
            </audio>
          </div>
        )}
      </div>
    </div>
  );
};

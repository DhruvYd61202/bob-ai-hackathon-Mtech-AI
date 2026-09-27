import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle } from 'lucide-react';

interface UploadBoxProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
}

const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.mp4', '.avi', '.mov', '.mkv', '.webm', '.wav', '.mp3', '.flac', '.m4a', '.ogg'];
const MAX_MB = 500;

export const UploadBox: React.FC<UploadBoxProps> = ({ onFileSelect, isUploading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndPass = (file: File) => {
    setError(null);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setError(`Unsupported file format '${ext}'. Allowed: Images, Videos, Audio.`);
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File size exceeds maximum threshold of ${MAX_MB}MB.`);
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPass(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_EXTS.join(',')}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              validateAndPass(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-slate-800/80 rounded-full border border-slate-700 text-cyan-400">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <p className="text-base font-medium text-slate-200">
              Drag & Drop suspicious media here, or <span className="text-cyan-400 underline">browse files</span>
            </p>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Supports Images (.jpg, .png, .webp), Videos (.mp4, .mov, .mkv), Audio (.wav, .mp3, .flac) up to 500MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-950/50 border border-rose-800/50 rounded-lg text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

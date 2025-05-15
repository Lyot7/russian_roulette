import React, { useRef, useState, useCallback } from 'react';

interface CameraCaptureProps {
  onCapture: (photo: string) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError(null);
      }
    } catch (err) {
      setError('Failed to access camera. Please allow camera access and try again.');
      console.error('Error accessing camera:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const takePhoto = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to data URL (base64 encoded image)
    const photoData = canvas.toDataURL('image/jpeg');
    
    // Stop camera
    stopCamera();
    
    // Send photo data to parent component
    onCapture(photoData);
  }, [onCapture, stopCamera]);

  return (
    <div className="flex flex-col gap-4">
      {error && <div className="bg-red-100 text-red-700 p-3 rounded-md">{error}</div>}
      
      {!isStreaming ? (
        <button
          onClick={startCamera}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Start Camera
        </button>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative border-2 border-gray-300 rounded-md overflow-hidden">
            <video
              ref={videoRef}
              className="w-full"
              autoPlay
              playsInline
            />
          </div>
          
          <div className="flex gap-2 justify-center">
            <button
              onClick={takePhoto}
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Take Photo
            </button>
            <button
              onClick={stopCamera}
              className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
} 
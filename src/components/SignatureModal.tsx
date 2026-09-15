"use client";

import { useRef, useState, useEffect } from "react";
import { Pen, Upload, RotateCcw, Check, X } from "lucide-react";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  initialDataUrl?: string | null;
}

export default function SignatureModal({
  isOpen,
  onClose,
  onSave,
  initialDataUrl,
}: SignatureModalProps) {
  const [tab, setTab] = useState<"draw" | "upload">("draw");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(2.5);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialDataUrl) {
        setHasDrawn(true);
      } else {
        setHasDrawn(false);
      }

      if (tab === "draw") {
        setTimeout(() => {
          const canvas = canvasRef.current;
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.scale(dpr, dpr);
              ctx.lineCap = "round";
              ctx.lineJoin = "round";

              // Jika ada tanda tangan sebelumnya, render ke tengah canvas sebagai preview
              if (initialDataUrl) {
                const img = new Image();
                img.onload = () => {
                  const maxW = rect.width * 0.8;
                  const maxH = rect.height * 0.8;
                  const scale = Math.min(maxW / img.width, maxH / img.height, 1);
                  const drawW = img.width * scale;
                  const drawH = img.height * scale;
                  const drawX = (rect.width - drawW) / 2;
                  const drawY = (rect.height - drawH) / 2;
                  ctx.drawImage(img, drawX, drawY, drawW, drawH);
                };
                img.src = initialDataUrl;
              }
            }
          }
        }, 50);
      }
    }
  }, [isOpen, tab, initialDataUrl]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const ctx = tempCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setUploadedImage(tempCanvas.toDataURL("image/png"));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Crop empty transparent borders
  const trimCanvas = (canvas: HTMLCanvasElement): string => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas.toDataURL("image/png");

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let found = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }

    if (!found) return canvas.toDataURL("image/png");

    const padding = 10;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width, maxX + padding);
    maxY = Math.min(height, maxY + padding);

    const trimmedWidth = maxX - minX;
    const trimmedHeight = maxY - minY;

    const trimmedCanvas = document.createElement("canvas");
    trimmedCanvas.width = trimmedWidth;
    trimmedCanvas.height = trimmedHeight;
    const trimmedCtx = trimmedCanvas.getContext("2d");
    if (trimmedCtx) {
      trimmedCtx.drawImage(
        canvas,
        minX,
        minY,
        trimmedWidth,
        trimmedHeight,
        0,
        0,
        trimmedWidth,
        trimmedHeight
      );
      return trimmedCanvas.toDataURL("image/png");
    }

    return canvas.toDataURL("image/png");
  };

  const handleConfirm = () => {
    if (tab === "draw") {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      const dataUrl = trimCanvas(canvas);
      onSave(dataUrl);
      clearCanvas();
      onClose();
    } else {
      if (!uploadedImage) return;
      onSave(uploadedImage);
      setUploadedImage(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-2xl bg-rose-50 text-rose-500">
              <Pen className="w-4 h-4" />
            </span>
            <h3 className="font-semibold text-slate-800 text-sm sm:text-base">
              Create Signature
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5 mx-5 mt-4 rounded-2xl">
          <button
            type="button"
            onClick={() => setTab("draw")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              tab === "draw"
                ? "bg-white text-rose-600 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Pen className="w-3.5 h-3.5" />
            Draw Signature
          </button>
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              tab === "upload"
                ? "bg-white text-rose-600 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Image
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {tab === "draw" ? (
            <div className="space-y-3">
              <div className="relative border-2 border-dashed border-rose-200/80 rounded-2xl bg-rose-50/20 hover:bg-white transition-colors overflow-hidden">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-48 block cursor-crosshair touch-none"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Pen className="w-6 h-6 mb-1 opacity-40" />
                    Sign your name here
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Color Selector */}
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-500">Color:</span>
                    <div className="flex gap-1.5">
                      {["#000000", "#be123c", "#1e3a8a"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setPenColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                            penColor === c
                              ? "scale-110 border-rose-500 shadow-xs ring-2 ring-rose-200"
                              : "border-white hover:scale-105"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stroke Thickness / Ketebalan Slider */}
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium text-slate-500">Thickness:</span>
                    <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-2xl border border-slate-200">
                      <input
                        type="range"
                        min="1"
                        max="6"
                        step="0.5"
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                        className="w-20 sm:w-24 cursor-pointer accent-rose-500"
                        title={`Stroke Width: ${strokeWidth}px`}
                      />
                      <div className="flex items-center gap-1.5 min-w-[50px]">
                        <span
                          className="rounded-full inline-block shrink-0 transition-all"
                          style={{
                            width: `${Math.max(3, Math.min(10, strokeWidth * 2))}px`,
                            height: `${Math.max(3, Math.min(10, strokeWidth * 2))}px`,
                            backgroundColor: penColor,
                          }}
                        />
                        <span className="text-[11px] font-semibold text-slate-700">
                          {strokeWidth}px
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clear Canvas */}
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="flex items-center gap-1 text-slate-500 hover:text-rose-600 transition-colors text-xs font-medium cursor-pointer self-end sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-rose-200 hover:border-rose-400 hover:bg-rose-50/40 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploadedImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={uploadedImage}
                    alt="Preview"
                    className="max-h-40 object-contain"
                  />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-rose-500 mb-2" />
                    <span className="text-sm font-medium text-slate-700">
                      Choose signature image (PNG / JPG)
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      Transparent or light background recommended
                    </span>
                  </>
                )}
              </label>
              {uploadedImage && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setUploadedImage(null)}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    Change image
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-2xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={tab === "draw" ? !hasDrawn : !uploadedImage}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-xs transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Signature
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Pen, Upload, RotateCcw, Check, X, Move, Maximize2, Trash2 } from "lucide-react";

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
  const uploadContainerRef = useRef<HTMLDivElement | null>(null);

  // State untuk Tab Draw
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(2.5);

  // State untuk Tab Upload Image
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [imgTransform, setImgTransform] = useState<{
    x: number; // pixel offset from container top-left
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [activeDrag, setActiveDrag] = useState<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
  } | null>(null);

  const [activeResize, setActiveResize] = useState<{
    startX: number;
    startY: number;
    initWidth: number;
    initHeight: number;
    aspectRatio: number;
  } | null>(null);

  // Setup canvas saat modal terbuka pertama kali
  useEffect(() => {
    if (isOpen) {
      if (initialDataUrl) {
        setHasDrawn(true);
      } else {
        setHasDrawn(false);
      }

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
  }, [isOpen, initialDataUrl]);

  // Drag & Resize listeners for uploaded image
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!uploadContainerRef.current) return;
      const rect = uploadContainerRef.current.getBoundingClientRect();

      if (activeDrag) {
        const dx = e.clientX - activeDrag.startX;
        const dy = e.clientY - activeDrag.startY;

        setImgTransform((prev) => {
          if (!prev) return prev;
          let nx = activeDrag.initX + dx;
          let ny = activeDrag.initY + dy;
          // Batasi jangan sampai terlempar keluar kanvas terlalu jauh
          nx = Math.max(-prev.width * 0.8, Math.min(rect.width - prev.width * 0.2, nx));
          ny = Math.max(-prev.height * 0.8, Math.min(rect.height - prev.height * 0.2, ny));
          return { ...prev, x: nx, y: ny };
        });
      } else if (activeResize) {
        const dx = e.clientX - activeResize.startX;
        const newW = Math.max(30, activeResize.initWidth + dx);
        const newH = newW / (activeResize.aspectRatio || 1);

        setImgTransform((prev) => {
          if (!prev) return prev;
          return { ...prev, width: newW, height: newH };
        });
      }
    },
    [activeDrag, activeResize]
  );

  const handlePointerUp = useCallback(() => {
    setActiveDrag(null);
    setActiveResize(null);
  }, []);

  useEffect(() => {
    if (activeDrag || activeResize) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [activeDrag, activeResize, handlePointerMove, handlePointerUp]);

  if (!isOpen) return null;

  // DRAW TAB HANDLERS
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

  const clearUploadedImage = () => {
    setUploadedImageSrc(null);
    setImgTransform(null);
    setActiveDrag(null);
    setActiveResize(null);
  };

  // Reset total kedua data (signature coretan & upload gambar)
  const resetAllData = () => {
    clearCanvas();
    clearUploadedImage();
    setTab("draw");
  };

  const handleClose = () => {
    resetAllData();
    onClose();
  };

  // UPLOAD TAB HANDLERS
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setUploadedImageSrc(src);

      const img = new Image();
      img.onload = () => {
        // Hitung ukuran awal pas di tengah area kanvas
        setTimeout(() => {
          const container = uploadContainerRef.current;
          const containerW = container?.clientWidth || 450;
          const containerH = container?.clientHeight || 192;

          const maxW = containerW * 0.75;
          const maxH = containerH * 0.75;
          const scale = Math.min(maxW / img.width, maxH / img.height, 1);
          const initialW = img.width * scale;
          const initialH = img.height * scale;

          setImgTransform({
            x: (containerW - initialW) / 2,
            y: (containerH - initialH) / 2,
            width: initialW,
            height: initialH,
          });
        }, 30);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Crop empty transparent borders on canvas
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
      resetAllData();
      onClose();
    } else {
      if (!uploadedImageSrc || !imgTransform || !uploadContainerRef.current) return;

      // Render image transform onto an offscreen canvas with container dimensions
      const container = uploadContainerRef.current;
      const renderCanvas = document.createElement("canvas");
      renderCanvas.width = container.clientWidth;
      renderCanvas.height = container.clientHeight;
      const ctx = renderCanvas.getContext("2d");

      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(
            img,
            imgTransform.x,
            imgTransform.y,
            imgTransform.width,
            imgTransform.height
          );
          const finalTrimmed = trimCanvas(renderCanvas);
          onSave(finalTrimmed);
          resetAllData();
          onClose();
        };
        img.src = uploadedImageSrc;
      }
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
            onClick={handleClose}
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
        <div className="p-4 sm:p-5">
          {/* TAB 1: DRAW SIGNATURE (Tetap di DOM agar coretan tidak hilang saat pindah tab) */}
          <div className={tab === "draw" ? "space-y-3" : "hidden"}>
            <div className="relative border-2 border-dashed border-rose-200/80 rounded-2xl bg-rose-50/20 hover:bg-white transition-colors overflow-hidden h-48 sm:h-56">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full block cursor-pencil touch-none"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Pen className="w-6 h-6 mb-1 opacity-40" />
                  Sign your name here
                </div>
              )}
            </div>

            {/* Controls Tab Draw */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-between sm:justify-start">
                {/* Color Selector */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-medium text-slate-500 text-[11px] sm:text-xs">Color:</span>
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
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-medium text-slate-500 text-[11px] sm:text-xs">Thickness:</span>
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 px-2 py-1 rounded-2xl border border-slate-200">
                    <input
                      type="range"
                      min="1"
                      max="6"
                      step="0.5"
                      value={strokeWidth}
                      onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                      className="w-16 sm:w-24 cursor-pointer accent-rose-500"
                      title={`Stroke Width: ${strokeWidth}px`}
                    />
                    <div className="flex items-center gap-1 min-w-[42px] sm:min-w-[48px]">
                      <span
                        className="rounded-full inline-block shrink-0 transition-all"
                        style={{
                          width: `${Math.max(3, Math.min(8, strokeWidth * 2))}px`,
                          height: `${Math.max(3, Math.min(8, strokeWidth * 2))}px`,
                          backgroundColor: penColor,
                        }}
                      />
                      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700">
                        {strokeWidth}px
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clear Canvas Draw */}
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

          {/* TAB 2: UPLOAD IMAGE DENGAN KANVAS INTERAKTIF (GESER & UBAH UKURAN) */}
          <div className={tab === "upload" ? "space-y-3" : "hidden"}>
            {!uploadedImageSrc ? (
              /* Area Drop / Input File Saat Belum Ada Gambar */
              <label className="border-2 border-dashed border-rose-200/90 hover:border-rose-400 bg-rose-50/20 hover:bg-rose-50/40 rounded-2xl h-48 sm:h-56 flex flex-col items-center justify-center cursor-pointer transition-all p-4">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-2.5">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                  Upload Signature Image
                </span>
                <span className="text-[11px] text-slate-400 text-center max-w-xs">
                  PNG, JPG, atau WebP (Latar belakang transparan lebih disarankan)
                </span>
              </label>
            ) : (
              /* Kanvas Interaktif: Gambar bisa di-geser (drag) dan di-resize */
              <div
                ref={uploadContainerRef}
                className="relative border-2 border-dashed border-rose-200/80 rounded-2xl bg-rose-50/15 h-48 sm:h-56 overflow-hidden select-none touch-none"
              >
                {imgTransform && (
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      // Jangan drag jika mengklik handle resize
                      if ((e.target as HTMLElement).closest(".resize-handle")) return;
                      (e.target as HTMLElement).setPointerCapture(e.pointerId);
                      setActiveDrag({
                        startX: e.clientX,
                        startY: e.clientY,
                        initX: imgTransform.x,
                        initY: imgTransform.y,
                      });
                    }}
                    style={{
                      position: "absolute",
                      left: `${imgTransform.x}px`,
                      top: `${imgTransform.y}px`,
                      width: `${imgTransform.width}px`,
                      height: `${imgTransform.height}px`,
                    }}
                    className="group/img absolute cursor-move rounded-lg select-none transition-colors border border-transparent hover:border-2 hover:border-dashed hover:border-rose-400 hover:bg-rose-500/5"
                  >
                    {/* Gambar Tanda Tangan */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadedImageSrc}
                      alt="Signature Upload"
                      draggable={false}
                      className="w-full h-full object-contain pointer-events-none select-none"
                    />

                    {/* Info Badge Mini saat Hover */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[9px] px-1.5 py-0.5 rounded-full pointer-events-none transition-opacity whitespace-nowrap opacity-0 group-hover/img:opacity-100">
                      Drag to move
                    </div>

                    {/* Resize Handle (Sudut Kanan Bawah) - Muncul HANYA saat hover */}
                    <div
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        (e.target as HTMLElement).setPointerCapture(e.pointerId);
                        const ar = imgTransform.width / (imgTransform.height || 1);
                        setActiveResize({
                          startX: e.clientX,
                          startY: e.clientY,
                          initWidth: imgTransform.width,
                          initHeight: imgTransform.height,
                          aspectRatio: ar,
                        });
                      }}
                      className="resize-handle absolute -bottom-2 -right-2 w-5 h-5 bg-rose-500 border-2 border-white rounded-md cursor-nwse-resize shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform transition-opacity opacity-0 group-hover/img:opacity-100 scale-90 group-hover/img:scale-100"
                      title="Drag to resize width & height"
                    >
                      <Maximize2 className="w-2.5 h-2.5 text-white rotate-90" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Controls Tab Upload: Change Image & Clear Image */}
            {uploadedImageSrc && (
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                {/* Change Image Button */}
                <label className="flex items-center gap-1.5 text-slate-600 hover:text-rose-600 font-medium cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Upload className="w-3.5 h-3.5" />
                  <span>Change Image</span>
                </label>

                {/* Reset to Center & Scale */}
                <button
                  type="button"
                  onClick={() => {
                    if (!uploadContainerRef.current) return;
                    const containerW = uploadContainerRef.current.clientWidth;
                    const containerH = uploadContainerRef.current.clientHeight;
                    const img = new Image();
                    img.onload = () => {
                      const maxW = containerW * 0.75;
                      const maxH = containerH * 0.75;
                      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
                      const initialW = img.width * scale;
                      const initialH = img.height * scale;
                      setImgTransform({
                        x: (containerW - initialW) / 2,
                        y: (containerH - initialH) / 2,
                        width: initialW,
                        height: initialH,
                      });
                    };
                    img.src = uploadedImageSrc;
                  }}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors font-medium cursor-pointer"
                  title="Reset position and size to center"
                >
                  <Move className="w-3.5 h-3.5" />
                  <span>Reset Position</span>
                </button>

                {/* Clear Image Button */}
                <button
                  type="button"
                  onClick={clearUploadedImage}
                  className="flex items-center gap-1 text-slate-500 hover:text-rose-600 transition-colors font-medium cursor-pointer"
                  title="Remove uploaded image"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-2xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={tab === "draw" ? !hasDrawn : !uploadedImageSrc}
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


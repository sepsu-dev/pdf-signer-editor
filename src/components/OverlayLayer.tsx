"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { OverlayItem } from "@/types/editor";
import { Trash2, Pencil } from "lucide-react";

interface OverlayLayerProps {
  items: OverlayItem[];
  pageIndex: number;
  containerWidth: number;
  containerHeight: number;
  zoom: number;
  onUpdateItem: (id: string, updates: Partial<OverlayItem>) => void;
  onDeleteItem: (id: string) => void;
  onEditItem?: (item: OverlayItem) => void;
  onSelectItem?: (id: string) => void;
  selectedId: string | null;
}

export default function OverlayLayer({
  items,
  pageIndex,
  containerWidth,
  containerHeight,
  zoom,
  onUpdateItem,
  onDeleteItem,
  onEditItem,
  onSelectItem,
  selectedId,
}: OverlayLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [activeDrag, setActiveDrag] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialItemX: number;
    initialItemY: number;
  } | null>(null);

  const [activeResize, setActiveResize] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
    aspectRatio: number;
  } | null>(null);

  const pageItems = items.filter((it) => it.pageIndex === pageIndex);

  const handlePointerDownDrag = (
    e: React.PointerEvent,
    item: OverlayItem
  ) => {
    e.stopPropagation();
    onSelectItem?.(item.id);

    // Target check to ignore clicks on delete or resize handle
    if ((e.target as HTMLElement).closest(".drag-ignore")) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveDrag({
      id: item.id,
      startX: e.clientX,
      startY: e.clientY,
      initialItemX: item.x,
      initialItemY: item.y,
    });
  };

  const dragRafRef = useRef<number | null>(null);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current);
      }

      dragRafRef.current = requestAnimationFrame(() => {
        if (activeDrag && containerWidth > 0 && containerHeight > 0) {
          const deltaX = e.clientX - activeDrag.startX;
          const deltaY = e.clientY - activeDrag.startY;

          const deltaXPercent = (deltaX / containerWidth) * 100;
          const deltaYPercent = (deltaY / containerHeight) * 100;

          const item = items.find((it) => it.id === activeDrag.id);
          if (!item) return;

          let newX = activeDrag.initialItemX + deltaXPercent;
          let newY = activeDrag.initialItemY + deltaYPercent;

          // Boundary constraints
          newX = Math.max(0, Math.min(100 - item.width, newX));
          newY = Math.max(0, Math.min(100 - item.height, newY));

          onUpdateItem(activeDrag.id, { x: newX, y: newY });
        } else if (activeResize && containerWidth > 0 && containerHeight > 0) {
          const deltaX = e.clientX - activeResize.startX;
          const deltaXPercent = (deltaX / containerWidth) * 100;

          const item = items.find((it) => it.id === activeResize.id);
          if (!item) return;

          let newWidthPercent = Math.max(4, activeResize.initialWidth + deltaXPercent);
          newWidthPercent = Math.min(100 - item.x, newWidthPercent);

          // Keep aspect ratio for proportional scaling
          const pixelWidth = (newWidthPercent / 100) * containerWidth;
          const pixelHeight = pixelWidth / activeResize.aspectRatio;
          const newHeightPercent = (pixelHeight / containerHeight) * 100;

          onUpdateItem(activeResize.id, {
            width: newWidthPercent,
            height: newHeightPercent,
          });
        }
      });
    },
    [activeDrag, activeResize, containerWidth, containerHeight, items, onUpdateItem]
  );

  const handlePointerUp = useCallback(() => {
    if (dragRafRef.current) {
      cancelAnimationFrame(dragRafRef.current);
    }
    setActiveDrag(null);
    setActiveResize(null);
  }, []);

  useEffect(() => {
    if (activeDrag || activeResize) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      return () => {
        if (dragRafRef.current) {
          cancelAnimationFrame(dragRafRef.current);
        }
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [activeDrag, activeResize, handlePointerMove, handlePointerUp]);

  const handleResizePointerDown = (
    e: React.PointerEvent,
    item: OverlayItem
  ) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const pixelWidth = (item.width / 100) * containerWidth;
    const pixelHeight = (item.height / 100) * containerHeight;
    const aspectRatio = pixelWidth / (pixelHeight || 1);

    setActiveResize({
      id: item.id,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: item.width,
      initialHeight: item.height,
      aspectRatio,
    });
  };

  return (
    <div
      ref={layerRef}
      className="absolute inset-0 pointer-events-none select-none z-10"
      style={{ width: "100%", height: "100%" }}
    >
      {pageItems.map((item) => {
        const isSelected = selectedId === item.id;
        const isDraggingThis = activeDrag?.id === item.id;
        const isResizingThis = activeResize?.id === item.id;

        return (
          <div
            key={item.id}
            onPointerDown={(e) => handlePointerDownDrag(e, item)}
            style={{
              position: "absolute",
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${item.width}%`,
              height: `${item.height}%`,
              willChange: isDraggingThis || isResizingThis ? "left, top, width, height" : "auto",
            }}
            className={`pointer-events-auto cursor-move group select-none touch-none rounded-2xl ${
              isSelected
                ? "border border-dashed border-rose-500 bg-rose-500/5 shadow-xs"
                : "border border-transparent hover:border hover:border-dashed hover:border-rose-400 hover:bg-rose-500/5"
            }`}
          >
            {/* Action buttons (Top-Right): Edit & Delete - visible on hover or when selected */}
            <div
              className={`drag-ignore absolute -top-3 -right-3 flex items-center gap-1 z-30 transition-opacity transition-transform ${
                isSelected ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
              }`}
            >
              {/* Edit button */}
              {onEditItem && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditItem(item);
                  }}
                  className="w-5 h-5 rounded-full bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
                  title="Edit item"
                >
                  <Pencil className="w-2.5 h-2.5" />
                </button>
              )}

              {/* Delete button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }}
                className="w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
                title="Delete item"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Content: Signature or Text */}
            <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
              {item.type === "signature" && item.dataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.dataUrl}
                  alt="Signature"
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              )}

              {item.type === "text" && (
                <span
                  style={{
                    fontSize: `${(item.fontSize || 14) * zoom}px`,
                    color: item.color || "#000000",
                    fontWeight: item.isBold ? 700 : 400,
                  }}
                  className="whitespace-nowrap select-none font-sans px-1"
                >
                  {item.text}
                </span>
              )}
            </div>

            {/* Resize Handle (Bottom-Right) - visible on hover or when selected */}
            <div
              onPointerDown={(e) => handleResizePointerDown(e, item)}
              className={`drag-ignore absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-xs cursor-nwse-resize shadow-xs z-30 transition-opacity transition-transform ${
                isSelected ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
              }`}
              title="Drag to resize"
            />
          </div>
        );
      })}
    </div>
  );
}

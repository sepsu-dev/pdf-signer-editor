"use client";

import { useEffect, useRef, useState } from "react";
import OverlayLayer from "@/components/OverlayLayer";
import { OverlayItem } from "@/types/editor";

interface PdfPageViewProps {
  pdfDocument: any;
  pageNumber: number;
  zoom: number;
  items: OverlayItem[];
  onUpdateItem: (id: string, updates: Partial<OverlayItem>) => void;
  onDeleteItem: (id: string) => void;
  onEditItem?: (item: OverlayItem) => void;
  onSelectItem?: (id: string) => void;
  selectedId: string | null;
  activePlacementMode: "signature" | "text" | null;
  onPageClick?: (percentX: number, percentY: number, widthPercent: number, heightPercent: number) => void;
}

export default function PdfPageView({
  pdfDocument,
  pageNumber,
  zoom,
  items,
  onUpdateItem,
  onDeleteItem,
  onEditItem,
  onSelectItem,
  selectedId,
  activePlacementMode,
  onPageClick,
}: PdfPageViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      if (!pdfDocument || !canvasRef.current) return;

      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDocument.getPage(pageNumber);
        if (isCancelled) return;

        // Base scale 1.5 for sharp crisp rendering on high-DPI screens
        const baseViewport = page.getViewport({ scale: 1.5 * zoom });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = baseViewport.width;
        canvas.height = baseViewport.height;

        // Display width matches viewport scale
        const displayWidth = baseViewport.width / (1.5 / 1.0);
        const displayHeight = baseViewport.height / (1.5 / 1.0);

        setDimensions({
          width: displayWidth,
          height: displayHeight,
        });

        const renderContext = {
          canvasContext: ctx,
          viewport: baseViewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Error rendering PDF page:", err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDocument, pageNumber, zoom]);

  const ghostBoxRef = useRef<HTMLDivElement | null>(null);
  const isInsideRef = useRef(false);

  // Ukuran standar tetap (fixed size) saat zoom 1.0 (100%):
  // Signature: 160px x 70px
  // Text: 180px x 36px
  const baseBoxWidth = activePlacementMode === "text" ? 180 : 160;
  const baseBoxHeight = activePlacementMode === "text" ? 36 : 70;

  // Ukuran visual preview mengikuti zoom saat ini
  const currentBoxWidth = baseBoxWidth * zoom;
  const currentBoxHeight = baseBoxHeight * zoom;

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activePlacementMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const boundedX = Math.max(0, Math.min(rect.width - currentBoxWidth, mouseX - currentBoxWidth / 2));
    const boundedY = Math.max(0, Math.min(rect.height - currentBoxHeight, mouseY - currentBoxHeight / 2));

    if (ghostBoxRef.current) {
      if (!isInsideRef.current) {
        ghostBoxRef.current.style.display = "flex";
        isInsideRef.current = true;
      }
      ghostBoxRef.current.style.left = `${boundedX}px`;
      ghostBoxRef.current.style.top = `${boundedY}px`;
    }
  };

  const handleContainerMouseLeave = () => {
    if (ghostBoxRef.current) {
      ghostBoxRef.current.style.display = "none";
      isInsideRef.current = false;
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activePlacementMode || !onPageClick || !containerRef.current) {
      onSelectItem?.("");
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Centered placement based on current dimensions
    const clickX = Math.max(0, Math.min(rect.width - currentBoxWidth, mouseX - currentBoxWidth / 2));
    const clickY = Math.max(0, Math.min(rect.height - currentBoxHeight, mouseY - currentBoxHeight / 2));

    const percentX = (clickX / rect.width) * 100;
    const percentY = (clickY / rect.height) * 100;
    const widthPercent = (currentBoxWidth / rect.width) * 100;
    const heightPercent = (currentBoxHeight / rect.height) * 100;

    if (ghostBoxRef.current) {
      ghostBoxRef.current.style.display = "none";
      isInsideRef.current = false;
    }
    onPageClick(percentX, percentY, widthPercent, heightPercent);
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: dimensions.width ? `${dimensions.width}px` : "auto",
        height: dimensions.height ? `${dimensions.height}px` : "auto",
      }}
      className={`relative bg-white shadow-xl rounded-2xl border border-slate-200 mx-auto select-none ${
        activePlacementMode ? "cursor-none" : "cursor-default"
      }`}
      onMouseMove={handleContainerMouseMove}
      onMouseLeave={handleContainerMouseLeave}
      onClick={handleContainerClick}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
        className="rounded-2xl"
      />

      {/* Floating Ghost Box dengan ukuran tetap persis di semua tipe PDF */}
      {activePlacementMode && (
        <div
          ref={ghostBoxRef}
          style={{
            position: "absolute",
            width: `${currentBoxWidth}px`,
            height: `${currentBoxHeight}px`,
            display: "none",
            willChange: "left, top",
          }}
          className="pointer-events-none z-30 border-2 border-dashed border-rose-500 bg-rose-500/15 rounded-2xl flex items-center justify-center shadow-md select-none touch-none"
        >
          <span className="text-[10px] font-semibold text-rose-600 bg-white/90 px-1.5 py-0.5 rounded-2xl shadow-2xs border border-rose-200 pointer-events-none">
            {activePlacementMode === "signature" ? "Signature Area" : "Text Area"}
          </span>
        </div>
      )}

      {dimensions.width > 0 && dimensions.height > 0 && (
        <OverlayLayer
          items={items}
          pageIndex={pageNumber - 1}
          containerWidth={dimensions.width}
          containerHeight={dimensions.height}
          zoom={zoom}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onEditItem={onEditItem}
          onSelectItem={onSelectItem}
          selectedId={selectedId}
        />
      )}
    </div>
  );
}

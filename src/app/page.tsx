"use client";

import { useState, useRef, useEffect } from "react";
import Toolbar from "@/components/Toolbar";
import PdfPageView from "@/components/PdfPageView";
import SignatureModal from "@/components/SignatureModal";
import TextModal from "@/components/TextModal";
import { exportSignedPdf } from "@/lib/pdfLibExporter";
import { OverlayItem } from "@/types/editor";
import { Upload, FileUp, Loader2, Crosshair, X, PenTool, Type, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0); // 100%

  const [overlayItems, setOverlayItems] = useState<OverlayItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Mode pemilihan posisi: "signature" | "text" | null
  const [activePlacementMode, setActivePlacementMode] = useState<"signature" | "text" | null>(null);
  const [pendingPlacement, setPendingPlacement] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OverlayItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  // Load PDF with pdfjs-dist
  const loadPdfFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert("File size exceeds 5MB limit. Please upload a smaller PDF file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsLoadingPdf(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      setPdfBytes(bytes);
      setPdfFileName(file.name);
      setOverlayItems([]);
      setSelectedItemId(null);
      setActivePlacementMode(null);
      setPendingPlacement(null);
      setEditingItem(null);

      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

      const loadingTask = pdfjs.getDocument({ data: bytes.slice() });
      const pdf = await loadingTask.promise;
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);

      // Dynamically calculate Fit-Width zoom for mobile/tablet screens
      if (typeof window !== "undefined") {
        try {
          const firstPage = await pdf.getPage(1);
          const unscaledViewport = firstPage.getViewport({ scale: 1.0 });
          const pageWidth = unscaledViewport.width;
          const screenWidth = window.innerWidth;

          if (screenWidth < 768) {
            // Mobile (portrait / landscape): target ~90-94% of screen width
            const targetWidth = screenWidth - 24; // account for margin/padding
            const fitZoom = +(targetWidth / pageWidth).toFixed(2);
            // Clamp between 0.35 and 1.0
            setZoom(Math.max(0.35, Math.min(1.0, fitZoom)));
          } else if (screenWidth < 1024) {
            // Tablet: target ~85% of screen width or max 1.0
            const targetWidth = screenWidth - 64;
            const fitZoom = +(targetWidth / pageWidth).toFixed(2);
            setZoom(Math.max(0.5, Math.min(1.0, fitZoom)));
          } else {
            setZoom(1.0);
          }
        } catch {
          if (window.innerWidth < 640) setZoom(0.55);
          else setZoom(1.0);
        }
      }
    } catch (err) {
      console.error("Failed to load PDF:", err);
      alert("Failed to read PDF file. Please ensure the PDF is valid and not password-protected.");
    } finally {
      setIsLoadingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      loadPdfFile(file);
    } else if (file) {
      alert("Please select a valid .pdf file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // User klik tombol di Toolbar
  const handleToggleSignatureMode = () => {
    if (activePlacementMode === "signature") {
      setActivePlacementMode(null);
    } else {
      setActivePlacementMode("signature");
    }
  };

  const handleToggleTextMode = () => {
    if (activePlacementMode === "text") {
      setActivePlacementMode(null);
    } else {
      setActivePlacementMode("text");
    }
  };

  // User klik di area PDF saat mode aktif
  const handlePageClick = (percentX: number, percentY: number, widthPercent: number, heightPercent: number) => {
    if (!activePlacementMode) return;

    setPendingPlacement({
      x: percentX,
      y: percentY,
      width: widthPercent,
      height: heightPercent,
    });
    setEditingItem(null);

    if (activePlacementMode === "signature") {
      setIsSignatureModalOpen(true);
      setActivePlacementMode(null);
    } else if (activePlacementMode === "text") {
      setIsTextModalOpen(true);
      setActivePlacementMode(null);
    }
  };

  // Edit item dari hover icon pensil
  const handleEditItem = (item: OverlayItem) => {
    setEditingItem(item);
    if (item.type === "signature") {
      setIsSignatureModalOpen(true);
    } else {
      setIsTextModalOpen(true);
    }
  };

  const handleSaveSignature = (dataUrl: string) => {
    if (editingItem) {
      // Mode edit existing item
      handleUpdateItem(editingItem.id, { dataUrl });
      setEditingItem(null);
    } else {
      // Mode new placement
      const targetX = pendingPlacement ? pendingPlacement.x : 35;
      const targetY = pendingPlacement ? pendingPlacement.y : 65;
      const targetWidth = pendingPlacement ? pendingPlacement.width : 25;
      const targetHeight = pendingPlacement ? pendingPlacement.height : 10;

      const newItem: OverlayItem = {
        id: "sig-" + Date.now(),
        type: "signature",
        pageIndex: currentPage - 1,
        x: targetX,
        y: targetY,
        width: targetWidth,
        height: targetHeight,
        dataUrl,
      };
      setOverlayItems((prev) => [...prev, newItem]);
      setSelectedItemId(newItem.id);
      setPendingPlacement(null);
    }
  };

  const handleSaveText = (data: {
    text: string;
    fontSize: number;
    color: string;
    isBold: boolean;
  }) => {
    if (editingItem) {
      // Mode edit existing item
      handleUpdateItem(editingItem.id, {
        text: data.text,
        fontSize: data.fontSize,
        color: data.color,
        isBold: data.isBold,
      });
      setEditingItem(null);
    } else {
      // Mode new placement
      const targetX = pendingPlacement ? pendingPlacement.x : 35;
      const targetY = pendingPlacement ? pendingPlacement.y : 78;
      const targetWidth = pendingPlacement ? pendingPlacement.width : 25;
      const targetHeight = pendingPlacement ? pendingPlacement.height : 5;

      const newItem: OverlayItem = {
        id: "txt-" + Date.now(),
        type: "text",
        pageIndex: currentPage - 1,
        x: targetX,
        y: targetY,
        width: targetWidth,
        height: targetHeight,
        text: data.text,
        fontSize: data.fontSize,
        color: data.color,
        isBold: data.isBold,
      };
      setOverlayItems((prev) => [...prev, newItem]);
      setSelectedItemId(newItem.id);
      setPendingPlacement(null);
    }
  };

  const handleUpdateItem = (id: string, updates: Partial<OverlayItem>) => {
    setOverlayItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setOverlayItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const handleSavePdf = async () => {
    if (!pdfBytes) return;
    setIsSaving(true);
    try {
      const signedBytes = await exportSignedPdf(pdfBytes, overlayItems);
      const blob = new Blob([signedBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const baseName = pdfFileName ? pdfFileName.replace(/\.[^/.]+$/, "") : "document";
      link.download = `${baseName}.pdf`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error saving signed PDF:", err);
      alert("An error occurred while saving the PDF with pdf-lib.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPdf = () => {
    setPdfBytes(null);
    setPdfFileName(null);
    setPdfDocument(null);
    setOverlayItems([]);
    setSelectedItemId(null);
    setActivePlacementMode(null);
    setPendingPlacement(null);
    setCurrentPage(1);
    setTotalPages(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRenamePdf = (newName: string) => {
    setPdfFileName(newName);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans select-none">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Top Navbar Toolbar */}
      <Toolbar
        fileName={pdfFileName}
        currentPage={currentPage}
        totalPages={totalPages}
        zoomPercent={Math.round(zoom * 100)}
        onPageChange={(p) => setCurrentPage(p)}
        onZoomIn={() => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)))}
        onZoomOut={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))}
        onZoomReset={() => setZoom(1.0)}
        onUploadClick={() => fileInputRef.current?.click()}
        onAddSignatureClick={handleToggleSignatureMode}
        onAddTextClick={handleToggleTextMode}
        onSavePdfClick={handleSavePdf}
        onResetFile={handleResetPdf}
        onRenameFile={handleRenamePdf}
        isSaving={isSaving}
        isLoading={isLoadingPdf}
        hasFile={!!pdfDocument}
        activePlacementMode={activePlacementMode}
      />

      {/* Floating Sticky Pill Alert when placement mode is active (always visible even when scrolling) */}
      {activePlacementMode && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto w-[92%] max-w-md">
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-900/95 hover:bg-slate-900 text-white text-xs font-medium shadow-2xl backdrop-blur-md border border-slate-700/80">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white shrink-0">
                <Crosshair className="w-3 h-3 animate-spin duration-1000" />
              </span>
              <span className="text-slate-100 truncate text-[11px] sm:text-xs">
                {activePlacementMode === "signature"
                  ? "Tap anywhere on PDF to place signature"
                  : "Tap anywhere on PDF to place text"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActivePlacementMode(null)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-2xl bg-slate-800 hover:bg-rose-500 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer shrink-0"
              title="Cancel placement mode"
            >
              <X className="w-3 h-3" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main
        className="flex-1 overflow-auto p-2 sm:p-4 md:p-8 pb-24 md:pb-8 flex items-start justify-center bg-rose-50/20"
        onClick={() => {
          if (!activePlacementMode) setSelectedItemId(null);
        }}
      >
        {pdfDocument ? (
          <div className="max-w-full overflow-x-auto flex justify-center py-2 px-1">
            <PdfPageView
              pdfDocument={pdfDocument}
              pageNumber={currentPage}
              zoom={zoom}
              items={overlayItems}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onEditItem={handleEditItem}
              onSelectItem={(id) => setSelectedItemId(id)}
              selectedId={selectedItemId}
              activePlacementMode={activePlacementMode}
              onPageClick={handlePageClick}
            />
          </div>
        ) : (
          /* Empty state / drop area */
          <div className="w-full max-w-xl my-auto text-center px-2 py-6">
            <div
              onClick={() => {
                if (!isLoadingPdf) fileInputRef.current?.click();
              }}
              className="group border-2 border-dashed border-rose-200/80 hover:border-rose-400 bg-white hover:bg-rose-50/30 rounded-2xl p-6 sm:p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {isLoadingPdf ? (
                  <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-rose-500" />
                ) : (
                  <FileUp className="w-7 h-7 sm:w-8 sm:h-8" />
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-1.5 sm:mb-2">
                {isLoadingPdf ? "Loading PDF Document..." : "Upload PDF Document"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-4">
                {isLoadingPdf
                  ? "Please wait while your PDF document is being processed..."
                  : "Click below or drop your PDF file here to easily add your signature and custom text."}
              </p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-[11px] font-medium mb-5">
                <span>Maximum file size:</span>
                <span className="font-semibold text-rose-900">5 MB</span>
              </div>

              <button
                type="button"
                disabled={isLoadingPdf}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-500 group-hover:bg-rose-600 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoadingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{isLoadingPdf ? "Processing..." : "Choose PDF File"}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Floating Action Bar (Visible only on screens < md and when a PDF is open) */}
      {pdfDocument && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 md:hidden w-[95%] max-w-sm">
          <div className="flex items-center justify-between gap-1 p-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl">
            {/* Page Nav */}
            <div className="flex items-center bg-slate-100/90 rounded-2xl p-0.5 border border-slate-200">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-2xl text-slate-600 hover:text-slate-900 active:bg-white disabled:opacity-25 transition-all cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-1.5 text-[11px] font-bold text-slate-700 select-none">
                {currentPage}/{totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-2xl text-slate-600 hover:text-slate-900 active:bg-white disabled:opacity-25 transition-all cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Zoom In / Out */}
            <div className="flex items-center bg-slate-100/90 rounded-2xl p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)))}
                className="p-1.5 rounded-2xl text-slate-600 hover:text-slate-900 active:bg-white transition-all cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 text-[11px] font-semibold text-slate-700 min-w-[34px] text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.0, +(z + 0.15).toFixed(2)))}
                className="p-1.5 rounded-2xl text-slate-600 hover:text-slate-900 active:bg-white transition-all cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Signature button */}
            <button
              type="button"
              onClick={handleToggleSignatureMode}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                activePlacementMode === "signature"
                  ? "bg-rose-500 text-white"
                  : "bg-slate-100 text-slate-700 border border-slate-200 active:bg-slate-200 hover:text-rose-600"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Signature</span>
            </button>

            {/* Text button */}
            <button
              type="button"
              onClick={handleToggleTextMode}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                activePlacementMode === "text"
                  ? "bg-rose-500 text-white"
                  : "bg-slate-100 text-slate-700 border border-slate-200 active:bg-slate-200"
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Text</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => {
          setIsSignatureModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveSignature}
        initialDataUrl={editingItem?.type === "signature" ? editingItem.dataUrl : null}
      />

      <TextModal
        isOpen={isTextModalOpen}
        onClose={() => {
          setIsTextModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveText}
        initialText={editingItem?.type === "text" ? editingItem.text : ""}
        initialFontSize={editingItem?.type === "text" ? editingItem.fontSize : 14}
        initialColor={editingItem?.type === "text" ? editingItem.color : "#000000"}
        initialIsBold={editingItem?.type === "text" ? editingItem.isBold : false}
      />
    </div>
  );
}
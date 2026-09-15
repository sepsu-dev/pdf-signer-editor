"use client";

import React, { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  PenTool,
  Type,
  Download,
  FileUp,
  Loader2,
  X,
} from "lucide-react";

interface ToolbarProps {
  fileName: string | null;
  currentPage: number;
  totalPages: number;
  zoomPercent: number;
  onPageChange: (newPage: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onUploadClick: () => void;
  onAddSignatureClick: () => void;
  onAddTextClick: () => void;
  onSavePdfClick: () => void;
  onResetFile?: () => void;
  onRenameFile?: (newName: string) => void;
  isSaving: boolean;
  isLoading?: boolean;
  hasFile: boolean;
  activePlacementMode: "signature" | "text" | null;
}

export default function Toolbar({
  fileName,
  currentPage,
  totalPages,
  zoomPercent,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onUploadClick,
  onAddSignatureClick,
  onAddTextClick,
  onSavePdfClick,
  onResetFile,
  onRenameFile,
  isSaving,
  isLoading = false,
  hasFile,
  activePlacementMode,
}: ToolbarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const startEditing = () => {
    if (!fileName) return;
    // Hapus ekstensi .pdf agar user hanya mengedit nama dasarnya
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    setTempName(nameWithoutExt);
    setIsEditingName(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const handleFinishRename = () => {
    setIsEditingName(false);
    const trimmed = tempName.trim();
    if (trimmed) {
      const baseName = trimmed.replace(/\.pdf$/i, "").trim();
      const finalName = baseName ? `${baseName}.pdf` : (fileName ?? "");
      if (finalName && finalName !== fileName) {
        onRenameFile?.(finalName);
      }
    }
  };

  const handleKeyDownRename = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleFinishRename();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-3 sm:px-4 py-2">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Left: Web Title / Branding & File Info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Web Brand / Title */}
          <div className="flex items-center gap-2 select-none shrink-0">
            <div className="w-7 h-7 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-xs">
              <FileUp className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-800 hidden xs:inline-block sm:inline-block">
              PDF <span className="text-rose-500">Signer</span>
            </span>
          </div>

          {/* File Name Chip with Rename & Close */}
          {fileName && (
            <div className="group/file flex items-center gap-1.5 pl-2 sm:pl-2.5 pr-1.5 py-1 rounded-2xl bg-rose-50/80 hover:bg-rose-100/70 border border-rose-200/80 text-rose-950 text-xs transition-colors max-w-[130px] xs:max-w-[170px] sm:max-w-[240px] md:max-w-[320px]">
              <FileUp className="w-3.5 h-3.5 text-rose-500 shrink-0" />

              {isEditingName ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleFinishRename}
                  onKeyDown={handleKeyDownRename}
                  className="bg-white px-2 py-0.5 rounded-2xl text-xs text-slate-800 border border-rose-400 focus:outline-none w-full"
                />
              ) : (
                <span
                  onDoubleClick={startEditing}
                  className="truncate font-medium cursor-pointer select-none"
                  title="Double click to rename"
                >
                  {fileName}
                </span>
              )}

              {/* Reset / Close Button */}
              {onResetFile && !isEditingName && (
                <button
                  type="button"
                  onClick={onResetFile}
                  className="p-0.5 rounded-2xl text-rose-400 hover:text-rose-700 hover:bg-rose-200/60 transition-colors cursor-pointer shrink-0 ml-0.5"
                  title="Reset / Close PDF"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center: Pagination & Zoom (Visible on Tablet and Desktop: md and up) */}
        {hasFile && (
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {/* Page Navigation */}
            <div className="flex items-center bg-slate-100/90 rounded-2xl p-0.5 border border-slate-200">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="p-1.5 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-xs font-semibold text-slate-700 select-none">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="p-1.5 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-100/90 rounded-2xl p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={onZoomOut}
                className="p-1.5 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-xs font-semibold text-slate-700 min-w-[44px] text-center select-none">
                {zoomPercent}%
              </span>
              <button
                type="button"
                onClick={onZoomIn}
                className="p-1.5 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onZoomReset}
                className="p-1.5 rounded-2xl text-slate-400 hover:text-slate-800 hover:bg-white transition-all cursor-pointer"
                title="Reset Zoom (100%)"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Desktop/Tablet Signature & Text button (Hidden on mobile < md, moved to bottom bar) */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              disabled={!hasFile}
              onClick={onAddSignatureClick}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer ${
                activePlacementMode === "signature"
                  ? "bg-rose-500 border-rose-500 text-white shadow-xs"
                  : "bg-white hover:bg-rose-50/50 border-slate-300 text-slate-700 hover:border-rose-300 hover:text-rose-600"
              }`}
              title={
                activePlacementMode === "signature"
                  ? "Click on PDF to place signature"
                  : "Add Signature"
              }
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Signature</span>
            </button>

            <button
              type="button"
              disabled={!hasFile}
              onClick={onAddTextClick}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer ${
                activePlacementMode === "text"
                  ? "bg-rose-500 border-rose-500 text-white shadow-xs"
                  : "bg-white hover:bg-rose-50/50 border-slate-300 text-slate-700 hover:border-rose-300 hover:text-rose-600"
              }`}
              title={
                activePlacementMode === "text"
                  ? "Click on PDF to place text"
                  : "Add Text / Name"
              }
            >
              <Type className="w-3.5 h-3.5" />
              <span>Text</span>
            </button>
          </div>

          {/* Compact Page Indicator on mobile (< md) */}
          {hasFile && (
            <div className="flex md:hidden items-center bg-slate-100 rounded-2xl px-2 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200">
              <span>{currentPage}/{totalPages}</span>
            </div>
          )}

          {/* Save PDF button always visible */}
          <button
            type="button"
            disabled={!hasFile || isSaving}
            onClick={onSavePdfClick}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Save & Download PDF"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span className="hidden xs:inline">Save</span>
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
}

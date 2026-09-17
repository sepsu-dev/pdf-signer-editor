"use client";

import { useState, useEffect } from "react";
import { Type, Check, X } from "lucide-react";

interface TextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    text: string;
    fontSize: number;
    color: string;
    isBold: boolean;
    fontFamily: "Helvetica" | "TimesRoman" | "Courier";
  }) => void;
  initialText?: string;
  initialFontSize?: number;
  initialColor?: string;
  initialIsBold?: boolean;
  initialFontFamily?: "Helvetica" | "TimesRoman" | "Courier";
}

export default function TextModal({
  isOpen,
  onClose,
  onSave,
  initialText = "",
  initialFontSize = 14,
  initialColor = "#000000",
  initialIsBold = false,
  initialFontFamily = "Helvetica",
}: TextModalProps) {
  const [text, setText] = useState(initialText);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [color, setColor] = useState(initialColor);
  const [isBold, setIsBold] = useState(initialIsBold);
  const [fontFamily, setFontFamily] = useState<"Helvetica" | "TimesRoman" | "Courier">(initialFontFamily);

  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      setFontSize(initialFontSize || 14);
      setColor(initialColor || "#000000");
      setIsBold(!!initialIsBold);
      setFontFamily(initialFontFamily || "Helvetica");
    }
  }, [isOpen, initialText, initialFontSize, initialColor, initialIsBold, initialFontFamily]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSave({ text: text.trim(), fontSize, color, isBold, fontFamily });
    onClose();
  };

  const getCssFontFamily = (f: "Helvetica" | "TimesRoman" | "Courier") => {
    switch (f) {
      case "TimesRoman":
        return "Times New Roman, Times, serif";
      case "Courier":
        return "Courier New, Courier, monospace";
      case "Helvetica":
      default:
        return "var(--font-plus-jakarta, Helvetica, Arial, sans-serif)";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-2xl bg-rose-50 text-rose-500">
              <Type className="w-4 h-4" />
            </span>
            <h3 className="font-semibold text-slate-800 text-sm sm:text-base">
              Add Text / Name
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 sm:space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Text / Name / Title
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. John Doe / Technical Manager"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 text-sm text-slate-800 transition-all"
            />
          </div>

          {/* Font Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Font Family
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "Helvetica", label: "Sans (Modern)", style: "Helvetica, Arial, sans-serif" },
                { key: "TimesRoman", label: "Serif (Formal)", style: "Times New Roman, serif" },
                { key: "Courier", label: "Mono (Courier)", style: "Courier New, monospace" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFontFamily(item.key as any)}
                  className={`py-2 px-2.5 rounded-2xl border text-xs font-medium transition-all text-center cursor-pointer ${
                    fontFamily === item.key
                      ? "bg-rose-50 border-rose-400 text-rose-700 shadow-2xs font-semibold"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50/70"
                  }`}
                  style={{ fontFamily: item.style }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Font Size Slider */}
            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Font Size
                </label>
                <span className="text-xs font-bold text-rose-600 bg-white px-2 py-0.5 rounded-2xl border border-slate-200 shadow-2xs">
                  {fontSize}px
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>10px</span>
                <span>24px</span>
                <span>40px</span>
              </div>
            </div>

            {/* Font Weight Slider */}
            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Font Weight
                </label>
                <span className={`text-xs px-2 py-0.5 rounded-2xl border shadow-2xs transition-all ${
                  isBold
                    ? "font-bold text-rose-600 bg-rose-50 border-rose-200"
                    : "font-normal text-slate-600 bg-white border-slate-200"
                }`}>
                  {isBold ? "Bold" : "Regular"}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="1"
                value={isBold ? 1 : 0}
                onChange={(e) => setIsBold(Number(e.target.value) === 1)}
                className="w-full cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span className={!isBold ? "font-semibold text-slate-700" : ""}>Regular</span>
                <span className={isBold ? "font-bold text-rose-600" : ""}>Bold</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Text Color
            </label>
            <div className="flex gap-2">
              {[
                { name: "Black", value: "#000000" },
                { name: "Soft Red", value: "#e11d48" },
                { name: "Navy", value: "#1e3a8a" },
                { name: "Gray", value: "#475569" },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  style={{ backgroundColor: c.value }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                    color === c.value
                      ? "scale-110 border-rose-500 ring-2 ring-rose-200"
                      : "border-white hover:scale-105"
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              Preview:
            </span>
            <div className="p-3 bg-rose-50/20 rounded-2xl border border-rose-100 min-h-[44px] flex items-center justify-center">
              <span
                style={{
                  fontSize: `${fontSize}px`,
                  color,
                  fontWeight: isBold ? 700 : 400,
                  fontFamily: getCssFontFamily(fontFamily),
                }}
              >
                {text || "Sample Text"}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-2xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Apply Text
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


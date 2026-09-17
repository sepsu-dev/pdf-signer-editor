export interface OverlayItem {
  id: string;
  type: "signature" | "text";
  pageIndex: number;
  x: number; // percentage (0 to 100) relative to page width
  y: number; // percentage (0 to 100) relative to page height
  width: number; // percentage relative to page width
  height: number; // percentage relative to page height
  // For signature:
  dataUrl?: string;
  // For text:
  text?: string;
  fontSize?: number; // visual font size at base 100% scale
  color?: string;
  isBold?: boolean;
  fontFamily?: "Helvetica" | "TimesRoman" | "Courier";
}

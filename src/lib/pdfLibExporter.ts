import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { OverlayItem } from "@/types/editor";

function hexToRgbColor(hex: string) {
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

export async function exportSignedPdf(
  originalPdfBytes: Uint8Array,
  items: OverlayItem[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const pages = pdfDoc.getPages();
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);
  const fontCourierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

  for (const item of items) {
    if (item.pageIndex < 0 || item.pageIndex >= pages.length) continue;

    const page = pages[item.pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const cropBox = page.getCropBox();
    const originX = cropBox?.x ?? 0;
    const originY = cropBox?.y ?? 0;

    // In web preview (PdfPageView rendered with pdf.js):
    // x % is from left: (item.x / 100) * pageWidth
    // y % is from top: (item.y / 100) * pageHeight
    // In pdf-lib coordinates:
    // (0, 0) is at BOTTOM-LEFT
    // So pdfY = pageHeight - (item.y / 100 * pageHeight) - itemHeightInPdf
    const itemWidthInPdf = (item.width / 100) * pageWidth;
    const itemHeightInPdf = (item.height / 100) * pageHeight;
    const itemXInPdf = originX + (item.x / 100) * pageWidth;
    const itemYInPdf = originY + pageHeight - (item.y / 100) * pageHeight - itemHeightInPdf;

    if (item.type === "signature" && item.dataUrl) {
      try {
        const isPng = item.dataUrl.startsWith("data:image/png");
        const imageBytes = Uint8Array.from(
          atob(item.dataUrl.split(",")[1]),
          (c) => c.charCodeAt(0)
        );

        const embeddedImage = isPng
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);

        // Mimic CSS "object-fit: contain" centered inside the bounding box
        const imgAspect = embeddedImage.width / (embeddedImage.height || 1);
        const boxAspect = itemWidthInPdf / (itemHeightInPdf || 1);

        let drawWidth = itemWidthInPdf;
        let drawHeight = itemHeightInPdf;
        let offsetX = 0;
        let offsetY = 0;

        if (imgAspect > boxAspect) {
          // Image is wider than box: constrained by width
          drawWidth = itemWidthInPdf;
          drawHeight = itemWidthInPdf / imgAspect;
          offsetY = (itemHeightInPdf - drawHeight) / 2;
        } else {
          // Image is taller than box: constrained by height
          drawHeight = itemHeightInPdf;
          drawWidth = itemHeightInPdf * imgAspect;
          offsetX = (itemWidthInPdf - drawWidth) / 2;
        }

        page.drawImage(embeddedImage, {
          x: itemXInPdf + offsetX,
          y: itemYInPdf + offsetY,
          width: drawWidth,
          height: drawHeight,
        });
      } catch (err) {
        console.error("Error embedding signature image into PDF:", err);
      }
    } else if (item.type === "text" && item.text) {
      try {
        let font = item.isBold ? fontHelveticaBold : fontHelvetica;
        if (item.fontFamily === "TimesRoman") {
          font = item.isBold ? fontTimesBold : fontTimes;
        } else if (item.fontFamily === "Courier") {
          font = item.isBold ? fontCourierBold : fontCourier;
        }

        const color = item.color ? hexToRgbColor(item.color) : rgb(0, 0, 0);

        // In web preview, 1 CSS pixel at 100% zoom corresponds 1:1 to 1 PDF point (72 DPI).
        // Using an arbitrary baseDocWidth (800) caused font shrinking on A4 (595pt) and horizontal/vertical misalignment.
        const fontSize = Math.max(6, item.fontSize || 14);

        // In web preview: flex items-center justify-center
        // We measure text width to center it horizontally inside the box
        const textWidth = font.widthOfTextAtSize(item.text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        // Center horizontally inside itemWidthInPdf (matching flex items-center justify-center)
        const textX = itemXInPdf + Math.max(0, (itemWidthInPdf - textWidth) / 2);
        // Center vertically inside itemHeightInPdf (pdf-lib y is baseline; add font baseline offset)
        const textY = itemYInPdf + (itemHeightInPdf - textHeight) / 2 + (textHeight * 0.2);

        page.drawText(item.text, {
          x: textX,
          y: textY,
          size: fontSize,
          font,
          color,
        });
      } catch (err) {
        console.error("Error embedding text into PDF:", err);
      }
    }
  }

  return await pdfDoc.save();
}

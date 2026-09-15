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
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

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
        const font = item.isBold ? fontBold : fontRegular;
        const color = item.color ? hexToRgbColor(item.color) : rgb(0, 0, 0);

        // Calculate proportional font size according to original page width
        // Base preview width is ~800px standard viewport width
        const baseDocWidth = 800;
        const scaleFactor = pageWidth / baseDocWidth;
        const fontSize = Math.max(8, (item.fontSize || 14) * scaleFactor);

        // In web preview: flex items-center justify-center
        // We measure text width to center it horizontally inside the box
        const textWidth = font.widthOfTextAtSize(item.text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        // Center horizontally inside itemWidthInPdf
        const textX = itemXInPdf + Math.max(0, (itemWidthInPdf - textWidth) / 2);
        // Center vertically inside itemHeightInPdf (pdf-lib y is text baseline)
        const textY = itemYInPdf + (itemHeightInPdf - textHeight) / 2 + (textHeight * 0.15);

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

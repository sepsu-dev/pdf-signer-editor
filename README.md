# PDF Signer Editor 📄✍️

**PDF Signer Editor** is a modern, fast, and secure web application to sign PDF documents and add custom text annotations directly inside your browser without uploading files to external servers (100% Client-Side Privacy).

---

## ✨ Key Features

- ✍️ **Digital Signature (Draw & Upload)**:
  - **Draw**: Create signatures directly on an interactive canvas with a custom pencil cursor, customizable stroke thickness slider, and color palette.
  - **Upload**: Upload signature images (PNG, JPG, WebP) with transparent backgrounds, interactive drag & proportional resize directly on the canvas, position reset, and quick clear.
- 📝 **Custom Text & Annotations**:
  - Add names, titles, dates, or notes anywhere on the document.
  - Choose between popular font families: **Sans-Serif (Modern / Helvetica)**, **Serif (Formal / Times New Roman)**, and **Monospace (Courier)**.
  - Configure font size, weight (Regular / Bold), and text color with real-time preview.
- 🎯 **Fixed Area Ghost Indicator**: Clean hover box preview when selecting signature and text placement positions on the PDF page.
- 🔄 **Drag & Proportional Resize**: Reposition and scale signatures or text overlays freely with maintained aspect ratios.
- 🔍 **Zoom & Multi-Page Navigation**: Smooth zoom in/out, automatic fit-width calculation on mobile & tablet devices, and instant page switching.
- ✏️ **Document Renaming**: Double-click the file chip in the toolbar to rename the output PDF before exporting.
- 🔒 **100% Private & Secure**: Documents are processed entirely on the client side using WebAssembly and HTML5 Canvas (`pdfjs-dist` & `pdf-lib`). Files are never uploaded to any remote server.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **PDF Rendering & Editing**:
  - [`pdfjs-dist`](https://mozilla.github.io/pdf.js/) — High-fidelity browser canvas PDF rendering
  - [`pdf-lib`](https://pdf-lib.js.org/) — Client-side PDF manipulation, embedding vector fonts & signatures
- **Icons**: [Lucide React](https://lucide.dev/)
- **Typography**: Plus Jakarta Sans

---

## 📂 Project Structure

```text
pdf-signer-editor/
├── public/                     # Static assets
│   ├── favicon.svg             # Favicon SVG
│   ├── pencil-cursor.svg       # Custom pencil cursor asset
│   ├── robots.txt              # SEO crawler config
│   └── sitemap.xml             # Sitemap file
├── src/
│   ├── app/
│   │   ├── globals.css         # Tailwind 4 theme & custom utilities
│   │   ├── layout.tsx          # Root layout, metadata & JSON-LD schema
│   │   ├── opengraph-image.tsx # Dynamic OpenGraph social preview card
│   │   └── page.tsx            # Main editor workspace & state orchestration
│   ├── components/
│   │   ├── OverlayLayer.tsx    # Drag, resize, delete, and edit overlay elements
│   │   ├── PdfPageView.tsx     # PDF page canvas renderer & placement click handler
│   │   ├── SignatureModal.tsx  # Signature modal with Draw & interactive Upload tabs
│   │   ├── TextModal.tsx       # Text modal with font family, size & color controls
│   │   └── Toolbar.tsx         # Top navigation toolbar with controls & file rename
│   ├── lib/
│   │   └── pdfLibExporter.ts   # Core exporter combining original PDF with overlays
│   └── types/
│       └── editor.ts           # TypeScript type definitions for overlay items
├── Dockerfile                  # Production multi-stage Docker build (Bun)
├── package.json                # Project dependencies & scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 20+ or [Bun](https://bun.sh/) 1.0+

### Installation & Development Server

```bash
# Using Bun (Recommended)
bun install
bun dev

# Or using NPM
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Production Build

```bash
# Build standalone bundle with Bun
bun run build
bun run start

# Or using NPM
npm run build
npm run start
```

### Running with Docker

```bash
docker build -t pdf-signer-editor .
docker run -p 3000:3000 pdf-signer-editor
```

---

## 📄 License

Created for private, fast, and effortless digital document signing and annotation.
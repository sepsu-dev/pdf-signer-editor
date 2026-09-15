import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "@/app/globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: {
    default: "PDF Signer Editor — Free Online Document Signing & Text Annotation",
    template: "%s | PDF Signer Editor",
  },
  description:
    "Easily sign PDF documents and add custom text directly in your browser. Fast, secure, and client-side with no file uploads to external servers.",
  keywords: [
    "PDF Signer Editor",
    "PDF Signer",
    "Sign PDF Online",
    "PDF Editor",
    "Digital Signature",
    "Add Signature to PDF",
    "Fill and Sign PDF",
    "Online PDF Annotator",
    "Free PDF Signer Editor",
  ],
  applicationName: "PDF Signer Editor",
  authors: [{ name: "PDF Signer Editor Team" }],
  creator: "PDF Signer Editor",
  publisher: "PDF Signer Editor",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "PDF Signer & Editor",
    title: "PDF Signer & Editor — Free Online Document Signing",
    description:
      "Easily sign PDF documents and add custom text directly in your browser. Private, secure, and lightning-fast.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Signer & Editor — Free Online Document Signing",
    description:
      "Easily sign PDF documents and add custom text directly in your browser. Private, secure, and lightning-fast.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className="antialiased font-sans min-h-screen bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "PDF Signer Editor",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web Browser",
              description:
                "Fast, client-side browser application to sign PDF files and add custom text overlays without uploading documents to external servers.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
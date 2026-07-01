import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "JOBWALL - Работа, пракса и далечински работи",
  description: "Најнови огласи за работа во Македонија. IT, маркетинг, продажба, далечински работи и пракса.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="mk"
      className="dark h-full antialiased"
      suppressHydrationWarning
    >
      <body 
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <div className="max-w-[1200px] w-full mx-auto bg-background min-h-screen flex flex-col shadow-2xl border-x border-border/50">
          <Navbar />
          <main className="flex-1 w-full py-6 px-4 md:px-8 flex flex-col">
            <div className="flex-1">{children}</div>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

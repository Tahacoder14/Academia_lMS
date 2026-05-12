"use client";
import { Nunito_Sans } from "next/font/google"; // High-clarity Education Font
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import ErrorBoundary from "@/components/ErrorBoundary";

const nunito = Nunito_Sans({
  subsets:["latin"],
  weight:["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-nunito",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${nunito.variable} font-sans antialiased bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-light`}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <ToastProvider>
              <div className="min-h-screen uppercase-tracking-widest">
                {children}
              </div>
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
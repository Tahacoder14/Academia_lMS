"use client";
import { Nunito_Sans } from "next/font/google"; // High-clarity Education Font
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import ErrorBoundary from "@/components/ErrorBoundary";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight:["300", "400", "500", "600", "700"], // Removed redundant weights for faster loading
  variable: "--font-nunito",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#f8fafc" />
        <meta name="description" content="A modern, responsive school management dashboard." />
      </head>
      
      {/* 
        Cleaned body classes:
        - min-h-screen: Ensures footer stays at bottom if content is short
        - antialiased: Makes fonts look sharper on all screens
        - text-rendering: Improves legibility
      */}
      <body className={`${nunito.variable} font-sans antialiased text-slate-900 dark:text-slate-50 bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col`}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ToastProvider>
              <main className="flex-1 w-full">
                {children}
              </main>
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
"use client";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import ErrorBoundary from "@/components/ErrorBoundary";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export default function DashboardLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="description" content="Modern School Management System - Academic, Attendance, Finance & More" />
      </head>
      <body 
        className={`${nunito.variable} font-sans antialiased 
                    bg-slate-50 dark:bg-slate-950 
                    text-slate-900 dark:text-slate-100
                    min-h-screen overflow-x-hidden`}
      >
        <ErrorBoundary>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="light" 
            enableSystem 
            storageKey="academia-theme"
          >
            <ToastProvider>
              <div className="flex min-h-screen flex-col">
                {/* Main Dashboard Container */}
                <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-all duration-300">
                  {children}
                </main>
              </div>
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="description" content="A modern, responsive school management dashboard with worksheets, fee challans, attendance, and academic oversight." />
      </head>
      <body className={`${nunito.variable} font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-light m-0 p-0 overflow-x-hidden`}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
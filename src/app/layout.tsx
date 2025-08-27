import type { Metadata } from "next"
import localFont from "next/font/local"
import { SessionProvider } from "./providers/session-provider"
import { QueryProvider } from "./providers/query-provider"
import { ToastProvider } from "./providers/toast-provider"
import "./globals.css"

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
})

export const metadata: Metadata = {
  title: "TOCS - API Documentation",
  description: "API Documentation Management Platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className={pretendard.className}>
        <SessionProvider>
          <QueryProvider>
            {children}
            <ToastProvider />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
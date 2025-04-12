import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Unbounded } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-unbounded",
})

export const metadata: Metadata = {
  title: "Delciak",
  description: "A personal bio page with Discord integration",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${unbounded.variable} font-unbounded`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

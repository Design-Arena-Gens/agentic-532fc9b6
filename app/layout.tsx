import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Appointment Agent',
  description: 'Schedule appointments with our AI-powered booking assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Restaurant Menu',
  description: 'View our restaurant menu',
}

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

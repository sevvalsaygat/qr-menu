import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';

export const metadata: Metadata = {
  title: 'QR Menu - Contactless Restaurant Ordering',
  description: 'Transform your restaurant with contactless QR code ordering. Manage menus, process orders, and enhance customer experience.',
  keywords: 'QR menu, contactless ordering, restaurant management, digital menu, order management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
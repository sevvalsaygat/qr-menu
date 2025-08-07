import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QR Menu - Authentication',
  description: 'Sign in to your QR Menu dashboard or create a new account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">QR Menu</h1>
          <p className="mt-2 text-sm text-gray-600">
            Contactless restaurant ordering made simple
          </p>
        </div>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
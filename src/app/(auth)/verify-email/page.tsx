'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { resendEmailVerification, logOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, RefreshCw, CheckCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/signin');
        return;
      }

      if (user.emailVerified) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, loading, router]);

  const handleResendVerification = async () => {
    if (!user) return;

    setIsResending(true);
    setError('');
    setResendSuccess(false);

    try {
      await resendEmailVerification(user);
      setResendSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleRefreshStatus = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <Card className="w-full border-0 shadow-none">
        <CardContent className="pt-6">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-2 text-sm text-gray-600">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification email to{' '}
          <span className="font-medium text-gray-900">{user?.email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 text-center">
          <p>
            Check your inbox and click the verification link to activate your account. 
            The link will expire in 24 hours.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {resendSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Verification email sent successfully!
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleResendVerification}
            variant="outline"
            className="w-full"
            disabled={isResending}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Resend verification email
              </>
            )}
          </Button>

          <Button
            onClick={handleRefreshStatus}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
                          I&apos;ve verified my email
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          <p>
            Not receiving emails? Check your spam folder or try a different email address.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-gray-600">
          Wrong email address?{' '}
          <button
            onClick={handleSignOut}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign out and try again
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}
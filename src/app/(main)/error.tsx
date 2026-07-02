'use client';

/**
 * Route-level error boundary for the (main) group.
 *
 * Task 14.7 — add an error boundary for unexpected crashes. Per Next.js App
 * Router conventions, error.tsx receives `error` and `reset()` and must be a
 * client component.
 *
 * The fallback is intentionally simple: Indonesian text, plain language,
 * one CTA to retry. Anything fancier (Sentry reporting, dedicated empty
 * states) needs an explicit decision, not a default.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MainErrorBoundary({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Surface to the browser console so on-call devs can correlate with
    // server logs. We deliberately avoid third-party reporting here — that
    // is a separate decision and out of scope for this error boundary.
    // eslint-disable-next-line no-console
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full" role="alert">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Terjadi gangguan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Maaf, sistem kami mengalami masalah saat memuat halaman ini.
            Coba lagi, atau kembali ke beranda.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">
              Kode: {error.digest}
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={reset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              Ke Beranda
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

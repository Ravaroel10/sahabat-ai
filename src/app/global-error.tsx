'use client';

/**
 * Root-level error boundary. Catches errors that escape the (main) route
 * group's error.tsx — i.e. errors in the root layout itself.
 *
 * Task 14.7 (last-line defense).
 *
 * Required to render <html><body> because it replaces the root layout
 * in the error path.
 */

import { Button } from '@/components/ui/button';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-background text-foreground antialiased flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4" role="alert">
          <h1 className="text-2xl font-bold">Terjadi gangguan pada sistem</h1>
          <p className="text-muted-foreground">
            Mohon maaf, layanan tidak dapat dimuat saat ini. Silakan coba lagi.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">Kode: {error.digest}</p>
          )}
          <Button onClick={reset}>Coba Lagi</Button>
        </div>
      </body>
    </html>
  );
}

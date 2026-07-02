'use client';

/**
 * Scanner Page Redirect
 * 
 * The scanner functionality has been merged into the unified marketplace.
 * This page redirects users to /marketplace with filters expanded.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function ScannerRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Log the redirect for analytics
    console.log('[DEPRECATED] /scanner route accessed - redirecting to /marketplace');
    
    // Redirect to marketplace with filters parameter
    router.replace('/marketplace?filters=expanded');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <div>
            <h2 className="text-xl font-semibold mb-2">
              Mengalihkan ke Marketplace
            </h2>
            <p className="text-muted-foreground text-sm">
              Fitur scanner telah digabung ke dalam Marketplace Program Bantuan Sosial.
              Anda akan dialihkan secara otomatis...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

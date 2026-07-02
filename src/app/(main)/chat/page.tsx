import { UnifiedChatInterface } from "@/components/unified-chat";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";
import Link from "next/link";

// Force dynamic rendering for this page due to useSearchParams usage
export const dynamic = 'force-dynamic';

export default function NavigatorPage() {
  return (
    <div className="container mx-auto px-4 flex flex-col gap-4 h-[calc(100dvh-6rem)] lg:h-[calc(100dvh-2rem)]">
      {/* <div className="flex items-start justify-between gap-4 shrink-0 pt-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">SAHABAT AI</h1>
          <p className="text-muted-foreground">
            Asisten AI untuk menemukan program bantuan sosial yang sesuai dengan situasi Anda
          </p>
        </div>
        <Link href="/marketplace">
          <Button variant="outline">
            <Store className="h-4 w-4 mr-2" />
            Lihat Marketplace
          </Button>
        </Link>
      </div> */}

      <div className="flex-1 min-h-0">
        <UnifiedChatInterface />
      </div>
    </div>
  );
}

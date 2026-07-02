"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MessageCircle,
  FileText,
  HandHeart,
  Menu,
  ChevronDown,
  ChevronRight,
  Trash2,
  Clock,
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { UserButton } from "@/components/auth/user-button";
import { SignInButton } from "@/components/auth/sign-in-button";
import { useSession } from "@/lib/auth-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  priority: string;
}

const otherNavItems = [
  { href: "/programs", label: "Program Sosial", icon: HandHeart },
  { href: "/documents", label: "Auto-Birokrasi", icon: FileText },
];

function SidebarNavContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const { data: session, isPending } = useSession();

  const isChatPage = pathname === "/chat";
  const currentSessionId = searchParams.get("session");

  // Fetch chat history - fetch once when dropdown opens
  useEffect(() => {
    if (chatHistoryOpen && session && sessions.length === 0) {
      fetchSessions();
    }
  }, [chatHistoryOpen, session]);

  const fetchSessions = async () => {
    if (!session) {
      setSessions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/chat/history");
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/history/${sessionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove from local state
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        
        // If deleting current session, redirect to new chat
        if (currentSessionId === sessionId) {
          router.push("/chat");
        }
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleLoadSession = (sessionId: string) => {
    // Navigate to chat page with session ID as query param
    router.push(`/chat?session=${sessionId}`);
    // Keep dropdown open, only close mobile sheet
    setIsOpen(false);
  };

  const handleNewChat = () => {
    // Navigate to chat page without session param to start fresh
    router.push("/chat");
    // Keep dropdown open, only close mobile sheet
    setIsOpen(false);
  };

  // Refresh sessions when a new session is created or we're on chat page
  useEffect(() => {
    if (isChatPage && session && chatHistoryOpen) {
      // Refetch sessions to show new ones
      fetchSessions();
    }
  }, [currentSessionId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}j`;
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays}h`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          SAHABAT AI
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Akses Hak Sosial Anda
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* SAHABAT AI with chat history dropdown */}
        <Collapsible open={chatHistoryOpen} onOpenChange={setChatHistoryOpen}>
          <div className="space-y-1">
            <div className="flex items-center">
              <div
                              className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors flex-1 text-left",
                  isChatPage
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                )}>

              <button
                onClick={handleNewChat}
                >
                <div className="flex flex-row gap-3">
                  <MessageCircle className="h-5 w-5" />
                  <span>AI Chat</span>
                </div>
              </button>
              {session && (
                <CollapsibleTrigger>
                  <div
                    className={cn(
                      "w-10 shrink-0 flex items-center justify-center rounded-lg hover:bg-muted transition-colors cursor-pointer",
                      isChatPage && "text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {chatHistoryOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </CollapsibleTrigger>
              )}
                    </div>
            </div>

            {/* Chat History Dropdown */}
            {session && (
              <CollapsibleContent className="space-y-1">
                <div className="ml-4 pl-4 border-l-2 border-muted space-y-1">
                  {/* Loading State */}
                  {loading && (
                    <div className="space-y-1 py-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-12 bg-muted/50 animate-pulse rounded-md"
                        />
                      ))}
                    </div>
                  )}

                  {/* Chat Sessions */}
                  {!loading && sessions.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      Belum ada riwayat
                    </div>
                  )}

                  {!loading &&
                    sessions.slice(0, 10).map((chatSession) => {
                      const isActive = currentSessionId === chatSession.id;
                      
                      return (
                        <div
                          key={chatSession.id}
                          className={cn(
                            "group relative flex items-start gap-2 px-3 py-2 rounded-md transition-colors",
                            isActive 
                              ? "bg-primary/10 border border-primary/20" 
                              : "hover:bg-muted"
                          )}
                        >
                          <button
                            className="flex-1 min-w-0 flex items-start gap-2 text-left"
                            onClick={() => handleLoadSession(chatSession.id)}
                          >
                            <MessageCircle className={cn(
                              "h-3 w-3 shrink-0 mt-0.5",
                              isActive ? "text-primary" : "text-muted-foreground"
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-xs line-clamp-1",
                                isActive && "font-medium text-primary"
                              )}>
                                {chatSession.title}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-2.5 w-2.5" />
                                <span>{formatDate(chatSession.createdAt)}</span>
                              </div>
                            </div>
                          </button>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 hover:bg-destructive/10 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionToDelete(chatSession.id);
                              setDeleteDialogOpen(true);
                            }}
                            aria-label="Hapus chat"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </button>
                        </div>
                      );
                    })}

                  {!loading && sessions.length > 10 && (
                    <div className="text-xs text-center text-muted-foreground py-2">
                      +{sessions.length - 10} lainnya
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            )}
          </div>
        </Collapsible>

        {/* Other Navigation Items */}
        {otherNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        {isPending ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ) : session ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <UserButton />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <SignInButton />
            <p className="text-xs text-center text-muted-foreground">
              Masuk untuk akses penuh
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">SAHABAT AI</span>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger className="inline-flex items-center justify-center rounded-lg hover:bg-muted transition-colors p-2">
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <NavContent />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-background border-r">
        <NavContent />
      </aside>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus riwayat chat?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Chat ini akan dihapus
              permanen dari akun Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToDelete && handleDelete(sessionToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


// Wrapper component with Suspense boundary
export function SidebarNav() {
  return (
    <Suspense fallback={
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-background border-r">
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    }>
      <SidebarNavContent />
    </Suspense>
  );
}

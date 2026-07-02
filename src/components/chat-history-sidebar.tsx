"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Plus,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

interface ChatHistorySidebarProps {
  currentSessionId?: string | null;
  onSessionSelect: (sessionId: string | null) => void;
  onNewChat: () => void;
  className?: string;
}

export function ChatHistorySidebar({
  currentSessionId,
  onSessionSelect,
  onNewChat,
  className = "",
}: ChatHistorySidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();

  // Fetch chat history
  const fetchSessions = async () => {
    if (!session) {
      setSessions([]);
      setLoading(false);
      return;
    }

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

  useEffect(() => {
    fetchSessions();
  }, [session]);

  const handleDelete = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/history/${sessionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          onSessionSelect(null);
        }
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  // Group sessions by date
  const groupedSessions = sessions.reduce((acc, session) => {
    const date = new Date(session.createdAt);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / 86400000
    );

    let group = "";
    if (diffDays === 0) group = "Hari Ini";
    else if (diffDays === 1) group = "Kemarin";
    else if (diffDays < 7) group = "7 Hari Terakhir";
    else if (diffDays < 30) group = "30 Hari Terakhir";
    else group = "Lebih Lama";

    if (!acc[group]) acc[group] = [];
    acc[group].push(session);
    return acc;
  }, {} as Record<string, ChatSession[]>);

  const groupOrder = [
    "Hari Ini",
    "Kemarin",
    "7 Hari Terakhir",
    "30 Hari Terakhir",
    "Lebih Lama",
  ];

  if (!session) {
    return (
      <div className={cn("flex flex-col h-full border-r bg-muted/10", className)}>
        <div className="p-4 border-b">
          <h2 className="text-sm font-semibold">Riwayat Chat</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <div className="space-y-2">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Masuk untuk menyimpan riwayat chat
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-col h-full border-r bg-muted/10 transition-all duration-300",
          isCollapsed ? "w-16" : "w-80",
          className
        )}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between gap-2">
          {!isCollapsed && (
            <>
              <h2 className="text-sm font-semibold truncate">Riwayat Chat</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={onNewChat}
                title="Chat baru"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 shrink-0", isCollapsed && "mx-auto")}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Perluas" : "Ciutkan"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Content */}
        {isCollapsed ? (
          <div className="flex-1 flex flex-col items-center gap-2 p-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={onNewChat}
              title="Chat baru"
            >
              <Plus className="h-5 w-5" />
            </Button>
            <div className="w-full border-t my-2" />
            {sessions.slice(0, 5).map((session) => (
              <Button
                key={session.id}
                variant={currentSessionId === session.id ? "secondary" : "ghost"}
                size="icon"
                className="h-10 w-10"
                onClick={() => onSessionSelect(session.id)}
                title={session.title}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            ))}
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loading ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-muted animate-pulse rounded-lg"
                    />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground text-sm">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Belum ada riwayat chat</p>
                </div>
              ) : (
                groupOrder.map((groupName) => {
                  const groupSessions = groupedSessions[groupName];
                  if (!groupSessions || groupSessions.length === 0) return null;

                  return (
                    <div key={groupName} className="mb-4">
                      <h3 className="text-xs font-semibold text-muted-foreground px-3 py-2">
                        {groupName}
                      </h3>
                      <div className="space-y-1">
                        {groupSessions.map((session) => (
                          <div
                            key={session.id}
                            className={cn(
                              "group relative flex items-start gap-2 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors",
                              currentSessionId === session.id && "bg-muted"
                            )}
                            onClick={() => onSessionSelect(session.id)}
                          >
                            <MessageCircle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-1">
                                {session.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(session.createdAt)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {session.messageCount} pesan
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSessionToDelete(session.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus riwayat chat?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Chat ini akan dihapus permanen dari akun Anda.
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

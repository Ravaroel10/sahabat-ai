import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { chatHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/utils-db";

/**
 * GET /api/chat/history - Get all chat sessions for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all chat sessions for this user
    const sessions = await db.query.chatHistory.findMany({
      where: eq(chatHistory.userId, session.user.id),
      orderBy: [desc(chatHistory.createdAt)],
    });

    // Parse messages and return summary
    const summaries = sessions.map((s) => {
      const messages = JSON.parse(s.messages);
      const firstUserMessage = messages.find((m: any) => m.role === "user");
      
      // Extract text from message parts (AI SDK format)
      let title = "Chat baru";
      let preview = "";
      
      if (firstUserMessage?.parts) {
        const textPart = firstUserMessage.parts.find((p: any) => p.type === "text");
        if (textPart?.text) {
          title = textPart.text.substring(0, 60);
          preview = textPart.text.substring(0, 100);
        }
      }
      
      return {
        id: s.id,
        title,
        preview,
        messageCount: messages.length,
        createdAt: s.createdAt,
        priority: s.priority,
      };
    });

    return NextResponse.json({ sessions: summaries });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/history - Create new chat session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messages, context, priority } = body;

    const [newSession] = await db
      .insert(chatHistory)
      .values({
        id: generateId(),
        userId: session.user.id,
        messages: JSON.stringify(messages || []),
        context: context || null,
        priority: priority || "green",
      })
      .returning();

    return NextResponse.json({ session: newSession });
  } catch (error) {
    console.error("Error creating chat session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

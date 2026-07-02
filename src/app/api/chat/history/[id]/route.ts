import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { chatHistory } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/chat/history/[id] - Get specific chat session
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const chatSession = await db.query.chatHistory.findFirst({
      where: and(
        eq(chatHistory.id, params.id),
        eq(chatHistory.userId, session.user.id)
      ),
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      );
    }

    const parsedMessages = JSON.parse(chatSession.messages);
    console.log("[API] Returning session:", {
      sessionId: chatSession.id,
      messageCount: parsedMessages.length,
      firstMessage: parsedMessages[0],
    });

    return NextResponse.json({
      session: {
        ...chatSession,
        messages: parsedMessages,
      },
    });
  } catch (error) {
    console.error("Error fetching chat session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/chat/history/[id] - Update chat session (save messages)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
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
    const { messages, context: contextData, priority } = body;

    const [updated] = await db
      .update(chatHistory)
      .set({
        messages: JSON.stringify(messages),
        context: contextData || null,
        priority: priority || undefined,
      })
      .where(
        and(
          eq(chatHistory.id, params.id),
          eq(chatHistory.userId, session.user.id)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error("Error updating chat session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/history/[id] - Delete chat session
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const deleted = await db
      .delete(chatHistory)
      .where(
        and(
          eq(chatHistory.id, params.id),
          eq(chatHistory.userId, session.user.id)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

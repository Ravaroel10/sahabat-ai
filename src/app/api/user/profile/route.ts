import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Example API route showing how to:
 * 1. Authenticate user
 * 2. Query database with Drizzle ORM
 * 3. Update user data
 */

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Query user from database with Drizzle
    const userData = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
      columns: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        governmentId: true,
        province: true,
        city: true,
        createdAt: true,
      },
    });

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: userData,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Authenticate
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get update data
    const body = await request.json();
    const { governmentId, province, city } = body;

    // Update user with Drizzle
    const [updatedUser] = await db
      .update(user)
      .set({
        governmentId: governmentId || undefined,
        province: province || undefined,
        city: city || undefined,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id))
      .returning({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        governmentId: user.governmentId,
        province: user.province,
        city: user.city,
        updatedAt: user.updatedAt,
      });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

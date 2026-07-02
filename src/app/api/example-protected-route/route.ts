import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Example of a protected API route using Better Auth
 * 
 * This demonstrates how to:
 * 1. Get the session from request headers
 * 2. Verify authentication
 * 3. Access user data
 * 4. Return authenticated responses
 */
export async function GET(request: NextRequest) {
  try {
    // Get session from request headers
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Access user data from session
    const { user } = session;

    // Example: Return user-specific data
    return NextResponse.json({
      message: "Protected data accessed successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in protected route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Example POST endpoint with authentication
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

    // Get request body
    const body = await request.json();

    // Example: Process authenticated request
    // You would typically interact with the database here
    // using Drizzle ORM

    return NextResponse.json({
      message: "Data processed successfully",
      userId: session.user.id,
      receivedData: body,
    });
  } catch (error) {
    console.error("Error in POST route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

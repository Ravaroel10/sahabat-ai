import { NextRequest, NextResponse } from "next/server";
import socialPrograms from "@/data/programs/social-programs.json";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase() || "";

    let programs = socialPrograms.programs;

    if (query) {
      programs = programs.filter(program => 
        program.name.toLowerCase().includes(query) ||
        program.acronym.toLowerCase().includes(query) ||
        program.description.toLowerCase().includes(query) ||
        program.keywords.some(k => k.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({
      success: true,
      count: programs.length,
      programs
    });
  } catch (error) {
    console.error("Programs API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

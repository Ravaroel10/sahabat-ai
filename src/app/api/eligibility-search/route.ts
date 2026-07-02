import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { eligibilityRecord, socialProgram } from '@/db/schema';
import { SOCIAL_PROGRAMS } from '@/data/social-programs';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

interface EligibilitySearchRequest {
  criteria: {
    income?: number;
    familySize?: number;
    age?: number;
    location?: {
      province?: string;
      city?: string;
    };
    occupation?: string;
    hasChildren?: boolean;
    childrenCount?: number;
    hasDisability?: boolean;
    isPregnant?: boolean;
  };
  additionalInfo?: string;
  topK?: number;
}

interface ProgramResult {
  program: any;
  eligibility: any;
  semanticScore: number;
  aiReasoning: string;
  finalScore: number;
  recommendation: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body: EligibilitySearchRequest = await request.json();

    console.log('[eligibility-search] New request from user:', userId);
    console.log('[eligibility-search] Criteria:', body.criteria);
    console.log('[eligibility-search] Additional info:', body.additionalInfo?.substring(0, 100) || 'None');

    // Prepare request for AI service
    const aiServiceRequest = {
      criteria: body.criteria,
      additionalInfo: body.additionalInfo || null,
      programs: SOCIAL_PROGRAMS, // Pass all programs to AI service
      topK: body.topK || 10,
    };

    // Call AI service
    console.log('[eligibility-search] Calling AI service...');
    const aiServiceResponse = await fetch(`${AI_SERVICE_URL}/eligibility-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiServiceRequest),
    });

    if (!aiServiceResponse.ok) {
      const errorText = await aiServiceResponse.text();
      console.error('[eligibility-search] AI service error:', errorText);
      throw new Error(`AI service error: ${aiServiceResponse.status}`);
    }

    const aiServiceData = await aiServiceResponse.json();
    console.log('[eligibility-search] AI service returned:', aiServiceData.programs?.length || 0, 'programs');

    // Save results to database
    console.log('[eligibility-search] Saving results to database...');
    const savedRecords = await saveEligibilityResults(
      userId,
      aiServiceData.programs,
      body.criteria,
      body.additionalInfo
    );

    console.log('[eligibility-search] Saved', savedRecords.length, 'records');

    // Return results with saved record IDs
    return NextResponse.json({
      programs: aiServiceData.programs,
      searchMetadata: {
        ...aiServiceData.searchMetadata,
        savedRecords: savedRecords.length,
      },
    });

  } catch (error: any) {
    console.error('[eligibility-search] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search programs' },
      { status: 500 }
    );
  }
}

/**
 * Save eligibility search results to database
 */
async function saveEligibilityResults(
  userId: string,
  programs: ProgramResult[],
  criteria: any,
  additionalInfo?: string
): Promise<any[]> {
  const searchQuery = JSON.stringify({
    structured: criteria,
    unstructured: additionalInfo || null,
    timestamp: new Date().toISOString(),
  });

  const records = [];

  for (const result of programs) {
    try {
      // Convert finalScore (0-1) to score (0-100)
      const score = Math.round(result.finalScore * 100);

      // Find or create the program in database
      const program = await findOrCreateProgram(result.program);

      const record = await db.insert(eligibilityRecord).values({
        id: nanoid(),
        userId,
        programId: program.id,
        score,
        status: result.eligibility.status,
        details: JSON.stringify({
          matchedRequirements: result.eligibility.matchedRequirements,
          unmatchedRequirements: result.eligibility.unmatchedRequirements,
          missingInformation: result.eligibility.missingInformation,
          gapAnalysis: result.eligibility.gapAnalysis,
        }),
        searchQuery,
        aiReasoning: result.aiReasoning,
        semanticScore: result.semanticScore,
        finalScore: result.finalScore,
        recommendation: result.recommendation,
        searchMetadata: JSON.stringify({
          criteriaProvided: Object.keys(criteria).length,
          hasAdditionalContext: !!additionalInfo,
        }),
      }).returning();

      records.push(record[0]);
    } catch (error) {
      console.error('[eligibility-search] Error saving record for program:', result.program.id, error);
      // Continue with other records even if one fails
    }
  }

  return records;
}

/**
 * Find existing program or create new one
 */
async function findOrCreateProgram(programData: any): Promise<any> {
  // Try to find existing program by acronym or name
  const existing = await db
    .select()
    .from(socialProgram)
    .where(
      eq(socialProgram.acronym, programData.acronym || programData.id)
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new program
  const newProgram = await db.insert(socialProgram).values({
    id: programData.id || nanoid(),
    acronym: programData.acronym || programData.id,
    name: programData.name,
    description: programData.description || '',
    legalBasis: programData.regulations?.join(', ') || '',
    ministry: programData.provider || 'Unknown',
    benefits: programData.benefits || '',
    eligibility: JSON.stringify(programData.requirements || {}),
    documents: programData.requiredDocuments?.join(', ') || '',
    contact: programData.contactInfo || '',
    province: programData.targetLocation?.province || null,
  }).returning();

  return newProgram[0];
}

/**
 * GET endpoint to retrieve user's saved searches
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const programId = searchParams.get('programId');

    console.log('[eligibility-search] GET request from user:', userId);

    // Build query conditions
    const conditions = programId 
      ? and(
          eq(eligibilityRecord.userId, userId),
          eq(eligibilityRecord.programId, programId)
        )
      : eq(eligibilityRecord.userId, userId);

    // Fetch saved searches with program data
    const records = await db
      .select({
        record: eligibilityRecord,
        program: socialProgram,
      })
      .from(eligibilityRecord)
      .leftJoin(socialProgram, eq(eligibilityRecord.programId, socialProgram.id))
      .where(conditions)
      .orderBy(desc(eligibilityRecord.createdAt))
      .limit(limit);

    console.log('[eligibility-search] Found', records.length, 'saved searches');

    // Transform records for response
    const transformedRecords = records.map((row) => ({
      id: row.record.id,
      createdAt: row.record.createdAt,
      program: row.program ? {
        id: row.program.id,
        acronym: row.program.acronym,
        name: row.program.name,
        description: row.program.description,
        ministry: row.program.ministry,
        benefits: row.program.benefits,
      } : null,
      eligibility: {
        status: row.record.status,
        score: row.record.score,
        finalScore: row.record.finalScore,
        details: row.record.details ? JSON.parse(row.record.details) : null,
      },
      aiReasoning: row.record.aiReasoning,
      recommendation: row.record.recommendation,
      searchQuery: row.record.searchQuery ? JSON.parse(row.record.searchQuery) : null,
    }));

    return NextResponse.json({
      searches: transformedRecords,
      total: transformedRecords.length,
    });

  } catch (error: any) {
    console.error('[eligibility-search] GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch saved searches' },
      { status: 500 }
    );
  }
}

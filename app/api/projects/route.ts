
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// ==========================================
// DAYFLOW — PROJECTS API
// ==========================================

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

// Validate and convert a due date
function parseDueDate(
  value: unknown
): Date | null | undefined {
  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  // Handle date-only values from HTML date inputs
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T12:00:00.000Z`
    : value;

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

// Safely read JSON request bodies
async function readBody(
  request: Request
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();

    if (
      body === null ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return null;
    }

    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

// Handle Prisma/database errors
function handleDatabaseError(
  error: unknown,
  operation: string
) {
  console.error(`Error ${operation}:`, error);

  const code =
    error !== null &&
    typeof error === "object" &&
    "code" in error
      ? error.code
      : null;

  if (code === "P2002") {
    return errorResponse(
      "A project with these values already exists",
      409
    );
  }

  return errorResponse(
    `Failed to ${operation}`,
    500
  );
}

// ==========================================
// GET — FETCH ALL PROJECTS
// ==========================================

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    return handleDatabaseError(
      error,
      "fetch projects"
    );
  }
}

// ==========================================
// POST — CREATE A NEW PROJECT
// ==========================================

export async function POST(request: Request) {
  const body = await readBody(request);

  if (!body) {
    return errorResponse(
      "Invalid JSON request body",
      400
    );
  }

  // Validate project name
  if (
    typeof body.name !== "string" ||
    !body.name.trim()
  ) {
    return errorResponse(
      "Project name is required",
      400
    );
  }

  const name = body.name.trim();

  if (name.length > 255) {
    return errorResponse(
      "Project name must be 255 characters or less",
      400
    );
  }

  // Validate optional due date
  let dueDate: Date | null = null;

  if (body.dueDate !== undefined) {
    const parsed = parseDueDate(body.dueDate);

    if (parsed === undefined) {
      return errorResponse(
        "Invalid project due date",
        400
      );
    }

    dueDate = parsed;
  }

  try {
    const project = await prisma.project.create({
      data: {
        name,
        dueDate,
      },
    });

    return NextResponse.json(
      project,
      { status: 201 }
    );
  } catch (error) {
    return handleDatabaseError(
      error,
      "create project"
    );
  }
}

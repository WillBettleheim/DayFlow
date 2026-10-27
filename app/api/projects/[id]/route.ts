
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ProjectUpdate = {
  name?: string;
  dueDate?: Date | null;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

function parseProjectId(value: string): number | null {
  const id = Number(value);

  if (
    !/^[1-9]\d*$/.test(value) ||
    !Number.isSafeInteger(id)
  ) {
    return null;
  }

  return id;
}

function parseDueDate(
  value: unknown
): Date | null | undefined {
  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T12:00:00.000Z`
    : value;

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

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

  if (code === "P2025") {
    return errorResponse("Project not found", 404);
  }

  if (code === "P2003") {
    return errorResponse(
      "This project has related records and cannot be deleted until they are reassigned or removed.",
      409
    );
  }

  return errorResponse(
    `Failed to ${operation}`,
    500
  );
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  const { id } = await params;
  const projectId = parseProjectId(id);

  if (projectId === null) {
    return errorResponse("Invalid project ID", 400);
  }

  const body = await readBody(request);

  if (!body) {
    return errorResponse(
      "Invalid JSON request body",
      400
    );
  }

  const data: ProjectUpdate = {};

  // Update project name
  if (body.name !== undefined) {
    if (
      typeof body.name !== "string" ||
      !body.name.trim()
    ) {
      return errorResponse(
        "Project name cannot be empty",
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

    data.name = name;
  }

  // Update project due date
  if (body.dueDate !== undefined) {
    const dueDate = parseDueDate(body.dueDate);

    if (dueDate === undefined) {
      return errorResponse(
        "Invalid project due date",
        400
      );
    }

    data.dueDate = dueDate;
  }

  // Ensure at least one field was provided
  if (Object.keys(data).length === 0) {
    return errorResponse(
      "No valid changes provided",
      400
    );
  }

  try {
    const project = await prisma.project.update({
      where: {
        id: projectId,
      },
      data,
    });

    return NextResponse.json(project);
  } catch (error) {
    return handleDatabaseError(
      error,
      "update project"
    );
  }
}



export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  const { id } = await params;
  const projectId = parseProjectId(id);

  if (projectId === null) {
    return errorResponse("Invalid project ID", 400);
  }

  try {
    await prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    return handleDatabaseError(
      error,
      "delete project"
    );
  }
}

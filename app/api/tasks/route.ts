
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Body = Record<string, unknown>;

type Priority = "High" | "Medium" | "Low";

const priorities: Priority[] = [
  "High",
  "Medium",
  "Low",
];

function isObject(value: unknown): value is Body {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function has(body: Body, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(
    body,
    key
  );
}

function validId(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function validTitle(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 255
  );
}

function validPriority(
  value: unknown
): value is Priority {
  return (
    typeof value === "string" &&
    priorities.includes(value as Priority)
  );
}

function validCategory(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 100
  );
}

function validDescription(
  value: unknown
): value is string | null {
  return (
    value === null ||
    (typeof value === "string" &&
      value.length <= 20000)
  );
}

function parseDate(
  value: unknown
): Date | null | undefined {
  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;

  if (
    !dateOnly.test(value) &&
    !/^\d{4}-\d{2}-\d{2}T/.test(value)
  ) {
    return undefined;
  }

  const date = new Date(
    dateOnly.test(value)
      ? `${value}T12:00:00.000Z`
      : value
  );

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  if (
    dateOnly.test(value) &&
    date.toISOString().slice(0, 10) !== value
  ) {
    return undefined;
  }

  return date;
}

async function readBody(
  request: Request
): Promise<Body | null> {
  try {
    const value: unknown = await request.json();

    return isObject(value) ? value : null;
  } catch {
    return null;
  }
}

function errorResponse(
  message: string,
  status = 400
) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

function internalError(
  action: string,
  error: unknown
) {
  console.error(`DAYFLOW ${action}:`, error);

  return errorResponse(
    "Something went wrong on the server.",
    500
  );
}

// ========================================
// GET ALL TASKS
// ========================================

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        id: "desc",
      },
      include: {
        subtasks: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return internalError("GET tasks", error);
  }
}

// ========================================
// CREATE TASK OR SUBTASK
// ========================================

export async function POST(request: Request) {
  const body = await readBody(request);

  if (!body) {
    return errorResponse("Invalid JSON body.");
  }

  // Create a subtask.
  if (body.entity === "subtask") {
    if (!validId(body.taskId)) {
      return errorResponse(
        "A valid parent task ID is required."
      );
    }

    if (!validTitle(body.title)) {
      return errorResponse(
        "Subtask title must be 1–255 characters."
      );
    }

    try {
      const parent = await prisma.task.findUnique({
        where: {
          id: body.taskId,
        },
        select: {
          id: true,
        },
      });

      if (!parent) {
        return errorResponse(
          "Parent task not found.",
          404
        );
      }

      const subtask = await prisma.subtask.create({
        data: {
          taskId: body.taskId,
          title: body.title.trim(),
        },
      });

      return NextResponse.json(subtask, {
        status: 201,
      });
    } catch (error) {
      return internalError("Create subtask", error);
    }
  }

  // Create a regular task.
  if (!validTitle(body.title)) {
    return errorResponse(
      "Task title must be 1–255 characters."
    );
  }

  const category =
    body.category === undefined
      ? "Personal"
      : body.category;

  if (!validCategory(category)) {
    return errorResponse("Invalid category.");
  }

  const priority =
    body.priority === undefined
      ? "Medium"
      : body.priority;

  if (!validPriority(priority)) {
    return errorResponse("Invalid priority.");
  }

  const description =
    body.description === undefined
      ? null
      : body.description;

  if (!validDescription(description)) {
    return errorResponse(
      "Description must be text or null."
    );
  }

  const dueDate =
    body.dueDate === undefined
      ? null
      : parseDate(body.dueDate);

  if (dueDate === undefined) {
    return errorResponse("Invalid due date.");
  }

  const projectId =
    body.projectId === undefined ||
    body.projectId === null ||
    body.projectId === ""
      ? null
      : body.projectId;

  if (
    projectId !== null &&
    !validId(projectId)
  ) {
    return errorResponse("Invalid project ID.");
  }

  try {
    if (projectId !== null) {
      const project = await prisma.project.findUnique({
        where: {
          id: projectId,
        },
        select: {
          id: true,
        },
      });

      if (!project) {
        return errorResponse(
          "Project not found.",
          404
        );
      }
    }

    const task = await prisma.task.create({
      data: {
        title: body.title.trim(),
        category: category.trim(),
        priority,
        description,
        dueDate,
        projectId,
      },
      include: {
        subtasks: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    return NextResponse.json(task, {
      status: 201,
    });
  } catch (error) {
    return internalError("Create task", error);
  }
}

// ========================================
// UPDATE TASK OR SUBTASK
// ========================================

export async function PATCH(request: Request) {
  const body = await readBody(request);

  if (!body) {
    return errorResponse("Invalid JSON body.");
  }

  if (!validId(body.id)) {
    return errorResponse("A valid ID is required.");
  }

  // Update a subtask.
  if (body.entity === "subtask") {
    const changes: {
      title?: string;
      done?: boolean;
    } = {};

    if (has(body, "title")) {
      if (!validTitle(body.title)) {
        return errorResponse(
          "Invalid subtask title."
        );
      }

      changes.title = body.title.trim();
    }

    if (has(body, "done")) {
      if (typeof body.done !== "boolean") {
        return errorResponse(
          "Subtask completion must be a boolean."
        );
      }

      changes.done = body.done;
    }

    if (Object.keys(changes).length === 0) {
      return errorResponse(
        "No subtask changes provided."
      );
    }

    try {
      const existing =
        await prisma.subtask.findUnique({
          where: {
            id: body.id,
          },
          select: {
            id: true,
          },
        });

      if (!existing) {
        return errorResponse(
          "Subtask not found.",
          404
        );
      }

      const updated = await prisma.subtask.update({
        where: {
          id: body.id,
        },
        data: changes,
      });

      return NextResponse.json(updated);
    } catch (error) {
      return internalError("Update subtask", error);
    }
  }

  // Update a regular task.
  const changes: {
    title?: string;
    description?: string | null;
    category?: string;
    priority?: Priority;
    done?: boolean;
    completedAt?: Date | null;
    dueDate?: Date | null;
    projectId?: number | null;
  } = {};

  if (has(body, "title")) {
    if (!validTitle(body.title)) {
      return errorResponse("Invalid task title.");
    }

    changes.title = body.title.trim();
  }

  if (has(body, "description")) {
    if (!validDescription(body.description)) {
      return errorResponse(
        "Invalid description."
      );
    }

    changes.description = body.description;
  }

  if (has(body, "category")) {
    if (!validCategory(body.category)) {
      return errorResponse("Invalid category.");
    }

    changes.category = body.category.trim();
  }

  if (has(body, "priority")) {
    if (!validPriority(body.priority)) {
      return errorResponse("Invalid priority.");
    }

    changes.priority = body.priority;
  }

  if (has(body, "done")) {
    if (typeof body.done !== "boolean") {
      return errorResponse(
        "Task completion must be a boolean."
      );
    }

    changes.done = body.done;
  }

  if (has(body, "dueDate")) {
    const date = parseDate(body.dueDate);

    if (date === undefined) {
      return errorResponse("Invalid due date.");
    }

    changes.dueDate = date;
  }

  if (has(body, "projectId")) {
    if (
      body.projectId !== null &&
      !validId(body.projectId)
    ) {
      return errorResponse("Invalid project ID.");
    }

    changes.projectId = body.projectId;
  }

  if (Object.keys(changes).length === 0) {
    return errorResponse(
      "No task changes provided."
    );
  }

  try {
    const existing = await prisma.task.findUnique({
      where: {
        id: body.id,
      },
      select: {
        id: true,
        done: true,
        completedAt: true,
      },
    });

    if (!existing) {
      return errorResponse(
        "Task not found.",
        404
      );
    }

    // Save the actual task completion time.
    if (changes.done === true) {
      changes.completedAt = existing.done
        ? existing.completedAt ?? new Date()
        : new Date();
    }

    if (changes.done === false) {
      changes.completedAt = null;
    }

    if (
      changes.projectId !== undefined &&
      changes.projectId !== null
    ) {
      const project = await prisma.project.findUnique({
        where: {
          id: changes.projectId,
        },
        select: {
          id: true,
        },
      });

      if (!project) {
        return errorResponse(
          "Selected project not found.",
          404
        );
      }
    }

    const updated = await prisma.task.update({
      where: {
        id: body.id,
      },
      data: changes,
    });

    const subtasks = await prisma.subtask.findMany({
      where: {
        taskId: updated.id,
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json({ ...updated, subtasks });
  } catch (error) {
    return internalError("Update task", error);
  }
}

// ========================================
// DELETE TASK OR SUBTASK
// ========================================

export async function DELETE(request: Request) {
  const body = await readBody(request);

  if (!body) {
    return errorResponse("Invalid JSON body.");
  }

  if (!validId(body.id)) {
    return errorResponse("A valid ID is required.");
  }

  // Delete a subtask.
  if (body.entity === "subtask") {
    try {
      const existing =
        await prisma.subtask.findUnique({
          where: {
            id: body.id,
          },
          select: {
            id: true,
          },
        });

      if (!existing) {
        return errorResponse(
          "Subtask not found.",
          404
        );
      }

      await prisma.subtask.delete({
        where: {
          id: body.id,
        },
      });

      return NextResponse.json({
        success: true,
      });
    } catch (error) {
      return internalError("Delete subtask", error);
    }
  }

  // Delete a task.
  // Its subtasks are removed by the Cascade relation.
  try {
    const existing = await prisma.task.findUnique({
      where: {
        id: body.id,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return errorResponse(
        "Task not found.",
        404
      );
    }

    await prisma.task.delete({
      where: {
        id: body.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return internalError("Delete task", error);
  }
}

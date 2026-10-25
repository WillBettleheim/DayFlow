import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET all tasks
export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        id: "desc",
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// CREATE a task
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title: body.title.trim(),
        category:
          typeof body.category === "string" && body.category.trim()
            ? body.category
            : "Personal",
        priority:
          typeof body.priority === "string" && body.priority.trim()
            ? body.priority
            : "Medium",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        projectId:
          typeof body.projectId === "number" ? body.projectId : null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

// UPDATE a task
export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (typeof body.id !== "number") {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const data: {
      done?: boolean;
      completedAt?: Date | null;
      dueDate?: Date | null;
      title?: string;
      category?: string;
      priority?: string;
      projectId?: number | null;
    } = {};

    if (typeof body.done === "boolean") {
      data.done = body.done;
    }

    if (body.completedAt !== undefined) {
      data.completedAt = body.completedAt
        ? new Date(body.completedAt)
        : null;
    }

    if (body.dueDate !== undefined) {
      data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }

    if (typeof body.title === "string" && body.title.trim()) {
      data.title = body.title.trim();
    }

    if (typeof body.category === "string") {
      data.category = body.category;
    }

    if (typeof body.priority === "string") {
      data.priority = body.priority;
    }

    if (body.projectId !== undefined) {
      data.projectId =
        typeof body.projectId === "number" ? body.projectId : null;
    }

    const task = await prisma.task.update({
      where: { id: body.id },
      data,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE a task
export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    if (typeof body.id !== "number") {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    await prisma.task.delete({
      where: { id: body.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
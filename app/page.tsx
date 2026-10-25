"use client";
import { useEffect, useMemo, useState } from "react";
import OverviewView from "../components/views/OverviewView";
import TasksView from "../components/views/TasksView";
import ProjectsView from "../components/views/ProjectsView";
import PlannerView from "../components/views/PlannerView"; 
import FocusView from "../components/views/FocusView";
import InsightsView from "../components/views/InsightsView";
type Task = {
  id: number;
  title: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  done: boolean;
  completedAt: string | null;
  dueDate: string | null;
};

type Project = {
  id: number;
  name: string;
  createdAt: string;
  dueDate: string | null;
};

const navItems = [
  "Overview",
  "My Tasks",
  "Projects",
  "Planner",
  "Focus",
  "Insights",
];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysBetween(a: Date, b: Date) {
  const MS = 1000 * 60 * 60 * 24;
  return Math.round(
    (startOfDay(a).getTime() - startOfDay(b).getTime()) / MS
  );
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return daysBetween(new Date(iso), new Date());
}

function formatDeadline(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function computeStreaks(tasks: Task[]) {
  const completedDays = new Set<string>();
  for (const t of tasks) {
    if (t.done && t.completedAt) {
      const d = startOfDay(new Date(t.completedAt));
      completedDays.add(d.toISOString().slice(0, 10));
    }
  }

  let current = 0;
  const today = startOfDay(new Date());
  for (let i = 0; i < 3650; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (completedDays.has(key)) {
      current++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }

  const sorted = Array.from(completedDays).sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of sorted) {
    const d = new Date(key + "T00:00:00");
    if (prev && daysBetween(d, prev) === 1) {
      run++;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = d;
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return {
      key,
      label: d.toLocaleDateString("en-US", { weekday: "narrow" }),
      active: completedDays.has(key),
    };
  });

  return { current, longest, last7 };
}

type Urgency = "overdue" | "critical" | "soon" | "upcoming" | "none";

function getUrgency(days: number | null): Urgency {
  if (days === null) return "none";
  if (days < 0) return "overdue";
  if (days <= 1) return "critical";
  if (days <= 3) return "soon";
  if (days <= 7) return "upcoming";
  return "none";
}

const urgencyStyles: Record<
  Urgency,
  { badge: string; banner: string; label: (d: number) => string }
> = {
  overdue: {
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    banner:
      "border-rose-500/30 bg-gradient-to-r from-rose-500/15 to-rose-500/5",
    label: (d) => `${Math.abs(d)}d overdue`,
  },
  critical: {
    badge:
      "bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse",
    banner:
      "border-rose-500/30 bg-gradient-to-r from-rose-500/15 to-transparent",
    label: (d) => (d === 0 ? "Due today" : "Due tomorrow"),
  },
  soon: {
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    banner:
      "border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-transparent",
    label: (d) => `${d} days left`,
  },
  upcoming: {
    badge: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
    banner:
      "border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-transparent",
    label: (d) => `${d} days left`,
  },
  none: {
    badge: "bg-white/5 text-gray-400 border-white/10",
    banner: "border-white/10 bg-white/[0.02]",
    label: (d) => `${d} days`,
  },
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [activeNav, setActiveNav] = useState("Overview");

  const [newTask, setNewTask] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<
    "High" | "Medium" | "Low"
  >("Medium");
  const [newTaskCategory, setNewTaskCategory] = useState("Personal");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [showInput, setShowInput] = useState(false);

  const [newProject, setNewProject] = useState("");
  const [newProjectDueDate, setNewProjectDueDate] = useState("");
  const [showProjectInput, setShowProjectInput] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingPriority, setEditingPriority] = useState<
    "High" | "Medium" | "Low"
  >("Medium");

  const [dismissedHeadlines, setDismissedHeadlines] = useState<number[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [tasksResponse, projectsResponse] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/projects"),
        ]);

        if (!tasksResponse.ok) throw new Error("Failed to load tasks");
        if (!projectsResponse.ok) throw new Error("Failed to load projects");

        const tasksData = await tasksResponse.json();
        const projectsData = await projectsResponse.json();

        setTasks(tasksData);
        setProjects(projectsData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        showToast("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  const completed = tasks.filter((t) => t.done).length;
  const progress =
    tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);
  const remaining = tasks.length - completed;

  const highPriority = tasks.filter(
    (t) => t.priority === "High" && !t.done
  ).length;
  const mediumPriority = tasks.filter(
    (t) => t.priority === "Medium" && !t.done
  ).length;
  const lowPriority = tasks.filter(
    (t) => t.priority === "Low" && !t.done
  ).length;

  const streaks = useMemo(() => computeStreaks(tasks), [tasks]);

  const projectsWithDeadlines = useMemo(() => {
    return projects
      .map((p) => ({ ...p, daysLeft: daysUntil(p.dueDate) }))
      .filter(
        (p) =>
          p.daysLeft !== null &&
          p.daysLeft <= 7 &&
          !dismissedHeadlines.includes(p.id)
      )
      .sort((a, b) => (a.daysLeft! - b.daysLeft!));
  }, [projects, dismissedHeadlines]);

  const weeklyData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const completedCount = tasks.filter((task) => {
      if (!task.done || !task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return (
        completedDate.getTime() >= date.getTime() &&
        completedDate.getTime() < nextDate.getTime()
      );
    }).length;

    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      count: completedCount,
    };
  });

  const maxWeeklyCount = Math.max(
    ...weeklyData.map((item) => item.count),
    1
  );

  async function toggleTask(id: number) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    const updatedDone = !task.done;
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          done: updatedDone,
          completedAt: updatedDone ? new Date().toISOString() : null,
        }),
      });
      if (!response.ok) throw new Error("Failed to update task");
      const updatedTask = await response.json();
      setTasks((current) =>
        current.map((item) =>
          item.id === updatedTask.id ? updatedTask : item
        )
      );
      if (updatedDone) showToast("Nice! Task completed 🔥");
    } catch (error) {
      console.error("Error updating task:", error);
      showToast("Could not update task");
    }
  }

  async function deleteTask(id: number) {
    try {
      const response = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Failed to delete task");
      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
      showToast("Could not delete task");
    }
  }

  async function editTask(id: number) {
    if (!editingTitle.trim()) return;
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title: editingTitle.trim(),
          priority: editingPriority,
        }),
      });
      if (!response.ok) throw new Error("Failed to edit task");
      const updatedTask = await response.json();
      setTasks((current) =>
        current.map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        )
      );
      setEditingTaskId(null);
      setEditingTitle("");
    } catch (error) {
      console.error("Error editing task:", error);
      showToast("Could not edit task");
    }
  }
  async function editTaskDirect(
    id: number,
    newTitle: string,
    newPriority: "High" | "Medium" | "Low"
  ) {
    if(!newTitle.trim()) return;
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {"Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title: newTitle.trim(),
          priority: newPriority,
        }),
      });
      if(!response.ok) throw new Error("Failed to edit Task");
      const updatedTask = await response.json();
      setTasks((current) =>
        current.map((task) =>
         task.id === updatedTask.id ? updatedTask : task
    ));
    } catch (error) {
      console.error("Error editing task:", error);
      showToast("Could not edit task");
    }
  }
    async function updateProject(
    id: number,
    data: { name?: string; dueDate?: string | null }
  ) {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update project");
      const updated = await response.json();
      setProjects((current) =>
        current.map((p) => (p.id === updated.id ? updated : p))
      );
      showToast("Project updated");
    } catch (error) {
      console.error("Error updating project:", error);
      showToast("Could not update project");
    }
  }

  async function deleteProject(id: number) {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete project");
      setProjects((current) => current.filter((p) => p.id !== id));
      showToast("Project deleted");
    } catch (error) {
      console.error("Error deleting project:", error);
      showToast("Could not delete project");
    }
  }

  async function createProject() {
    if (!newProject.trim()) return;
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProject.trim(),
          dueDate: newProjectDueDate || null,
        }),
      });
      if (!response.ok) throw new Error("Failed to create project");
      const createdProject = await response.json();
      setProjects((current) => [createdProject, ...current]);
      setNewProject("");
      setNewProjectDueDate("");
      setShowProjectInput(false);
      showToast("Project created");
    } catch (error) {
      console.error("Error creating project:", error);
      showToast("Could not create project");
    }
  }

  async function addTask() {
    if (!newTask.trim()) return;
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask.trim(),
          category: newTaskCategory,
          priority: newTaskPriority,
          dueDate: newTaskDueDate || null,
        }),
      });
      if (!response.ok) throw new Error("Failed to create task");
      const createdTask = await response.json();
      setTasks((current) => [createdTask, ...current]);
      setNewTask("");
      setNewTaskPriority("Medium");
      setNewTaskCategory("Personal");
      setNewTaskDueDate("");
      setShowInput(false);
    } catch (error) {
      console.error("Error creating task:", error);
      showToast("Could not save task");
    }
  }

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <main className="min-h-screen bg-[#0b0d12] text-white md:flex">
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-violet-400/30 bg-violet-500/15 px-5 py-3 text-sm text-violet-200 backdrop-blur-md">
          {toast}
        </div>
      )}

      <aside className="flex w-full flex-col border-b border-white/10 bg-[#10131b] p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 text-lg font-bold shadow-lg shadow-violet-500/20">
            D
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">DAYFLOW</h1>
            <p className="text-xs text-gray-500">Your personal workspace</p>
          </div>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
          Workspace
        </p>

        <nav className="flex flex-wrap gap-2 md:flex-col">
          {navItems.map((item, index) => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              className={`group rounded-xl px-4 py-3 text-left text-sm transition-all duration-200 ${
                activeNav === item
                  ? "bg-violet-500/15 font-medium text-violet-300"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="mr-3 inline-block text-base">
                {["◫", "☑", "▦", "▤", "◷", "⌁"][index]}
              </span>
              {item}
            </button>
          ))}
        </nav>

        <div className="mt-8 rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 to-transparent p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <p className="text-sm font-semibold text-orange-200">
              {streaks.current} day streak
            </p>
          </div>
          <div className="mt-3 flex gap-1">
            {streaks.last7.map((d) => (
              <div
                key={d.key}
                title={d.key}
                className={`flex h-6 flex-1 items-center justify-center rounded-md text-[10px] font-medium ${
                  d.active
                    ? "bg-orange-400/80 text-black"
                    : "bg-white/5 text-gray-600"
                }`}
              >
                {d.label}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Longest: {streaks.longest} days
          </p>
        </div>

        <div className="mt-auto hidden items-center gap-3 border-t border-white/10 pt-5 md:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20 font-semibold text-violet-300">
            D
          </div>
          <div>
            <p className="text-sm font-medium">My Workspace</p>
            <p className="text-xs text-gray-500">Personal account</p>
          </div>
        </div>
      </aside>

      <section className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">{date}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Good to see you
              <span className="text-violet-400">.</span>
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Make today count, one task at a time.
            </p>
          </div>

          <button
            onClick={() => setShowInput((c) => !c)}
            className="rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5"
          >
            + New task
          </button>
        </header>

        {projectsWithDeadlines.length > 0 && (
          <div className="mb-6 space-y-3">
            {projectsWithDeadlines.map((p) => {
              const u = getUrgency(p.daysLeft);
              const styles = urgencyStyles[u];
              return (
                <div
                  key={p.id}
                  className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all hover:-translate-y-0.5 ${styles.banner}`}
                >
                  <span className="text-lg">
                    {u === "overdue"
                      ? "⚠️"
                      : u === "critical"
                      ? "🚨"
                      : u === "soon"
                      ? "⏳"
                      : "📅"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      <span className="text-white">{p.name}</span>{" "}
                      <span className="text-gray-400">
                        — {styles.label(p.daysLeft!)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Deadline {formatDeadline(p.dueDate)}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setDismissedHeadlines((c) => [...c, p.id])
                    }
                    className="rounded-lg px-2 py-1 text-xs text-gray-500 transition hover:bg-white/5 hover:text-white"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {showInput && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              addTask();
            }}
            className="mb-6 rounded-2xl border border-white/10 bg-[#141822] p-4"
          >
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <input
                autoFocus
                value={newTask}
                onChange={(event) => setNewTask(event.target.value)}
                placeholder="What do you need to do?"
                className="rounded-xl border border-white/10 bg-[#0b0d12] px-4 py-3 text-sm outline-none focus:border-violet-400 lg:col-span-2"
              />
              <select
                value={newTaskPriority}
                onChange={(event) =>
                  setNewTaskPriority(
                    event.target.value as "High" | "Medium" | "Low"
                  )
                }
                className="rounded-xl border border-white/10 bg-[#0b0d12] px-4 py-3 text-sm outline-none"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(event) => setNewTaskDueDate(event.target.value)}
                className="rounded-xl border border-white/10 bg-[#0b0d12] px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <select
                value={newTaskCategory}
                onChange={(event) => setNewTaskCategory(event.target.value)}
                className="rounded-xl border border-white/10 bg-[#0b0d12] px-4 py-3 text-sm outline-none"
              >
                <option value="Personal">Personal</option>
                <option value="Work">Work</option>
                <option value="Study">Study</option>
                <option value="Health">Health</option>
                <option value="Development">Development</option>
              </select>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold hover:bg-violet-400"
                >
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowInput(false)}
                  className="rounded-xl px-4 py-3 text-sm text-gray-400 hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
               {activeNav === "My Tasks" ? (
          <TasksView
            tasks={tasks}
            loading={loading}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onEdit={editTaskDirect}
            onAddClick={() => setShowInput(true)}
          />
        ) : activeNav === "Projects" ? (
          <ProjectsView
            projects={projects}
            loading={loading}
            onDelete={deleteProject}
            onUpdate={updateProject}
            onAddClick={() => setShowProjectInput(true)}
          />
        ) : activeNav === "Planner" ? (
          <PlannerView
            tasks={tasks}
            loading={loading}
            onToggle={toggleTask}
            onAddClick={() => setShowInput(true)}
          />
        ) : activeNav === "Focus" ? (
          <FocusView
            tasks={tasks}
            loading={loading}
            onToggle={toggleTask}
            onAddClick={() => setShowInput(true)}
          />
        ) : activeNav === "Insights" ? (
          <InsightsView tasks={tasks} loading={loading} />
        ) : (
          <OverviewView
            tasks={tasks}
            projects={projects}
            loading={loading}
            activeNav={activeNav}
            completed={completed}
            progress={progress}
            remaining={remaining}
            highPriority={highPriority}
            mediumPriority={mediumPriority}
            lowPriority={lowPriority}
            weeklyData={weeklyData}
            maxWeeklyCount={maxWeeklyCount}
          />
        )}
         {activeNav === "Overview" && (
        <section className="rounded-2xl border border-white/10 bg-[#121620] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Your projects</h3>
              <p className="mt-1 text-sm text-gray-500">
                Keep an eye on your goals.
              </p>
            </div>
            <button
              onClick={() =>
                setShowProjectInput((current) => !current)
              }
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5"
            >
              + New project
            </button>
          </div>

          {showProjectInput && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input
                value={newProject}
                onChange={(event) => setNewProject(event.target.value)}
                placeholder="Project name"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-violet-400"
                autoFocus
              />
              <input
                type="date"
                value={newProjectDueDate}
                onChange={(event) =>
                  setNewProjectDueDate(event.target.value)
                }
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-violet-400"
              />
              <button
                onClick={createProject}
                className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400"
              >
                Add
              </button>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-white/10 p-6 text-center">
              <p className="text-sm text-gray-500">No projects yet.</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const d = daysUntil(project.dueDate);
                const u = getUrgency(d);
                const styles = urgencyStyles[u];
                return (
                  <div
                    key={project.id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium text-gray-200">
                        {project.name}
                      </p>
                      {d !== null && (
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles.badge}`}
                        >
                          {styles.label(d)}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {project.dueDate
                        ? `Deadline ${formatDeadline(project.dueDate)}`
                        : "No deadline"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
         )}

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-gray-600">
          <p>DAYFLOW · Your personal workspace</p>
          <p>One step at a time.</p>
        </footer>
      </section>
    </main>
  );
}
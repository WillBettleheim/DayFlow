
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FormEvent } from "react";

import OverviewView from "../components/views/OverviewView";
import TasksView from "../components/views/TasksView";
import ProjectsView from "../components/views/ProjectsView";
import PlannerView from "../components/views/PlannerView";
import FocusView from "../components/views/FocusView";
import InsightsView from "../components/views/InsightsView";

type Priority = "High" | "Medium" | "Low";

type Task = {
  id: number;
  title: string;
  category: string;
  priority: Priority;
  done: boolean;
  completedAt: string | null;
  dueDate: string | null;
  projectId?: number | null;
};

type Project = {
  id: number;
  name: string;
  createdAt: string;
  dueDate: string | null;
};

type Page =
  | "Overview"
  | "Tasks"
  | "Projects"
  | "Planner"
  | "Focus"
  | "Insights";

const navigation: {
  name: Page;
  symbol: string;
  description: string;
}[] = [
  { name: "Overview", symbol: "▦", description: "Dashboard" },
  { name: "Tasks", symbol: "☑", description: "Manage tasks" },
  { name: "Projects", symbol: "▤", description: "Your projects" },
  { name: "Planner", symbol: "▣", description: "Plan your days" },
  { name: "Focus", symbol: "◎", description: "Stay focused" },
  { name: "Insights", symbol: "◫", description: "Your analytics" },
];

const inputClass =
  "w-full min-w-0 rounded-xl border border-white/10 bg-[#20231F] px-4 py-3 text-sm text-[#F5F6F1] outline-none focus:border-[#D8FF56]";

const primaryButton =
  "rounded-xl bg-[#D8FF56] px-4 py-3 text-sm font-semibold text-[#20231D] transition hover:bg-[#E8FF9B] disabled:opacity-50 sm:px-5";

const secondaryButton =
  "rounded-xl border border-white/10 bg-[#30342E] px-4 py-3 text-sm text-[#D7DECF] transition hover:bg-[#3B4038] sm:px-5";

function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

async function apiRequest<T>(
  url: string,
  method = "GET",
  body?: unknown
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    ...(body === undefined
      ? {}
      : { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const result: unknown = await response.json();

      if (
        result !== null &&
        typeof result === "object" &&
        "error" in result &&
        typeof result.error === "string"
      ) {
        message = result.error;
      }
    } catch {
      // Preserve the HTTP error.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export default function Home() {
  const [activePage, setActivePage] =
    useState<Page>("Overview");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // RESPONSIVE NAVIGATION
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  // CREATE TASK FORM
  const [taskFormOpen, setTaskFormOpen] =
    useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] =
    useState("Personal");
  const [taskPriority, setTaskPriority] =
    useState<Priority>("Medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskProjectId, setTaskProjectId] =
    useState("");

  // CREATE PROJECT FORM
  const [projectFormOpen, setProjectFormOpen] =
    useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDueDate, setProjectDueDate] =
    useState("");

  // RESTORE SIDEBAR PREFERENCE
  useEffect(() => {
    try {
      setSidebarCollapsed(
        localStorage.getItem("dayflow-sidebar-collapsed") ===
          "true"
      );
    } catch {
      // Storage is optional.
    }
  }, []);

  // ESC KEY CLOSES MOBILE MENU
  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [mobileMenuOpen]);

  function toggleSidebar() {
    setSidebarCollapsed((previous) => {
      const next = !previous;

      try {
        localStorage.setItem(
          "dayflow-sidebar-collapsed",
          String(next)
        );
      } catch {
        // Layout still works without storage.
      }

      return next;
    });
  }

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [taskData, projectData] =
        await Promise.all([
          apiRequest<Task[]>("/api/tasks"),
          apiRequest<Project[]>("/api/projects"),
        ]);

      setTasks(taskData);
      setProjects(projectData);
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Failed to load DAYFLOW."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function showError(
    caught: unknown,
    fallback: string
  ) {
    setError(
      caught instanceof Error ? caught.message : fallback
    );
  }

  function navigate(page: Page) {
    setActivePage(page);
    setMobileMenuOpen(false);
    setTaskFormOpen(false);
    setProjectFormOpen(false);
  }

  function openTaskForm() {
    setMobileMenuOpen(false);
    setProjectFormOpen(false);
    setTaskFormOpen(true);
  }

  function openProjectForm() {
    setMobileMenuOpen(false);
    setActivePage("Projects");
    setTaskFormOpen(false);
    setProjectFormOpen(true);
  }

  // TASK ACTIONS

  async function createTask(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!taskTitle.trim() || saving) return;

    setSaving(true);

    try {
      const created = await apiRequest<Task>(
        "/api/tasks",
        "POST",
        {
          title: taskTitle.trim(),
          category: taskCategory,
          priority: taskPriority,
          dueDate: taskDueDate
            ? `${taskDueDate}T12:00:00.000Z`
            : null,
          projectId: taskProjectId
            ? Number(taskProjectId)
            : null,
        }
      );

      setTasks((current) => [created, ...current]);

      setTaskTitle("");
      setTaskCategory("Personal");
      setTaskPriority("Medium");
      setTaskDueDate("");
      setTaskProjectId("");
      setTaskFormOpen(false);
      setError("");
    } catch (caught) {
      showError(caught, "Could not create task.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(id: number) {
    const existing = tasks.find((task) => task.id === id);
    if (!existing) return;

    try {
      const updated = await apiRequest<Task>(
        "/api/tasks",
        "PATCH",
        {
          id,
          done: !existing.done,
        }
      );

      setTasks((current) =>
        current.map((task) =>
          task.id === id ? updated : task
        )
      );
      setError("");
    } catch (caught) {
      showError(caught, "Could not update task.");
    }
  }

  async function editTask(
    id: number,
    title: string,
    priority: Priority
  ) {
    if (!title.trim()) return;

    try {
      const updated = await apiRequest<Task>(
        "/api/tasks",
        "PATCH",
        {
          id,
          title: title.trim(),
          priority,
        }
      );

      setTasks((current) =>
        current.map((task) =>
          task.id === id ? updated : task
        )
      );
      setError("");
    } catch (caught) {
      showError(caught, "Could not edit task.");
    }
  }

  async function deleteTask(id: number) {
    if (!window.confirm("Delete this task?")) return;

    try {
      await apiRequest<unknown>(
        "/api/tasks",
        "DELETE",
        { id }
      );

      setTasks((current) =>
        current.filter((task) => task.id !== id)
      );

      setError("");
    } catch (caught) {
      showError(caught, "Could not delete task.");
    }
  }

  // PROJECT ACTIONS

  async function createProject(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!projectName.trim() || saving) return;

    setSaving(true);

    try {
      const created = await apiRequest<Project>(
        "/api/projects",
        "POST",
        {
          name: projectName.trim(),
          dueDate: projectDueDate || null,
        }
      );

      setProjects((current) => [created, ...current]);

      setProjectName("");
      setProjectDueDate("");
      setProjectFormOpen(false);
      setError("");
    } catch (caught) {
      showError(caught, "Could not create project.");
    } finally {
      setSaving(false);
    }
  }

  async function updateProject(
    id: number,
    data: {
      name?: string;
      dueDate?: string | null;
    }
  ) {
    try {
      const updated = await apiRequest<Project>(
        `/api/projects/${id}`,
        "PATCH",
        data
      );

      setProjects((current) =>
        current.map((project) =>
          project.id === id ? updated : project
        )
      );
      setError("");
    } catch (caught) {
      showError(caught, "Could not update project.");
    }
  }

  async function deleteProject(id: number) {
    try {
      await apiRequest<unknown>(
        `/api/projects/${id}`,
        "DELETE"
      );

      setProjects((current) =>
        current.filter((project) => project.id !== id)
      );

      const refreshedTasks =
        await apiRequest<Task[]>("/api/tasks");

      setTasks(refreshedTasks);
      setError("");
    } catch (caught) {
      showError(caught, "Could not delete project.");
      void loadData();
    }
  }

  // DASHBOARD STATISTICS

  const completed = tasks.filter(
    (task) => task.done
  ).length;

  const remaining = tasks.length - completed;

  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const highPriority = tasks.filter(
    (task) => !task.done && task.priority === "High"
  ).length;

  const mediumPriority = tasks.filter(
    (task) => !task.done && task.priority === "Medium"
  ).length;

  const lowPriority = tasks.filter(
    (task) => !task.done && task.priority === "Low"
  ).length;

  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));

      const key = dateKey(date);

      const count = tasks.filter((task) => {
        if (!task.done || !task.completedAt) {
          return false;
        }

        const finished = new Date(task.completedAt);

        return (
          !Number.isNaN(finished.getTime()) &&
          dateKey(finished) === key
        );
      }).length;

      return {
        day: date.toLocaleDateString("en-US", {
          weekday: "short",
        }),
        count,
      };
    });
  }, [tasks]);

  const maxWeeklyCount = Math.max(
    1,
    ...weeklyData.map((day) => day.count)
  );

  // CONNECT ALL SIX VIEWS

  function renderCurrentView() {
    switch (activePage) {
      case "Overview":
        return (
          <OverviewView
            tasks={tasks}
            projects={projects}
            loading={loading}
            activeNav={activePage}
            completed={completed}
            progress={progress}
            remaining={remaining}
            highPriority={highPriority}
            mediumPriority={mediumPriority}
            lowPriority={lowPriority}
            weeklyData={weeklyData}
            maxWeeklyCount={maxWeeklyCount}
          />
        );

      case "Tasks":
        return (
          <TasksView
            tasks={tasks}
            loading={loading}
            onToggle={(id) => void toggleTask(id)}
            onDelete={(id) => void deleteTask(id)}
            onEdit={(id, title, priority) =>
              void editTask(id, title, priority)
            }
            onAddClick={openTaskForm}
          />
        );

      case "Projects":
        return (
          <ProjectsView
            projects={projects}
            tasks={tasks}
            loading={loading}
            onDelete={(id) => void deleteProject(id)}
            onUpdate={(id, data) =>
              void updateProject(id, data)
            }
            onAddClick={openProjectForm}
          />
        );

      case "Planner":
        return (
          <PlannerView
            tasks={tasks}
            loading={loading}
            onToggle={(id) => void toggleTask(id)}
            onAddClick={openTaskForm}
          />
        );

      case "Focus":
        return (
          <FocusView
            tasks={tasks}
            loading={loading}
            onToggle={(id) => void toggleTask(id)}
            onAddClick={openTaskForm}
          />
        );

      case "Insights":
        return (
          <InsightsView
            tasks={tasks}
            loading={loading}
          />
        );
    }
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#191B19] text-[#F5F6F1] lg:flex">
      {/* MOBILE MENU BACKDROP */}

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      {/* RESPONSIVE SIDEBAR */}

      <aside
        id="dayflow-navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] max-w-[85vw] flex-col border-r border-white/[0.07] bg-[#21241F] shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:shadow-none lg:transition-[width] ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } ${
          sidebarCollapsed
            ? "lg:w-[84px]"
            : "lg:w-[250px]"
        }`}
      >
        {/* LOGO AND SIDEBAR BUTTONS */}

        <div
          className={`flex items-center border-b border-white/[0.06] p-4 ${
            sidebarCollapsed
              ? "lg:flex-col lg:gap-3"
              : "justify-between"
          }`}
        >
          <button
            type="button"
            onClick={() => navigate("Overview")}
            title="DAYFLOW Overview"
            className="flex min-w-0 items-center gap-3"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#D8FF56] text-2xl font-black text-[#20231D]">
              D
            </span>

            <span
              className={`min-w-0 text-left ${
                sidebarCollapsed ? "lg:hidden" : ""
              }`}
            >
              <span className="block text-lg font-bold tracking-tight">
                DAYFLOW
              </span>
              <span className="block text-[10px] uppercase tracking-[0.12em] text-[#9EA598]">
                Life OS
              </span>
            </span>
          </button>

          {/* MOBILE CLOSE */}

          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xl text-white lg:hidden"
          >
            ×
          </button>

          {/* DESKTOP COLLAPSE */}

          <button
            type="button"
            title={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            aria-label={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            aria-expanded={!sidebarCollapsed}
            onClick={toggleSidebar}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-[#D8FF56] transition hover:bg-white/10 lg:flex"
          >
            {sidebarCollapsed ? "»" : "«"}
          </button>
        </div>

        {/* NAVIGATION */}

        <div
          className={`pt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#788172] ${
            sidebarCollapsed
              ? "lg:hidden"
              : "px-6"
          }`}
        >
          Workspace
        </div>

        <nav
          aria-label="Main navigation"
          className="mt-4 flex-1 space-y-1 overflow-y-auto px-3"
        >
          {navigation.map((item) => {
            const selected = activePage === item.name;

            return (
              <button
                key={item.name}
                type="button"
                title={item.name}
                aria-current={
                  selected ? "page" : undefined
                }
                onClick={() => navigate(item.name)}
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                  sidebarCollapsed
                    ? "lg:justify-center lg:px-2"
                    : ""
                } ${
                  selected
                    ? "bg-[#D8FF56] font-semibold text-[#20231D]"
                    : "text-[#A8B0A1] hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="w-6 shrink-0 text-center text-xl"
                >
                  {item.symbol}
                </span>

                <span
                  className={`min-w-0 ${
                    sidebarCollapsed ? "lg:hidden" : ""
                  }`}
                >
                  <span className="block text-sm">
                    {item.name}
                  </span>

                  <span
                    className={`block text-[11px] ${
                      selected
                        ? "text-[#55613A]"
                        : "text-[#778173]"
                    }`}
                  >
                    {item.description}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* PROGRESS CARD */}

        <div
          className={`p-3 ${
            sidebarCollapsed ? "lg:hidden" : ""
          }`}
        >
          <div className="rounded-[18px] bg-[#30352B] p-4">
            <p className="text-xs text-[#ABB5A2]">
              Your workspace progress
            </p>

            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-semibold">
                {progress}
              </span>
              <span className="text-xl text-[#D8FF56]">
                %
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#D8FF56]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-3 text-xs text-[#99A493]">
              {completed} of {tasks.length} tasks complete
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}

      <div className="min-w-0 flex-1">
        {/* RESPONSIVE HEADER */}

        <header className="border-b border-white/[0.06] bg-[#191B19] px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1450px] flex-wrap items-center gap-3">
            {/* MOBILE HAMBURGER */}

            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="dayflow-navigation"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-[5px] rounded-xl border border-white/10 bg-[#282B27] lg:hidden"
            >
              <span className="h-0.5 w-5 rounded-full bg-[#D8FF56]" />
              <span className="h-0.5 w-5 rounded-full bg-[#D8FF56]" />
              <span className="h-0.5 w-5 rounded-full bg-[#D8FF56]" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#9EA598] sm:text-xs">
                DAYFLOW / {activePage}
              </p>

              <h1 className="mt-1 truncate text-lg font-semibold tracking-tight sm:text-2xl">
                Your workspace
                <span className="text-[#D8FF56]">.</span>
              </h1>
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                onClick={openProjectForm}
                className={`${secondaryButton} flex-1 sm:flex-none`}
              >
                + Project
              </button>

              <button
                type="button"
                onClick={openTaskForm}
                className={`${primaryButton} flex-1 sm:flex-none`}
              >
                + New task
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <div className="mx-auto w-full max-w-[1450px] min-w-0 px-3 py-5 sm:px-6 lg:px-8">
          {/* API ERROR */}

          {error && (
            <div
              role="alert"
              className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#FF817D]/30 bg-[#FF817D]/10 p-4 text-sm text-[#FFB4AE]"
            >
              <span className="min-w-0 break-words">
                {error}
              </span>

              <button
                type="button"
                onClick={() => setError("")}
                className="underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* CREATE TASK FORM */}

          {taskFormOpen && (
            <section className="mb-6 rounded-[22px] border border-[#D8FF56]/20 bg-[#282B27] p-4 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-[#A6AD9B]">
                    Quick capture
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    Create a task
                  </h2>
                </div>

                <button
                  type="button"
                  aria-label="Close task form"
                  onClick={() => setTaskFormOpen(false)}
                  className="text-2xl text-[#A6AD9B]"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={(event) => void createTask(event)}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <label className="space-y-2 sm:col-span-2">
                    <span className="block text-xs text-[#A6AD9B]">
                      Task name
                    </span>

                    <input
                      required
                      maxLength={255}
                      value={taskTitle}
                      onChange={(event) =>
                        setTaskTitle(event.target.value)
                      }
                      placeholder="What needs to be done?"
                      className={inputClass}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="block text-xs text-[#A6AD9B]">
                      Priority
                    </span>

                    <select
                      value={taskPriority}
                      onChange={(event) =>
                        setTaskPriority(
                          event.target.value as Priority
                        )
                      }
                      className={inputClass}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="block text-xs text-[#A6AD9B]">
                      Category
                    </span>

                    <select
                      value={taskCategory}
                      onChange={(event) =>
                        setTaskCategory(event.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="Personal">Personal</option>
                      <option value="Work">Work</option>
                      <option value="Study">Study</option>
                      <option value="Health">Health</option>
                      <option value="Development">
                        Development
                      </option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="block text-xs text-[#A6AD9B]">
                      Due date
                    </span>

                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(event) =>
                        setTaskDueDate(event.target.value)
                      }
                      className={inputClass}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="block text-xs text-[#A6AD9B]">
                      Project (optional)
                    </span>

                    <select
                      value={taskProjectId}
                      onChange={(event) =>
                        setTaskProjectId(event.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">No project</option>

                      {projects.map((project) => (
                        <option
                          key={project.id}
                          value={project.id}
                        >
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={saving}
                    className={primaryButton}
                  >
                    {saving ? "Saving..." : "Save task"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaskFormOpen(false)}
                    className={secondaryButton}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* CREATE PROJECT FORM */}

          {projectFormOpen && (
            <section className="mb-6 rounded-[22px] border border-[#456CF0]/30 bg-[#282B27] p-4 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-[#A6AD9B]">
                    Project management
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    Create a project
                  </h2>
                </div>

                <button
                  type="button"
                  aria-label="Close project form"
                  onClick={() => setProjectFormOpen(false)}
                  className="text-2xl text-[#A6AD9B]"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={(event) =>
                  void createProject(event)
                }
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="block text-xs text-[#A6AD9B]">
                      Project name
                    </span>

                    <input
                      required
                      maxLength={255}
                      value={projectName}
                      onChange={(event) =>
                        setProjectName(event.target.value)
                      }
                      placeholder="Enter project name"
                      className={inputClass}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="block text-xs text-[#A6AD9B]">
                      Deadline (optional)
                    </span>

                    <input
                      type="date"
                      value={projectDueDate}
                      onChange={(event) =>
                        setProjectDueDate(event.target.value)
                      }
                      className={inputClass}
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={saving}
                    className={primaryButton}
                  >
                    {saving
                      ? "Saving..."
                      : "Save project"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setProjectFormOpen(false)
                    }
                    className={secondaryButton}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ACTIVE VIEW */}

          <div className="min-w-0">
            {renderCurrentView()}
          </div>

          <footer className="mt-8 border-t border-white/[0.07] py-5 text-xs text-[#899385]">
            DAYFLOW — Your Personal Life Operating System
          </footer>
        </div>
      </div>
    </main>
  );
}


"use client";

import { useMemo, useState } from "react";

type Priority = "High" | "Medium" | "Low";

type Task = {
  id: number;
  title?: string;
  priority?: Priority;
  done: boolean;
  projectId?: number | null;
};

type Project = {
  id: number;
  name: string;
  createdAt: string;
  dueDate: string | null;
};

type Props = {
  projects: Project[];
  tasks?: Task[];
  loading: boolean;
  onDelete: (id: number) => void;
  onUpdate: (
    id: number,
    data: {
      name?: string;
      dueDate?: string | null;
    }
  ) => void;
  onAddClick: () => void;
};

type Filter =
  | "All"
  | "In progress"
  | "Completed"
  | "Overdue"
  | "No deadline";

type Sort = "Newest" | "Deadline" | "Name";

const projectColors = [
  "#D8FF56",
  "#8EA8FF",
  "#FFB48A",
  "#B8E986",
  "#D8B4FE",
];

const card =
  "min-w-0 rounded-[22px] border border-white/[0.06] bg-[#282B27]";

const inputClass =
  "w-full min-w-0 rounded-xl border border-white/10 bg-[#20231F] px-4 py-3 text-sm text-[#F5F6F1] outline-none focus:border-[#D8FF56]";

function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(value: string | null): string {
  if (!value) return "No deadline";

  const key = value.slice(0, 10);
  const parts = key.split("-").map(Number);

  if (parts.length !== 3) return key;

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return key;

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function progressFor(projectId: number, tasks: Task[]) {
  const linkedTasks = tasks.filter(
    (task) => task.projectId === projectId
  );

  const completedTasks = linkedTasks.filter(
    (task) => task.done
  );

  const progress = linkedTasks.length
    ? Math.round(
        (completedTasks.length / linkedTasks.length) *
          100
      )
    : 0;

  return {
    linkedTasks,
    total: linkedTasks.length,
    completed: completedTasks.length,
    progress,
  };
}

export default function ProjectsView({
  projects,
  tasks = [],
  loading,
  onDelete,
  onUpdate,
  onAddClick,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [sort, setSort] = useState<Sort>("Newest");

  const [editingId, setEditingId] =
    useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDate, setEditingDate] = useState("");

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [expandedIds, setExpandedIds] = useState<
    number[]
  >([]);

  const today = dateKey(new Date());

  const stats = useMemo(() => {
    const completedProjects = projects.filter(
      (project) => {
        const result = progressFor(project.id, tasks);

        return (
          result.total > 0 &&
          result.completed === result.total
        );
      }
    ).length;

    const activeProjects = projects.filter(
      (project) => {
        const result = progressFor(project.id, tasks);

        return (
          result.total > 0 &&
          result.completed < result.total
        );
      }
    ).length;

    const overdueProjects = projects.filter(
      (project) => {
        const due = project.dueDate?.slice(0, 10);

        if (!due || due >= today) return false;

        const result = progressFor(project.id, tasks);

        return (
          result.total === 0 ||
          result.completed < result.total
        );
      }
    ).length;

    return {
      completedProjects,
      activeProjects,
      overdueProjects,
    };
  }, [projects, tasks, today]);

  const visibleProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = projects.filter((project) => {
      if (
        query &&
        !project.name.toLowerCase().includes(query)
      ) {
        return false;
      }

      const result = progressFor(project.id, tasks);
      const due = project.dueDate?.slice(0, 10);

      if (filter === "Completed") {
        return (
          result.total > 0 &&
          result.completed === result.total
        );
      }

      if (filter === "In progress") {
        return (
          result.total > 0 &&
          result.completed < result.total
        );
      }

      if (filter === "Overdue") {
        return (
          !!due &&
          due < today &&
          (result.total === 0 ||
            result.completed < result.total)
        );
      }

      if (filter === "No deadline") {
        return !project.dueDate;
      }

      return true;
    });

    filtered.sort((a, b) => {
      if (sort === "Name") {
        return a.name.localeCompare(b.name);
      }

      if (sort === "Deadline") {
        return (
          (a.dueDate ?? "9999").localeCompare(
            b.dueDate ?? "9999"
          ) || b.id - a.id
        );
      }

      return b.id - a.id;
    });

    return filtered;
  }, [projects, tasks, search, filter, sort, today]);

  function startEditing(project: Project) {
    setDeleteId(null);
    setEditingId(project.id);
    setEditingName(project.name);
    setEditingDate(
      project.dueDate?.slice(0, 10) ?? ""
    );
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName("");
    setEditingDate("");
  }

  function saveEditing() {
    if (
      editingId === null ||
      !editingName.trim()
    ) {
      return;
    }

    onUpdate(editingId, {
      name: editingName.trim(),
      dueDate: editingDate || null,
    });

    cancelEditing();
  }

  function toggleExpanded(id: number) {
    setExpandedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function clearFilters() {
    setSearch("");
    setFilter("All");
    setSort("Newest");
  }

  return (
    <div className="min-w-0 space-y-4 pb-8 text-[#F5F6F1] sm:space-y-5">
      {/* HEADER */}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#A6AD9B] sm:text-xs">
            Your workspace
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Your Projects
            <span className="text-[#D8FF56]">.</span>
          </h2>

          <p className="mt-2 text-sm text-[#9EA598]">
            Organize goals, track deadlines, and monitor
            progress.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddClick}
          className="w-full rounded-xl bg-[#D8FF56] px-5 py-3 text-sm font-semibold text-[#20231D] transition hover:bg-[#E8FF9B] sm:w-auto"
        >
          + New project
        </button>
      </header>

      {/* STATS */}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          title="Total projects"
          value={projects.length}
          loading={loading}
        />

        <StatCard
          title="In progress"
          value={stats.activeProjects}
          loading={loading}
        />

        <StatCard
          title="Completed"
          value={stats.completedProjects}
          loading={loading}
        />

        <StatCard
          title="Overdue"
          value={stats.overdueProjects}
          loading={loading}
          blue
        />
      </div>

      {/* SEARCH AND FILTERS */}

      <section className={`${card} p-4 sm:p-5`}>
        <label
          htmlFor="dayflow-project-search"
          className="mb-2 block text-xs text-[#A6AD9B]"
        >
          Search projects
        </label>

        <input
          id="dayflow-project-search"
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search by project name..."
          className={inputClass}
        />

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {(
            [
              "All",
              "In progress",
              "Completed",
              "Overdue",
              "No deadline",
            ] as Filter[]
          ).map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
              className={`min-h-10 shrink-0 rounded-xl px-4 py-2 text-sm transition ${
                filter === item
                  ? "bg-[#D8FF56] font-semibold text-[#20231D]"
                  : "bg-[#20231F] text-[#A6AD9B] hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#A6AD9B]">
            Showing {visibleProjects.length} of{" "}
            {projects.length} projects
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-10 text-sm text-[#D8FF56]"
            >
              Clear
            </button>

            <select
              aria-label="Sort projects"
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as Sort)
              }
              className="min-h-10 rounded-xl border border-white/10 bg-[#20231F] px-3 text-sm text-white"
            >
              <option value="Newest">Newest</option>
              <option value="Deadline">Deadline</option>
              <option value="Name">Name</option>
            </select>
          </div>
        </div>
      </section>

      {/* PROJECT GRID */}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-[22px] bg-[#282B27]"
            />
          ))}
        </div>
      ) : visibleProjects.length === 0 ? (
        <section className={`${card} p-8 text-center`}>
          <p className="text-sm text-[#A6AD9B]">
            {projects.length === 0
              ? "No projects yet. Create your first project."
              : "No projects match your filters."}
          </p>

          <button
            type="button"
            onClick={
              projects.length === 0
                ? onAddClick
                : clearFilters
            }
            className="mt-4 min-h-10 text-sm font-semibold text-[#D8FF56]"
          >
            {projects.length === 0
              ? "+ Create project"
              : "Clear filters"}
          </button>
        </section>
      ) : (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProjects.map((project) => {
            const result = progressFor(project.id, tasks);

            const overdue =
              !!project.dueDate &&
              project.dueDate.slice(0, 10) < today &&
              result.progress < 100;

            const isEditing =
              editingId === project.id;
            const isDeleting =
              deleteId === project.id;
            const expanded =
              expandedIds.includes(project.id);

            return (
              <article
                key={project.id}
                className={`${card} flex min-h-64 flex-col p-4 sm:p-5`}
              >
                {isEditing ? (
                  /* EDIT FORM */
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      saveEditing();
                    }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold">
                      Edit Project
                    </h3>

                    <label className="block">
                      <span className="mb-2 block text-xs text-[#A6AD9B]">
                        Project name
                      </span>

                      <input
                        required
                        autoFocus
                        maxLength={255}
                        value={editingName}
                        onChange={(event) =>
                          setEditingName(
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs text-[#A6AD9B]">
                        Deadline
                      </span>

                      <input
                        type="date"
                        value={editingDate}
                        onChange={(event) =>
                          setEditingDate(
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="submit"
                        className="min-h-11 rounded-xl bg-[#D8FF56] px-3 text-sm font-semibold text-[#20231D]"
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="min-h-11 rounded-xl border border-white/10 px-3 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : isDeleting ? (
                  /* DELETE CONFIRMATION */
                  <div className="flex flex-1 flex-col justify-between gap-5">
                    <div>
                      <h3 className="text-lg font-semibold text-[#FF9F9B]">
                        Delete project?
                      </h3>

                      <p className="mt-3 break-words text-sm">
                        {project.name}
                      </p>

                      <p className="mt-3 text-xs text-[#A6AD9B]">
                        This action cannot be undone.
                        Depending on your database rules,
                        linked tasks may prevent deletion.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(project.id);
                          setDeleteId(null);
                        }}
                        className="min-h-11 rounded-xl bg-[#FF817D]/15 px-3 text-sm font-semibold text-[#FF9F9B]"
                      >
                        Delete
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteId(null)}
                        className="min-h-11 rounded-xl border border-white/10 px-3 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* PROJECT TITLE */}

                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-[#20231D]"
                        style={{
                          backgroundColor:
                            projectColors[
                              Math.abs(project.id) %
                                projectColors.length
                            ],
                        }}
                      >
                        {project.name
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <span
                        className={`max-w-[60%] rounded-full px-3 py-1.5 text-right text-[11px] ${
                          overdue
                            ? "bg-[#FF817D]/15 text-[#FF9F9B]"
                            : "bg-white/5 text-[#B8C0B2]"
                        }`}
                      >
                        {overdue ? "Overdue · " : ""}
                        {formatDate(project.dueDate)}
                      </span>
                    </div>

                    <h3 className="mt-5 break-words text-lg font-semibold">
                      {project.name}
                    </h3>

                    <p className="mt-2 text-xs text-[#A6AD9B]">
                      {result.completed} of {result.total}{" "}
                      tasks completed
                    </p>

                    {/* PROGRESS */}

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="text-xs text-[#A6AD9B]">
                        Progress
                      </span>

                      <strong className="text-sm text-[#D8FF56]">
                        {result.progress}%
                      </strong>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#41463E]">
                      <div
                        className="h-full rounded-full bg-[#D8FF56] transition-all"
                        style={{
                          width: `${result.progress}%`,
                        }}
                      />
                    </div>

                    {/* EXPANDABLE LINKED TASKS */}

                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() =>
                        toggleExpanded(project.id)
                      }
                      className="mt-5 flex min-h-11 w-full items-center justify-between rounded-xl bg-[#333730] px-3 text-left text-sm text-[#D8FF56]"
                    >
                      <span>
                        View linked tasks ({result.total})
                      </span>

                      <span aria-hidden="true">
                        {expanded ? "−" : "+"}
                      </span>
                    </button>

                    {expanded && (
                      <div className="mt-3 space-y-2">
                        {result.linkedTasks.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-[#A6AD9B]">
                            No tasks linked to this project
                            yet.
                          </p>
                        ) : (
                          result.linkedTasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex min-w-0 items-start gap-2 rounded-xl bg-[#333730] p-3"
                            >
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                                  task.done
                                    ? "border-[#D8FF56] bg-[#D8FF56] text-[#20231D]"
                                    : "border-[#858F7C]"
                                }`}
                              >
                                {task.done ? "✓" : ""}
                              </span>

                              <p
                                className={`min-w-0 flex-1 break-words text-xs ${
                                  task.done
                                    ? "text-[#9EA598] line-through"
                                    : "text-[#F5F6F1]"
                                }`}
                              >
                                {task.title ||
                                  `Task #${task.id}`}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* ACTIONS */}

                    <div className="mt-auto flex justify-end gap-2 border-t border-white/[0.06] pt-4">
                      <button
                        type="button"
                        onClick={() => startEditing(project)}
                        className="min-h-10 rounded-xl bg-[#D8FF56]/10 px-4 text-sm font-medium text-[#D8FF56]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteId(project.id)
                        }
                        className="min-h-10 rounded-xl bg-[#FF817D]/10 px-4 text-sm font-medium text-[#FF9F9B]"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  loading,
  blue = false,
}: {
  title: string;
  value: number;
  loading: boolean;
  blue?: boolean;
}) {
  return (
    <section
      className={`min-w-0 rounded-[20px] p-4 sm:p-5 ${
        blue
          ? "bg-[#456CF0]"
          : "border border-white/[0.06] bg-[#282B27]"
      }`}
    >
      <p
        className={`text-xs sm:text-sm ${
          blue ? "text-white/75" : "text-[#A6AD9B]"
        }`}
      >
        {title}
      </p>

      <p className="mt-3 text-3xl font-semibold sm:mt-4 sm:text-4xl">
        {loading ? "—" : value}
      </p>
    </section>
  );
}

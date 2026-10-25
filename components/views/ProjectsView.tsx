"use client";

import { useMemo, useState } from "react";

type Project = {
  id: number;
  name: string;
  createdAt: string;
  dueDate: string | null;
};

type Props = {
  projects: Project[];
  loading: boolean;
  onDelete: (id: number) => void;
  onUpdate: (
    id: number,
    data: { name?: string; dueDate?: string | null }
  ) => void;
  onAddClick: () => void;
};

type FilterTab = "All" | "Active" | "Overdue" | "No deadline";
type SortMode = "Newest" | "Deadline" | "Name";

type Urgency = "overdue" | "critical" | "soon" | "upcoming" | "none";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const target = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

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
  {
    badge: string;
    ring: string;
    label: (d: number) => string;
  }
> = {
  overdue: {
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    ring: "border-rose-500/30",
    label: (d) => `${Math.abs(d)}d overdue`,
  },
  critical: {
    badge:
      "bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse",
    ring: "border-rose-500/40",
    label: (d) => (d === 0 ? "Due today" : "Due tomorrow"),
  },
  soon: {
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    ring: "border-amber-500/30",
    label: (d) => `${d} days left`,
  },
  upcoming: {
    badge: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
    ring: "border-white/10",
    label: (d) => `${d} days left`,
  },
  none: {
    badge: "bg-white/5 text-gray-400 border-white/10",
    ring: "border-white/10",
    label: () => "No deadline",
  },
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toInputDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

export default function ProjectsView({
  projects,
  loading,
  onDelete,
  onUpdate,
  onAddClick,
}: Props) {
  const [filterTab, setFilterTab] = useState<FilterTab>("All");
  const [sortMode, setSortMode] = useState<SortMode>("Newest");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<
    number | null
  >(null);

  const counts = useMemo(() => {
    const overdue = projects.filter((p) => {
      const d = daysUntil(p.dueDate);
      return d !== null && d < 0;
    }).length;
    const noDeadline = projects.filter((p) => !p.dueDate).length;
    const active = projects.length - overdue;
    return { all: projects.length, active, overdue, noDeadline };
  }, [projects]);

  const visibleProjects = useMemo(() => {
    let result = [...projects];

    if (filterTab === "Active") {
      result = result.filter((p) => {
        const d = daysUntil(p.dueDate);
        return d === null || d >= 0;
      });
    } else if (filterTab === "Overdue") {
      result = result.filter((p) => {
        const d = daysUntil(p.dueDate);
        return d !== null && d < 0;
      });
    } else if (filterTab === "No deadline") {
      result = result.filter((p) => !p.dueDate);
    }

    if (sortMode === "Newest") {
      result.sort((a, b) => b.id - a.id);
    } else if (sortMode === "Deadline") {
      result.sort((a, b) => {
        const da = daysUntil(a.dueDate);
        const db = daysUntil(b.dueDate);
        if (da === null && db === null) return 0;
        if (da === null) return 1;
        if (db === null) return -1;
        return da - db;
      });
    } else if (sortMode === "Name") {
      result.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
    }

    return result;
  }, [projects, filterTab, sortMode]);

  function startEdit(project: Project) {
    setEditingId(project.id);
    setEditingName(project.name);
    setEditingDueDate(toInputDate(project.dueDate));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
    setEditingDueDate("");
  }

  function saveEdit() {
    if (editingId === null || !editingName.trim()) return;
    onUpdate(editingId, {
      name: editingName.trim(),
      dueDate: editingDueDate || null,
    });
    setEditingId(null);
    setEditingName("");
    setEditingDueDate("");
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Your Projects
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {counts.all} total · {counts.active} active · {counts.overdue}{" "}
            overdue
          </p>
        </div>

        <button
          onClick={onAddClick}
          className="rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold transition hover:bg-violet-400"
        >
          + New project
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#121620] p-4">
        <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1">
          {(["All", "Active", "Overdue", "No deadline"] as FilterTab[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`rounded-lg px-4 py-1.5 text-sm transition ${
                  filterTab === tab
                    ? "bg-violet-500/20 font-medium text-violet-200"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort by</span>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="rounded-xl border border-white/10 bg-[#0b0d12] px-3 py-2 text-sm outline-none focus:border-violet-400"
          >
            <option value="Newest">Newest</option>
            <option value="Deadline">Deadline</option>
            <option value="Name">Name</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl bg-white/[0.03]"
            />
          ))}
        </div>
      ) : visibleProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#121620] p-12 text-center">
          <p className="text-sm text-gray-400">
            {projects.length === 0
              ? "No projects yet."
              : "No projects match this filter."}
          </p>
          <button
            onClick={onAddClick}
            className="mt-3 text-sm text-violet-300 transition hover:text-violet-200"
          >
            + Create a project →
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProjects.map((project) => {
            const d = daysUntil(project.dueDate);
            const u = getUrgency(d);
            const styles = urgencyStyles[u];
            const isEditing = editingId === project.id;
            const isConfirmingDelete = confirmingDeleteId === project.id;

            return (
              <div
                key={project.id}
                className={`flex flex-col rounded-2xl border bg-[#121620] p-5 transition hover:bg-white/[0.02] ${styles.ring}`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      placeholder="Project name"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-400"
                      autoFocus
                    />
                    <input
                      type="date"
                      value={editingDueDate}
                      onChange={(e) => setEditingDueDate(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="flex-1 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/25"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : isConfirmingDelete ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-200">
                      Delete <span className="font-medium">{project.name}</span>?
                    </p>
                    <p className="text-xs text-gray-500">
                      This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onDelete(project.id);
                          setConfirmingDeleteId(null);
                        }}
                        className="flex-1 rounded-lg bg-rose-500/15 px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/25"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmingDeleteId(null)}
                        className="flex-1 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 break-words text-base font-semibold text-gray-100">
                        {project.name}
                      </p>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium ${styles.badge}`}
                      >
                        {d !== null ? styles.label(d) : "No deadline"}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-gray-500">
                      {project.dueDate
                        ? `Deadline · ${formatDate(project.dueDate)}`
                        : "No deadline set"}
                    </p>

                    <div className="mt-auto flex items-center justify-end gap-2 pt-5">
                      <button
                        onClick={() => startEdit(project)}
                        aria-label="Edit project"
                        className="rounded-lg px-2 py-1 text-sm text-gray-400 transition hover:bg-white/5 hover:text-blue-400"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setConfirmingDeleteId(project.id)}
                        aria-label="Delete project"
                        className="rounded-lg px-2 py-1 text-sm text-gray-400 transition hover:bg-white/5 hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
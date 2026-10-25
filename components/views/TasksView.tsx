"use client";

import { useMemo, useState } from "react";

type Task = {
  id: number;
  title: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  done: boolean;
  completedAt: string | null;
  dueDate: string | null;
};

type Props = {
  tasks: Task[];
  loading: boolean;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (
    id: number,
    title: string,
    priority: "High" | "Medium" | "Low"
  ) => void;
  onAddClick: () => void;
};

type FilterTab = "All" | "Active" | "Done";
type SortMode = "Newest" | "Due date" | "Priority" | "Title";

const priorityRank: Record<string, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function TasksView({
  tasks,
  loading,
  onToggle,
  onDelete,
  onEdit,
  onAddClick,
}: Props) {
  const [filterTab, setFilterTab] = useState<FilterTab>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [sortMode, setSortMode] = useState<SortMode>("Newest");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingPriority, setEditingPriority] = useState<
    "High" | "Medium" | "Low"
  >("Medium");

  const categories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => set.add(t.category));
    return ["All", ...Array.from(set)];
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    let result = [...tasks];

    if (filterTab === "Active") {
      result = result.filter((t) => !t.done);
    } else if (filterTab === "Done") {
      result = result.filter((t) => t.done);
    }

    if (categoryFilter !== "All") {
      result = result.filter((t) => t.category === categoryFilter);
    }

    if (priorityFilter !== "All") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    if (sortMode === "Newest") {
      result.sort((a, b) => b.id - a.id);
    } else if (sortMode === "Due date") {
      result.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return (
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
      });
    } else if (sortMode === "Priority") {
      result.sort(
        (a, b) => priorityRank[a.priority] - priorityRank[b.priority]
      );
    } else if (sortMode === "Title") {
      result.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      );
    }

    return result;
  }, [tasks, filterTab, categoryFilter, priorityFilter, sortMode]);

  const counts = useMemo(() => {
    return {
      all: tasks.length,
      active: tasks.filter((t) => !t.done).length,
      done: tasks.filter((t) => t.done).length,
    };
  }, [tasks]);

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditingTitle(task.title);
    setEditingPriority(task.priority);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingTitle("");
  }

  function saveEdit() {
    if (editingId === null || !editingTitle.trim()) return;
    onEdit(editingId, editingTitle.trim(), editingPriority);
    setEditingId(null);
    setEditingTitle("");
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">My Tasks</h2>
          <p className="mt-1 text-sm text-gray-500">
            {counts.all} total · {counts.active} active · {counts.done} done
          </p>
        </div>

        <button
          onClick={onAddClick}
          className="rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold transition hover:bg-violet-400"
        >
          + New task
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#121620] p-4">
        <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1">
          {(["All", "Active", "Done"] as FilterTab[]).map((tab) => (
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
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#0b0d12] px-3 py-2 text-sm outline-none focus:border-violet-400"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "All categories" : c}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#0b0d12] px-3 py-2 text-sm outline-none focus:border-violet-400"
        >
          <option value="All">All priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort by</span>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="rounded-xl border border-white/10 bg-[#0b0d12] px-3 py-2 text-sm outline-none focus:border-violet-400"
          >
            <option value="Newest">Newest</option>
            <option value="Due date">Due date</option>
            <option value="Priority">Priority</option>
            <option value="Title">Title</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121620] p-5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-white/[0.03]"
              />
            ))}
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
            <p className="text-sm text-gray-400">
              {tasks.length === 0
                ? "No tasks yet."
                : "No tasks match your filters."}
            </p>
            <button
              onClick={onAddClick}
              className="mt-3 text-sm text-violet-300 transition hover:text-violet-200"
            >
              + Create a task →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleTasks.map((task) => {
              const d = daysUntil(task.dueDate);
              const overdue = d !== null && d < 0 && !task.done;
              const dueSoon = d !== null && d >= 0 && d <= 2 && !task.done;

              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                    overdue
                      ? "border-rose-500/30 bg-rose-500/[0.04]"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <button
                    onClick={() => onToggle(task.id)}
                    aria-label={
                      task.done ? "Mark incomplete" : "Complete task"
                    }
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                      task.done
                        ? "border-violet-400 bg-violet-400 text-[#0b0d12]"
                        : "border-gray-600 hover:border-violet-400"
                    }`}
                  >
                    {task.done && <span className="text-xs">✓</span>}
                  </button>

                  <div className="min-w-0 flex-1">
                    {editingId === task.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-violet-400"
                          autoFocus
                        />
                        <select
                          value={editingPriority}
                          onChange={(e) =>
                            setEditingPriority(
                              e.target.value as
                                | "High"
                                | "Medium"
                                | "Low"
                            )
                          }
                          className="rounded-lg border border-white/10 bg-[#171b26] px-3 py-1.5 text-sm text-white outline-none"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                        <button
                          onClick={saveEdit}
                          className="text-sm text-emerald-400 hover:text-emerald-300"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-sm text-gray-400 hover:text-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <p
                          className={`break-words text-sm font-medium ${
                            task.done
                              ? "text-gray-500 line-through"
                              : "text-gray-200"
                          }`}
                        >
                          {task.title}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span>{task.category}</span>
                          {task.dueDate && (
                            <>
                              <span>·</span>
                              <span
                                className={
                                  overdue
                                    ? "text-rose-300"
                                    : dueSoon
                                    ? "text-amber-300"
                                    : ""
                                }
                              >
                                {overdue
                                  ? `Overdue ${Math.abs(d!)}d`
                                  : d === 0
                                  ? "Due today"
                                  : d === 1
                                  ? "Due tomorrow"
                                  : `Due in ${d}d`}
                              </span>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <span
                    className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium sm:block ${
                      task.priority === "High"
                        ? "bg-rose-400/10 text-rose-300"
                        : task.priority === "Medium"
                        ? "bg-amber-400/10 text-amber-300"
                        : "bg-emerald-400/10 text-emerald-300"
                    }`}
                  >
                    {task.priority}
                  </span>

                  <button
                    onClick={() => startEdit(task)}
                    aria-label="Edit task"
                    className="shrink-0 text-gray-400 transition hover:text-blue-400"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => onDelete(task.id)}
                    aria-label="Delete task"
                    className="shrink-0 text-gray-400 transition hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
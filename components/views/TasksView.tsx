
"use client";

import { useMemo, useState } from "react";

type Priority = "High" | "Medium" | "Low";
type Status = "All" | "Active" | "Done";
type Sort = "Newest" | "Due date" | "Priority" | "Title";

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

type Props = {
  tasks: Task[];
  loading: boolean;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (
    id: number,
    title: string,
    priority: Priority
  ) => void;
  onAddClick: () => void;
};

const card =
  "min-w-0 rounded-[22px] border border-white/[0.06] bg-[#282B27]";

const inputClass =
  "min-w-0 w-full rounded-xl border border-white/10 bg-[#20231F] px-3 py-3 text-sm text-[#F5F6F1] outline-none focus:border-[#D8FF56]";

const priorityRank: Record<Priority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

const priorityStyle: Record<Priority, string> = {
  High: "bg-[#FF817D]/15 text-[#FF9F9B]",
  Medium: "bg-[#FFD37E]/15 text-[#FFD37E]",
  Low: "bg-[#B8E986]/15 text-[#B8E986]",
};

function todayKey(): string {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getDueLabel(task: Task): string {
  if (!task.dueDate) return "";

  const due = task.dueDate.slice(0, 10);

  if (task.done) return `Due ${due}`;
  if (due < todayKey()) return `Overdue · ${due}`;
  if (due === todayKey()) return "Due today";

  return `Due ${due}`;
}

export default function TasksView({
  tasks,
  loading,
  onToggle,
  onDelete,
  onEdit,
  onAddClick,
}: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("All");
  const [category, setCategory] = useState("All");
  const [priority, setPriority] = useState("All");
  const [sort, setSort] = useState<Sort>("Newest");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [editingTitle, setEditingTitle] = useState("");
  const [editingPriority, setEditingPriority] =
    useState<Priority>("Medium");

  const completed = tasks.filter((task) => task.done).length;
  const active = tasks.length - completed;

  const completionRate = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const highPriority = tasks.filter(
    (task) => !task.done && task.priority === "High"
  ).length;

  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(tasks.map((task) => task.category))
      ).sort(),
    ];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = tasks.filter((task) => {
      const matchesSearch =
        !query ||
        `${task.title} ${task.category}`
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        status === "All" ||
        (status === "Active" && !task.done) ||
        (status === "Done" && task.done);

      const matchesCategory =
        category === "All" || task.category === category;

      const matchesPriority =
        priority === "All" || task.priority === priority;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesPriority
      );
    });

    result.sort((a, b) => {
      if (sort === "Priority") {
        return (
          priorityRank[a.priority] -
            priorityRank[b.priority] ||
          b.id - a.id
        );
      }

      if (sort === "Title") {
        return a.title.localeCompare(b.title);
      }

      if (sort === "Due date") {
        return (
          (a.dueDate ?? "9999").localeCompare(
            b.dueDate ?? "9999"
          ) ||
          b.id - a.id
        );
      }

      return b.id - a.id;
    });

    return result;
  }, [tasks, search, status, category, priority, sort]);

  function startEditing(task: Task) {
    setEditingId(task.id);
    setEditingTitle(task.title);
    setEditingPriority(task.priority);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingTitle("");
  }

  function saveEditing() {
    if (editingId === null || !editingTitle.trim()) {
      return;
    }

    onEdit(
      editingId,
      editingTitle.trim(),
      editingPriority
    );

    cancelEditing();
  }

  function clearFilters() {
    setSearch("");
    setStatus("All");
    setCategory("All");
    setPriority("All");
    setSort("Newest");
  }

  return (
    <div className="min-w-0 space-y-4 pb-8 text-[#F5F6F1] sm:space-y-5">
      {/* PAGE HEADER */}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#A6AD9B] sm:text-xs">
            Your workspace
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            My Tasks
            <span className="text-[#D8FF56]">.</span>
          </h2>

          <p className="mt-2 text-sm text-[#9EA598]">
            Search, organize, and complete your work.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddClick}
          className="w-full rounded-xl bg-[#D8FF56] px-5 py-3 text-sm font-semibold text-[#20231D] transition hover:bg-[#E8FF9B] sm:w-auto"
        >
          + New task
        </button>
      </header>

      {/* RESPONSIVE STATISTICS */}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          title="Total tasks"
          value={tasks.length}
          note="Everything you're tracking"
          loading={loading}
        />

        <StatCard
          title="In progress"
          value={active}
          note="Unfinished tasks"
          loading={loading}
        />

        <StatCard
          title="High priority"
          value={highPriority}
          note="Important open tasks"
          loading={loading}
        />

        <section className="min-w-0 rounded-[20px] bg-[#D8FF56] p-4 text-[#20231D] sm:p-5">
          <p className="text-xs text-[#4F593A] sm:text-sm">
            Completed
          </p>

          <p className="mt-3 text-3xl font-semibold sm:mt-4 sm:text-4xl">
            {loading ? "—" : completed}
          </p>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/15">
            <div
              className="h-full rounded-full bg-[#20231D] transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>

          <p className="mt-2 text-[11px] text-[#4F593A] sm:text-xs">
            {completionRate}% complete
          </p>
        </section>
      </div>

      {/* SEARCH AND FILTERS */}

      <section className={`${card} p-4 sm:p-5`}>
        <label
          htmlFor="dayflow-task-search"
          className="mb-2 block text-xs font-medium text-[#A6AD9B]"
        >
          Search tasks
        </label>

        <input
          id="dayflow-task-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search title or category..."
          className={inputClass}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {(["All", "Active", "Done"] as Status[]).map(
            (item) => (
              <button
                type="button"
                key={item}
                onClick={() => setStatus(item)}
                aria-pressed={status === item}
                className={`min-h-10 rounded-xl px-4 py-2 text-sm transition ${
                  status === item
                    ? "bg-[#D8FF56] font-semibold text-[#20231D]"
                    : "bg-[#20231F] text-[#A6AD9B] hover:text-white"
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <label className="min-w-0">
            <span className="mb-2 block text-xs text-[#A6AD9B]">
              Category
            </span>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className={inputClass}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "All"
                    ? "All categories"
                    : item}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-0">
            <span className="mb-2 block text-xs text-[#A6AD9B]">
              Priority
            </span>

            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value)
              }
              className={inputClass}
            >
              <option value="All">All priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>

          <label className="col-span-2 min-w-0 lg:col-span-1">
            <span className="mb-2 block text-xs text-[#A6AD9B]">
              Sort by
            </span>

            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as Sort)
              }
              className={inputClass}
            >
              <option value="Newest">Newest first</option>
              <option value="Due date">Due date</option>
              <option value="Priority">Priority</option>
              <option value="Title">Title</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-[#A6AD9B]">
            {filteredTasks.length} matching tasks
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="min-h-10 px-2 text-sm font-medium text-[#D8FF56]"
          >
            Clear filters
          </button>
        </div>
      </section>

      {/* TASK LIST */}

      <section className={`${card} p-4 sm:p-5`}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold sm:text-xl">
              Task List
            </h3>

            <p className="mt-1 text-xs text-[#A6AD9B] sm:text-sm">
              {filteredTasks.length} of {tasks.length} tasks
            </p>
          </div>

          <span className="rounded-full bg-[#D8FF56]/10 px-3 py-1.5 text-xs text-[#D8FF56]">
            {active} pending
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-xl bg-white/5"
              />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-6 text-center sm:p-10">
            <p className="text-sm text-[#A6AD9B]">
              {tasks.length === 0
                ? "No tasks yet. Add your first task."
                : "No tasks match these filters."}
            </p>

            <button
              type="button"
              onClick={
                tasks.length === 0
                  ? onAddClick
                  : clearFilters
              }
              className="mt-4 min-h-10 px-3 text-sm font-semibold text-[#D8FF56]"
            >
              {tasks.length === 0
                ? "+ Create task"
                : "Clear filters"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isEditing = editingId === task.id;
              const dueLabel = getDueLabel(task);
              const overdue =
                !task.done &&
                !!task.dueDate &&
                task.dueDate.slice(0, 10) < todayKey();

              return (
                <article
                  key={task.id}
                  className="min-w-0 rounded-2xl border border-white/[0.05] bg-[#333730] p-3 sm:p-4"
                >
                  {isEditing ? (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveEditing();
                      }}
                      className="space-y-3"
                    >
                      <label className="block">
                        <span className="mb-2 block text-xs text-[#A6AD9B]">
                          Task title
                        </span>

                        <input
                          autoFocus
                          required
                          maxLength={255}
                          value={editingTitle}
                          onChange={(event) =>
                            setEditingTitle(
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs text-[#A6AD9B]">
                          Priority
                        </span>

                        <select
                          value={editingPriority}
                          onChange={(event) =>
                            setEditingPriority(
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

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="submit"
                          className="min-h-11 rounded-xl bg-[#D8FF56] px-4 py-2 text-sm font-semibold text-[#20231D]"
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="min-h-11 rounded-xl border border-white/10 px-4 py-2 text-sm text-[#D7DECF]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex min-w-0 items-start gap-3">
                        <button
                          type="button"
                          aria-label={
                            task.done
                              ? `Mark ${task.title} incomplete`
                              : `Complete ${task.title}`
                          }
                          onClick={() => onToggle(task.id)}
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm transition ${
                            task.done
                              ? "border-[#D8FF56] bg-[#D8FF56] text-[#20231D]"
                              : "border-[#858F7C] hover:border-[#D8FF56]"
                          }`}
                        >
                          {task.done ? "✓" : ""}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`break-words text-sm font-semibold sm:text-base ${
                              task.done
                                ? "text-[#9DA596] line-through"
                                : "text-white"
                            }`}
                          >
                            {task.title}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-[#B6BFB0]">
                              {task.category}
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] ${priorityStyle[task.priority]}`}
                            >
                              {task.priority}
                            </span>

                            {dueLabel && (
                              <span
                                className={`text-xs ${
                                  overdue
                                    ? "text-[#FF9F9B]"
                                    : "text-[#A6AD9B]"
                                }`}
                              >
                                {dueLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/[0.06] pt-3">
                        <button
                          type="button"
                          onClick={() => startEditing(task)}
                          className="min-h-10 rounded-xl bg-[#D8FF56]/10 px-4 py-2 text-sm font-medium text-[#D8FF56] transition hover:bg-[#D8FF56]/20"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(task.id)}
                          className="min-h-10 rounded-xl bg-[#FF817D]/10 px-4 py-2 text-sm font-medium text-[#FF9F9B] transition hover:bg-[#FF817D]/20"
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
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  note,
  loading,
}: {
  title: string;
  value: number;
  note: string;
  loading: boolean;
}) {
  return (
    <section className={`${card} p-4 sm:p-5`}>
      <p className="text-xs text-[#A6AD9B] sm:text-sm">
        {title}
      </p>

      <p className="mt-3 text-3xl font-semibold sm:mt-4 sm:text-4xl">
        {loading ? "—" : value}
      </p>

      <p className="mt-2 text-[11px] text-[#929B8D] sm:text-xs">
        {note}
      </p>
    </section>
  );
}

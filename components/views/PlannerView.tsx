"use client";

import { useMemo } from "react";

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
  onAddClick: () => void;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date) {
  const x = startOfDay(d);
  return x.toISOString().slice(0, 10);
}

function daysFromToday(iso: string) {
  const d = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  return Math.round(
    (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function formatDayLabel(d: Date, offset: number) {
  if (offset === 0) return "Today";
  if (offset === 1) return "Tomorrow";
  if (offset === -1) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function PlannerView({
  tasks,
  loading,
  onToggle,
  onAddClick,
}: Props) {
  const grouped = useMemo(() => {
    const openTasks = tasks.filter((t) => !t.done);

    const overdue: Task[] = [];
    const days: Record<string, Task[]> = {};
    const noDue: Task[] = [];

    for (const t of openTasks) {
      if (!t.dueDate) {
        noDue.push(t);
        continue;
      }
      const offset = daysFromToday(t.dueDate);
      if (offset < 0) {
        overdue.push(t);
      } else if (offset <= 6) {
        const key = dayKey(new Date(t.dueDate));
        if (!days[key]) days[key] = [];
        days[key].push(t);
      }
    }

    const today = startOfDay(new Date());
    const dayBuckets: {
      key: string;
      label: string;
      date: Date;
      offset: number;
      tasks: Task[];
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const key = dayKey(d);
      dayBuckets.push({
        key,
        label: formatDayLabel(d, i),
        date: d,
        offset: i,
        tasks: days[key] || [],
      });
    }

    return { overdue, dayBuckets, noDue };
  }, [tasks]);

  const totalOpen = tasks.filter((t) => !t.done).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Planner</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your week at a glance · {totalOpen} open task
            {totalOpen === 1 ? "" : "s"}
          </p>
        </div>

        <button
          onClick={onAddClick}
          className="rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold transition hover:bg-violet-400"
        >
          + New task
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl bg-white/[0.03]"
            />
          ))}
        </div>
      ) : totalOpen === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#121620] p-12 text-center">
          <p className="text-sm text-gray-400">
            Nothing on the schedule. You&apos;re all caught up.
          </p>
          <button
            onClick={onAddClick}
            className="mt-3 text-sm text-violet-300 transition hover:text-violet-200"
          >
            + Add a task →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.overdue.length > 0 && (
            <PlannerSection
              title="Overdue"
              subtitle={`${grouped.overdue.length} task${
                grouped.overdue.length === 1 ? "" : "s"
              } past their due date`}
              accent="rose"
              tasks={grouped.overdue}
              onToggle={onToggle}
            />
          )}

          {grouped.dayBuckets.map((bucket) => (
            <PlannerSection
              key={bucket.key}
              title={bucket.label}
              subtitle={bucket.date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}
              accent={bucket.offset === 0 ? "violet" : "default"}
              tasks={bucket.tasks}
              onToggle={onToggle}
              emptyMessage={
                bucket.offset === 0
                  ? "Nothing scheduled for today."
                  : "No tasks due this day."
              }
            />
          ))}

          {grouped.noDue.length > 0 && (
            <PlannerSection
              title="No due date"
              subtitle={`${grouped.noDue.length} task${
                grouped.noDue.length === 1 ? "" : "s"
              } without a deadline`}
              accent="default"
              tasks={grouped.noDue}
              onToggle={onToggle}
            />
          )}
        </div>
      )}
    </div>
  );
}

type Accent = "rose" | "violet" | "default";

function PlannerSection({
  title,
  subtitle,
  accent,
  tasks,
  onToggle,
  emptyMessage,
}: {
  title: string;
  subtitle: string;
  accent: Accent;
  tasks: Task[];
  onToggle: (id: number) => void;
  emptyMessage?: string;
}) {
  const accentClasses: Record<
    Accent,
    { dot: string; border: string; title: string }
  > = {
    rose: {
      dot: "bg-rose-400",
      border: "border-rose-500/20",
      title: "text-rose-200",
    },
    violet: {
      dot: "bg-violet-400",
      border: "border-violet-500/30",
      title: "text-violet-200",
    },
    default: {
      dot: "bg-gray-500",
      border: "border-white/10",
      title: "text-gray-200",
    },
  };

  const a = accentClasses[accent];

  return (
    <section
      className={`rounded-2xl border bg-[#121620] p-5 ${a.border}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.dot}`} />
          <div>
            <h3 className={`text-lg font-semibold ${a.title}`}>{title}</h3>
            <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        {tasks.length > 0 && (
          <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-gray-400">
            {tasks.length}
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-gray-500">
          {emptyMessage ?? "Nothing here."}
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:bg-white/[0.04]"
            >
              <button
                onClick={() => onToggle(task.id)}
                aria-label="Complete task"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-600 transition hover:border-violet-400"
              />

              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium text-gray-200">
                  {task.title}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {task.category}
                </p>
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
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
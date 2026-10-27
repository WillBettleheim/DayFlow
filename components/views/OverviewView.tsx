
"use client";

import { useMemo } from "react";

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

type Props = {
  tasks: Task[];
  projects: Project[];
  loading: boolean;
  activeNav: string;
  completed: number;
  progress: number;
  remaining: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  weeklyData: {
    day: string;
    count: number;
  }[];
  maxWeeklyCount: number;
};

const card =
  "min-w-0 rounded-[22px] border border-white/[0.06] bg-[#282B27] p-4 sm:p-5 lg:p-6";

const projectColors = [
  "#D8FF56",
  "#8EA8FF",
  "#FFB48A",
  "#B8E986",
  "#D8B4FE",
];

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function readableDate(value: string | null): string {
  if (!value) return "";

  const key = value.slice(0, 10);
  const parts = key.split("-").map(Number);

  if (parts.length !== 3) return key;

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return key;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function OverviewView({
  tasks,
  projects,
  loading,
  activeNav,
  completed,
  progress,
  remaining,
  highPriority,
  mediumPriority,
  lowPriority,
  weeklyData,
  maxWeeklyCount,
}: Props) {
  const safeProgress = Math.max(
    0,
    Math.min(100, progress)
  );

  const activity = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedByDate = new Map<string, number>();

    tasks.forEach((task) => {
      if (!task.done || !task.completedAt) return;

      const date = new Date(task.completedAt);

      if (Number.isNaN(date.getTime())) return;

      const key = dateKey(date);

      completedByDate.set(
        key,
        (completedByDate.get(key) ?? 0) + 1
      );
    });

    return Array.from({ length: 28 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (27 - index));

      const key = dateKey(date);

      return {
        key,
        day: date.getDate(),
        count: completedByDate.get(key) ?? 0,
      };
    });
  }, [tasks]);

  const activeDays = activity.filter(
    (day) => day.count > 0
  ).length;

  const completedThisWeek = weeklyData.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const previewTasks = [
    ...tasks.filter((task) => !task.done),
    ...tasks.filter((task) => task.done),
  ].slice(0, 5);

  const priorities = [
    {
      name: "High",
      value: highPriority,
      color: "#FF817D",
    },
    {
      name: "Medium",
      value: mediumPriority,
      color: "#FFD37E",
    },
    {
      name: "Low",
      value: lowPriority,
      color: "#B8E986",
    },
  ];

  return (
    <div className="min-w-0 space-y-4 pb-8 text-[#F5F6F1] sm:space-y-5">
      {/* OVERVIEW HEADER */}

      <header className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#A6AD9B] sm:text-xs">
          Your workspace
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {activeNav === "Tasks"
            ? "Task Overview"
            : "Overview"}
          <span className="text-[#D8FF56]">.</span>
        </h2>

        <p className="mt-2 text-sm text-[#9EA598]">
          Your progress, priorities, and daily activity
          in one place.
        </p>
      </header>

      {/* RESPONSIVE SUMMARY CARDS */}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MetricCard
          title="Total tasks"
          value={tasks.length}
          note="All your tasks"
          loading={loading}
        />

        <MetricCard
          title="Completed"
          value={completed}
          note="Finished tasks"
          loading={loading}
          accent
        />

        <MetricCard
          title="Remaining"
          value={remaining}
          note="Still to complete"
          loading={loading}
        />

        <section className="min-w-0 rounded-[22px] bg-[#D8FF56] p-4 text-[#20231D] sm:p-5 lg:p-6">
          <p className="text-xs text-[#58633E] sm:text-sm">
            Your projects
          </p>

          <p className="mt-3 text-3xl font-semibold sm:mt-4 sm:text-4xl">
            {loading ? "—" : projects.length}
          </p>

          <p className="mt-2 text-[11px] text-[#58633E] sm:text-xs">
            Goals in progress
          </p>
        </section>
      </div>

      {/* CHARTS AND ACTIVITY */}

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:gap-5">
        {/* WEEKLY CHART */}

        <section className={card}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.15em] text-[#A6AD9B]">
                Performance
              </p>

              <h3 className="mt-2 text-lg font-semibold sm:text-xl">
                Weekly Productivity
              </h3>

              <p className="mt-2 text-xs text-[#929B8D] sm:text-sm">
                Tasks completed in the last 7 days
              </p>
            </div>

            <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-[#A6AD9B]">
              7 days
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-semibold sm:text-4xl">
              {loading ? "—" : completedThisWeek}
            </span>

            <span className="text-xs text-[#A6AD9B] sm:text-sm">
              tasks completed
            </span>
          </div>

          <div
            className="mt-6 grid h-44 min-w-0 grid-cols-7 gap-1.5 sm:h-52 sm:gap-3"
            role="img"
            aria-label="Completed tasks over the last seven days"
          >
            {weeklyData.map((item, index) => {
              const height = Math.max(
                0,
                Math.min(
                  100,
                  (item.count /
                    Math.max(1, maxWeeklyCount)) *
                    100
                )
              );

              return (
                <div
                  key={`${item.day}-${index}`}
                  className="flex min-w-0 flex-col items-center gap-2"
                >
                  <span className="text-[10px] text-[#A6AD9B] sm:text-xs">
                    {item.count}
                  </span>

                  <div className="flex min-h-0 w-full flex-1 items-end overflow-hidden rounded-t-lg bg-white/[0.03]">
                    <div
                      className="w-full rounded-t-lg bg-[#D8FF56] transition-all"
                      style={{
                        height: `${
                          item.count === 0 ? 3 : height
                        }%`,
                        opacity: item.count === 0 ? 0.2 : 1,
                      }}
                    />
                  </div>

                  <span className="text-[10px] text-[#A6AD9B] sm:text-xs">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* BLUE ACTIVITY CALENDAR */}

        <section className="min-w-0 rounded-[22px] bg-[#456CF0] p-4 text-white sm:p-5 lg:p-6">
          <p className="text-xs uppercase tracking-[0.15em] text-white/70">
            Consistency
          </p>

          <h3 className="mt-2 text-lg font-semibold sm:text-xl">
            Activity Calendar
          </h3>

          <p className="mt-2 text-xs text-white/70 sm:text-sm">
            Your last 28 days
          </p>

          <div className="mx-auto mt-5 grid w-full max-w-[390px] grid-cols-7 gap-1.5 sm:mt-6 sm:gap-2">
            {activity.map((day) => (
              <div
                key={day.key}
                title={`${day.key}: ${day.count} completed tasks`}
                className={`flex aspect-square min-w-0 items-center justify-center rounded-full text-[10px] font-semibold sm:text-xs ${
                  day.count >= 3
                    ? "bg-[#D8FF56] text-[#20231D]"
                    : day.count === 2
                    ? "bg-[#A7D4FF] text-[#20231D]"
                    : day.count === 1
                    ? "bg-white text-[#263C87]"
                    : "bg-[#3154CE] text-white/70"
                }`}
              >
                {day.day}
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-white/10 p-3 sm:p-4">
            <p className="text-2xl font-semibold sm:text-3xl">
              {activeDays}
              <span className="ml-2 text-xs font-normal text-white/70 sm:text-sm">
                active days
              </span>
            </p>
          </div>
        </section>
      </div>

      {/* COMPLETION AND PRIORITY */}

      <div className="grid min-w-0 gap-4 lg:grid-cols-2 sm:gap-5">
        {/* COMPLETION RING */}

        <section className={card}>
          <p className="text-xs uppercase tracking-[0.15em] text-[#A6AD9B]">
            Overall progress
          </p>

          <h3 className="mt-2 text-lg font-semibold sm:text-xl">
            Task Completion
          </h3>

          <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
            <div
              className="flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#D8FF56 ${
                  safeProgress * 3.6
                }deg, #41463E 0deg)`,
              }}
            >
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[#282B27]">
                <p className="text-3xl font-semibold">
                  {safeProgress}%
                </p>

                <p className="text-xs text-[#A6AD9B]">
                  Complete
                </p>
              </div>
            </div>

            <div className="w-full max-w-xs flex-1 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-[#A6AD9B]">
                  Completed
                </span>

                <strong className="text-[#D8FF56]">
                  {completed}
                </strong>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-[#A6AD9B]">
                  Remaining
                </span>

                <strong>{remaining}</strong>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[#41463E]">
                <div
                  className="h-full rounded-full bg-[#D8FF56]"
                  style={{ width: `${safeProgress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* PRIORITY BARS */}

        <section className={card}>
          <p className="text-xs uppercase tracking-[0.15em] text-[#A6AD9B]">
            Workload
          </p>

          <h3 className="mt-2 text-lg font-semibold sm:text-xl">
            Task Priorities
          </h3>

          <p className="mt-2 text-xs text-[#929B8D] sm:text-sm">
            Priority breakdown of unfinished tasks
          </p>

          <div className="mt-6 space-y-5">
            {priorities.map((item) => {
              const percentage = remaining
                ? Math.round(
                    (item.value / remaining) * 100
                  )
                : 0;

              return (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-[#D5DACF]">
                      {item.name}
                    </span>

                    <span className="text-[#A6AD9B]">
                      {item.value} · {percentage}%
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-[#41463E]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* TASK PREVIEW AND PROJECT PROGRESS */}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] sm:gap-5">
        {/* TASK PREVIEW */}

        <section className={card}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold sm:text-xl">
              Task Preview
            </h3>

            <span className="rounded-full bg-[#D8FF56]/10 px-3 py-1 text-xs text-[#D8FF56]">
              {remaining} pending
            </span>
          </div>

          {loading ? (
            <LoadingRows />
          ) : previewTasks.length === 0 ? (
            <EmptyState message="No tasks yet. Create your first task." />
          ) : (
            <div className="space-y-3">
              {previewTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex min-w-0 items-start gap-3 rounded-xl bg-[#333730] p-3 sm:items-center sm:p-4"
                >
                  <span
                    className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs sm:mt-0 ${
                      task.done
                        ? "border-[#D8FF56] bg-[#D8FF56] text-[#20231D]"
                        : "border-[#858F7C]"
                    }`}
                  >
                    {task.done ? "✓" : ""}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`break-words text-sm font-medium ${
                        task.done
                          ? "text-[#919A8C] line-through"
                          : "text-white"
                      }`}
                    >
                      {task.title}
                    </p>

                    <p className="mt-1 break-words text-xs text-[#A6AD9B]">
                      {task.category}
                      {task.dueDate
                        ? ` · Due ${readableDate(task.dueDate)}`
                        : ""}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] sm:px-3 sm:text-xs ${
                      task.priority === "High"
                        ? "bg-[#FF817D]/15 text-[#FF9F9B]"
                        : task.priority === "Medium"
                        ? "bg-[#FFD37E]/15 text-[#FFD37E]"
                        : "bg-[#B8E986]/15 text-[#B8E986]"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* PROJECT CARDS */}

        <section className={card}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold sm:text-xl">
              Your Projects
            </h3>

            <span className="shrink-0 text-xs text-[#A6AD9B]">
              {projects.length} total
            </span>
          </div>

          {loading ? (
            <LoadingRows />
          ) : projects.length === 0 ? (
            <EmptyState message="No projects yet." />
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map((project, index) => {
                const linkedTasks = tasks.filter(
                  (task) =>
                    task.projectId === project.id
                );

                const finishedTasks = linkedTasks.filter(
                  (task) => task.done
                ).length;

                const projectProgress = linkedTasks.length
                  ? Math.round(
                      (finishedTasks /
                        linkedTasks.length) *
                        100
                    )
                  : 0;

                return (
                  <div
                    key={project.id}
                    className="min-w-0 rounded-xl bg-[#333730] p-3 sm:p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-[#20231D]"
                        style={{
                          backgroundColor:
                            projectColors[
                              index % projectColors.length
                            ],
                        }}
                      >
                        {project.name
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {project.name}
                        </p>

                        <p className="mt-1 text-xs text-[#A6AD9B]">
                          {finishedTasks} /{" "}
                          {linkedTasks.length} tasks
                        </p>
                      </div>

                      <strong className="shrink-0 text-sm text-[#D8FF56]">
                        {projectProgress}%
                      </strong>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#41463E]">
                      <div
                        className="h-full rounded-full bg-[#D8FF56] transition-all"
                        style={{
                          width: `${projectProgress}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  note,
  loading,
  accent = false,
}: {
  title: string;
  value: number;
  note: string;
  loading: boolean;
  accent?: boolean;
}) {
  return (
    <section className={card}>
      <p className="text-xs text-[#A6AD9B] sm:text-sm">
        {title}
      </p>

      <p
        className={`mt-3 text-3xl font-semibold sm:mt-4 sm:text-4xl ${
          accent ? "text-[#D8FF56]" : ""
        }`}
      >
        {loading ? "—" : value}
      </p>

      <p className="mt-2 text-[11px] text-[#929B8D] sm:text-xs">
        {note}
      </p>
    </section>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-16 animate-pulse rounded-xl bg-white/5"
        />
      ))}
    </div>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center sm:p-8">
      <p className="text-sm text-[#A6AD9B]">
        {message}
      </p>
    </div>
  );
}


"use client";

import { useMemo, useState } from "react";

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

type Props = {
  tasks: Task[];
  loading: boolean;
  onToggle: (id: number) => void;
  onAddClick: () => void;
};

type CalendarDay = {
  key: string;
  date: Date;
  number: number;
  weekday: string;
  month: string;
  tasks: Task[];
};

const card =
  "min-w-0 rounded-[22px] border border-white/[0.06] bg-[#282B27]";

const priorityColors: Record<Priority, string> = {
  High: "bg-[#FF817D]/15 text-[#FF9F9B]",
  Medium: "bg-[#FFD37E]/15 text-[#FFD37E]",
  Low: "bg-[#B8E986]/15 text-[#B8E986]",
};

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function taskDateKey(value: string | null): string {
  return value?.slice(0, 10) ?? "";
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  // Monday is the first day of the week.
  const weekday = result.getDay();
  const offset = (weekday + 6) % 7;

  result.setDate(result.getDate() - offset);

  return result;
}

export default function PlannerView({
  tasks,
  loading,
  onToggle,
  onAddClick,
}: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);

  const calendar = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayKey = dateKey(today);

    const weekStart = getStartOfWeek(today);
    weekStart.setDate(
      weekStart.getDate() + weekOffset * 7
    );

    const openTasks = tasks.filter((task) => !task.done);

    const days: CalendarDay[] = Array.from(
      { length: 7 },
      (_, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);

        const key = dateKey(date);

        return {
          key,
          date,
          number: date.getDate(),
          weekday: date.toLocaleDateString("en-US", {
            weekday: "short",
          }),
          month: date.toLocaleDateString("en-US", {
            month: "short",
          }),
          tasks: openTasks.filter(
            (task) => taskDateKey(task.dueDate) === key
          ),
        };
      }
    );

    const weekEndKey = days[6].key;
    const weekStartKey = days[0].key;

    const overdue = openTasks.filter((task) => {
      const key = taskDateKey(task.dueDate);
      return key !== "" && key < todayKey;
    });

    const upcoming = openTasks.filter((task) => {
      const key = taskDateKey(task.dueDate);
      return key > weekEndKey;
    });

    const unscheduled = openTasks.filter(
      (task) => !task.dueDate
    );

    const weekTaskCount = openTasks.filter((task) => {
      const key = taskDateKey(task.dueDate);

      return (
        key >= weekStartKey &&
        key <= weekEndKey
      );
    }).length;

    const dueTodayCount = openTasks.filter(
      (task) =>
        taskDateKey(task.dueDate) === todayKey
    ).length;

    return {
      todayKey,
      days,
      openTasks,
      overdue,
      upcoming,
      unscheduled,
      weekTaskCount,
      dueTodayCount,
    };
  }, [tasks, weekOffset]);

  const selected = calendar.days[selectedDay];

  function changeWeek(direction: number) {
    setWeekOffset((previous) => previous + direction);
    setSelectedDay(0);
  }

  function jumpToToday() {
    const today = new Date();

    setWeekOffset(0);
    setSelectedDay((today.getDay() + 6) % 7);
  }

  const firstDay = calendar.days[0];
  const lastDay = calendar.days[6];

  const weekLabel =
    firstDay.date.getFullYear() ===
      lastDay.date.getFullYear()
      ? `${firstDay.month} ${firstDay.number} – ${lastDay.month} ${lastDay.number}, ${lastDay.date.getFullYear()}`
      : `${firstDay.month} ${firstDay.number}, ${firstDay.date.getFullYear()} – ${lastDay.month} ${lastDay.number}, ${lastDay.date.getFullYear()}`;

  return (
    <div className="min-w-0 space-y-5 pb-8 text-[#F5F6F1]">
      {/* PAGE HEADER */}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-[#A6AD9B]">
            Your schedule
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Planner
            <span className="text-[#D8FF56]">.</span>
          </h2>

          <p className="mt-2 text-sm text-[#9EA598]">
            Organize your week and manage deadlines.
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

      {/* STATISTICS */}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          title="Open tasks"
          value={calendar.openTasks.length}
          loading={loading}
        />

        <StatCard
          title="Due today"
          value={calendar.dueTodayCount}
          loading={loading}
        />

        <StatCard
          title="Overdue"
          value={calendar.overdue.length}
          loading={loading}
        />

        <StatCard
          title="This week"
          value={calendar.weekTaskCount}
          loading={loading}
          blue
        />
      </div>

      {/* WEEK CALENDAR */}

      <section className={`${card} p-4 sm:p-5 lg:p-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.15em] text-[#A6AD9B]">
              Calendar
            </p>

            <h3 className="mt-2 text-lg font-semibold sm:text-xl">
              Weekly Schedule
            </h3>

            <p className="mt-1 text-sm text-[#A6AD9B]">
              {weekLabel}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeWeek(-1)}
              aria-label="Previous week"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#343830] text-xl transition hover:border-[#D8FF56]/50"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={jumpToToday}
              className="h-11 flex-1 rounded-xl border border-[#D8FF56]/30 bg-[#D8FF56]/10 px-4 text-sm font-medium text-[#D8FF56] transition hover:bg-[#D8FF56]/20 sm:flex-none"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => changeWeek(1)}
              aria-label="Next week"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#343830] text-xl transition hover:border-[#D8FF56]/50"
            >
              ›
            </button>
          </div>
        </div>

        {/* On mobile, the days scroll horizontally.
            On tablet and desktop, all 7 fit in a grid. */}

        <div className="-mx-4 mt-5 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
          <div className="flex w-max min-w-full gap-2 sm:grid sm:w-full sm:grid-cols-7 sm:gap-2 lg:gap-3">
            {calendar.days.map((day, index) => {
              const isSelected = selectedDay === index;
              const isToday =
                day.key === calendar.todayKey;

              return (
                <button
                  type="button"
                  key={day.key}
                  aria-pressed={isSelected}
                  aria-label={`${formatLongDate(day.date)}, ${day.tasks.length} open tasks`}
                  onClick={() => setSelectedDay(index)}
                  className={`flex min-h-30 w-[78px] shrink-0 flex-col items-center justify-center rounded-2xl border px-2 py-3 transition sm:min-h-32 sm:w-auto sm:min-w-0 ${
                    isSelected
                      ? "border-[#D8FF56] bg-[#D8FF56] text-[#20231D]"
                      : isToday
                      ? "border-[#D8FF56]/60 bg-[#343B2D] text-white"
                      : "border-white/[0.06] bg-[#343830] text-white hover:border-[#D8FF56]/40"
                  }`}
                >
                  <span
                    className={`text-xs ${
                      isSelected
                        ? "text-[#536037]"
                        : "text-[#AFB8A8]"
                    }`}
                  >
                    {day.weekday}
                  </span>

                  <span className="mt-2 text-2xl font-semibold">
                    {day.number}
                  </span>

                  <span
                    className={`mt-1 text-[10px] ${
                      isSelected
                        ? "text-[#536037]"
                        : "text-[#A6AD9B]"
                    }`}
                  >
                    {day.month}
                  </span>

                  <span
                    className={`mt-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      isSelected
                        ? "bg-black/10"
                        : "bg-[#D8FF56]/10 text-[#D8FF56]"
                    }`}
                  >
                    {day.tasks.length} tasks
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-2 text-xs text-[#869180] sm:hidden">
          Swipe horizontally to see all seven days.
        </p>
      </section>

      {/* DAILY SCHEDULE */}

      {loading ? (
        <div className="h-48 animate-pulse rounded-[22px] bg-[#282B27]" />
      ) : (
        <>
          <TaskSection
            title={
              selected.key === calendar.todayKey
                ? "Today's Tasks"
                : formatLongDate(selected.date)
            }
            subtitle={`${selected.tasks.length} scheduled tasks`}
            tasks={selected.tasks}
            onToggle={onToggle}
            accent="lime"
            emptyMessage="No tasks scheduled for this day."
          />

          {calendar.overdue.length > 0 && (
            <TaskSection
              title="Overdue Tasks"
              subtitle="Tasks that need your attention"
              tasks={calendar.overdue}
              onToggle={onToggle}
              accent="red"
              emptyMessage="No overdue tasks."
            />
          )}

          {calendar.upcoming.length > 0 && (
            <TaskSection
              title="Upcoming Deadlines"
              subtitle="Tasks scheduled after the displayed week"
              tasks={calendar.upcoming}
              onToggle={onToggle}
              accent="blue"
              emptyMessage="No upcoming deadlines."
            />
          )}

          {calendar.unscheduled.length > 0 && (
            <TaskSection
              title="Unscheduled Tasks"
              subtitle="Tasks without a due date"
              tasks={calendar.unscheduled}
              onToggle={onToggle}
              accent="neutral"
              emptyMessage="No unscheduled tasks."
            />
          )}

          {calendar.openTasks.length === 0 && (
            <section className={`${card} p-6 text-center`}>
              <p className="text-lg font-semibold">
                You're all caught up!
              </p>

              <p className="mt-2 text-sm text-[#A6AD9B]">
                No unfinished tasks right now.
              </p>
            </section>
          )}
        </>
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

function TaskSection({
  title,
  subtitle,
  tasks,
  onToggle,
  accent,
  emptyMessage,
}: {
  title: string;
  subtitle: string;
  tasks: Task[];
  onToggle: (id: number) => void;
  accent: "lime" | "red" | "blue" | "neutral";
  emptyMessage: string;
}) {
  const accentColor = {
    lime: "#D8FF56",
    red: "#FF817D",
    blue: "#8EA8FF",
    neutral: "#A6AD9B",
  }[accent];

  return (
    <section className={`${card} p-4 sm:p-5 lg:p-6`}>
      <div className="mb-5 flex min-w-0 items-start gap-3">
        <span
          className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: accentColor }}
        />

        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-semibold">
            {title}
          </h3>

          <p className="mt-1 text-sm text-[#A6AD9B]">
            {subtitle}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-white/5 px-3 py-1 text-xs text-[#A6AD9B]">
          {tasks.length}
        </span>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-[#A6AD9B]">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex min-w-0 items-start gap-3 rounded-xl border border-white/[0.04] bg-[#333730] p-3 sm:items-center sm:p-4"
            >
              <button
                type="button"
                onClick={() => onToggle(task.id)}
                aria-label={`Complete ${task.title}`}
                className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#858F7C] transition hover:border-[#D8FF56] sm:mt-0"
              />

              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium text-white">
                  {task.title}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#A6AD9B]">
                  <span>{task.category}</span>

                  {task.dueDate && (
                    <>
                      <span>·</span>
                      <span>
                        {taskDateKey(task.dueDate)}
                      </span>
                    </>
                  )}

                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${priorityColors[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

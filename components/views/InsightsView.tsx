
"use client";

import { useMemo, useState } from "react";

type Priority = "High" | "Medium" | "Low";
type Period = 7 | 30 | 90;

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
};

type ActivityDay = {
  key: string;
  date: Date;
  count: number;
};

const card =
  "min-w-0 rounded-[22px] border border-white/[0.06] bg-[#282B27] p-4 sm:p-5 lg:p-6";

const priorityColors: Record<Priority, string> = {
  High: "#FF817D",
  Medium: "#FFD37E",
  Low: "#B8E986",
};

function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function InsightsView({
  tasks,
  loading,
}: Props) {
  const [period, setPeriod] = useState<Period>(30);

  const analytics = useMemo(() => {
    const today = startOfToday();

    const completedTasks = tasks.filter(
      (task) => task.done
    );

    const completionDates = new Map<string, number>();

    const completedWithDate = completedTasks.flatMap(
      (task) => {
        if (!task.completedAt) return [];

        const date = new Date(task.completedAt);

        if (Number.isNaN(date.getTime())) {
          return [];
        }

        return [{ task, date }];
      }
    );

    completedWithDate.forEach(({ date }) => {
      const key = dateKey(date);

      completionDates.set(
        key,
        (completionDates.get(key) ?? 0) + 1
      );
    });

    const activity: ActivityDay[] = Array.from(
      { length: period },
      (_, index) => {
        const date = new Date(today);

        date.setDate(
          today.getDate() - (period - 1 - index)
        );

        const key = dateKey(date);

        return {
          key,
          date,
          count: completionDates.get(key) ?? 0,
        };
      }
    );

    const startKey = activity[0]?.key ?? dateKey(today);
    const endKey = dateKey(today);

    const periodCompleted = completedWithDate.filter(
      ({ date }) => {
        const key = dateKey(date);

        return key >= startKey && key <= endKey;
      }
    );

    const totalInPeriod = periodCompleted.length;

    const activeDays = activity.filter(
      (day) => day.count > 0
    ).length;

    const average = totalInPeriod / period;

    const categoryMap = new Map<string, number>();
    const priorityMap = new Map<Priority, number>();

    const weekdayCounts = Array.from(
      { length: 7 },
      () => 0
    );

    periodCompleted.forEach(({ task, date }) => {
      categoryMap.set(
        task.category,
        (categoryMap.get(task.category) ?? 0) + 1
      );

      priorityMap.set(
        task.priority,
        (priorityMap.get(task.priority) ?? 0) + 1
      );

      weekdayCounts[date.getDay()] += 1;
    });

    const categoryData = Array.from(
      categoryMap.entries()
    )
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const priorityData = (
      ["High", "Medium", "Low"] as Priority[]
    ).map((name) => ({
      name,
      count: priorityMap.get(name) ?? 0,
    }));

    const weekdayData = [
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ].map((name, index) => ({
      name,
      count: weekdayCounts[index],
    }));

    const weeklyGroups = [];

    for (let index = 0; index < activity.length; index += 7) {
      const group = activity.slice(index, index + 7);

      weeklyGroups.push({
        label: `W${weeklyGroups.length + 1}`,
        count: group.reduce(
          (sum, day) => sum + day.count,
          0
        ),
      });
    }

    const completionRate = tasks.length
      ? Math.round(
          (completedTasks.length / tasks.length) * 100
        )
      : 0;

    let currentStreak = 0;

    const streakDate = new Date(today);

    if (!completionDates.has(dateKey(streakDate))) {
      streakDate.setDate(streakDate.getDate() - 1);
    }

    while (completionDates.has(dateKey(streakDate))) {
      currentStreak += 1;
      streakDate.setDate(streakDate.getDate() - 1);
    }

    return {
      activity,
      totalCompleted: completedTasks.length,
      totalTasks: tasks.length,
      remaining: tasks.length - completedTasks.length,
      totalInPeriod,
      activeDays,
      average,
      currentStreak,
      completionRate,
      categoryData,
      priorityData,
      weekdayData,
      weeklyGroups,
      maxDay: Math.max(
        1,
        ...activity.map((day) => day.count)
      ),
      maxCategory: Math.max(
        1,
        ...categoryData.map((item) => item.count)
      ),
      maxWeekday: Math.max(
        1,
        ...weekdayData.map((item) => item.count)
      ),
      maxWeek: Math.max(
        1,
        ...weeklyGroups.map((item) => item.count)
      ),
    };
  }, [tasks, period]);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <div className="h-28 animate-pulse rounded-[22px] bg-[#282B27]" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-[22px] bg-[#282B27]"
            />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-[22px] bg-[#282B27]" />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4 pb-8 text-[#F5F6F1] sm:space-y-5">
      {/* PAGE HEADER */}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#A6AD9B] sm:text-xs">
            Your productivity data
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Insights
            <span className="text-[#D8FF56]">.</span>
          </h2>

          <p className="mt-2 text-sm text-[#9EA598]">
            Understand your work, progress, and consistency.
          </p>
        </div>

        {/* NEW: TIME PERIOD FILTER */}

        <div
          className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#282B27] p-1.5"
          aria-label="Analytics time period"
        >
          {([7, 30, 90] as Period[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={period === value}
              onClick={() => setPeriod(value)}
              className={`min-h-10 rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                period === value
                  ? "bg-[#D8FF56] text-[#20231D]"
                  : "text-[#A6AD9B] hover:text-white"
              }`}
            >
              {value} days
            </button>
          ))}
        </div>
      </header>

      {/* RESPONSIVE STATISTICS */}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          title="Completed"
          value={analytics.totalCompleted}
          note="All-time completed tasks"
        />

        <StatCard
          title={`Last ${period} days`}
          value={analytics.totalInPeriod}
          note="Completed in selected period"
        />

        <StatCard
          title="Active days"
          value={analytics.activeDays}
          note={`Out of ${period} days`}
        />

        <StatCard
          title="Completion rate"
          value={`${analytics.completionRate}%`}
          note="All-time task completion"
          blue
        />
      </div>

      {/* HEATMAP AND PRODUCTIVITY SUMMARY */}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] sm:gap-5">
        {/* ACTIVITY HEATMAP */}

        <section className={card}>
          <p className="text-xs uppercase tracking-[0.15em] text-[#A6AD9B]">
            Activity tracking
          </p>

          <h3 className="mt-2 text-lg font-semibold sm:text-xl">
            Activity Heatmap
          </h3>

          <p className="mt-2 text-xs text-[#A6AD9B] sm:text-sm">
            Each square represents one day.
          </p>

          {/* Horizontally scrollable only if necessary */}
          <div className="-mx-4 mt-6 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
            <div
              className="grid min-w-0 gap-1.5 sm:gap-2"
              style={{
                gridTemplateColumns: `repeat(7, minmax(0, 1fr))`,
              }}
            >
              {analytics.activity.map((day) => {
                const intensity =
                  day.count / analytics.maxDay;

                const background =
                  day.count === 0
                    ? "#3D423A"
                    : intensity >= 0.75
                    ? "#D8FF56"
                    : intensity >= 0.5
                    ? "#B4D94C"
                    : intensity >= 0.25
                    ? "#819D40"
                    : "#526736";

                return (
                  <div
                    key={day.key}
                    title={`${day.key}: ${day.count} completed`}
                    aria-label={`${day.key}, ${day.count} completed tasks`}
                    className="aspect-square min-w-0 rounded-md sm:rounded-lg"
                    style={{
                      backgroundColor: background,
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#A6AD9B]">
            <span>Less</span>

            {[
              "#3D423A",
              "#526736",
              "#819D40",
              "#B4D94C",
              "#D8FF56",
            ].map((color) => (
              <span
                key={color}
                className="h-3.5 w-3.5 rounded-sm"
                style={{ backgroundColor: color }}
              />
            ))}

            <span>More</span>
          </div>
        </section>

        {/* PRODUCTIVITY SUMMARY */}

        <section className={card}>
          <p className="text-xs uppercase tracking-[0.15em] text-[#A6AD9B]">
            Performance
          </p>

          <h3 className="mt-2 text-lg font-semibold sm:text-xl">
            Productivity Summary
          </h3>

          <div className="mt-6 space-y-4">
            <SummaryRow
              label="Daily average"
              value={analytics.average.toFixed(1)}
            />

            <SummaryRow
              label="Active days"
              value={`${analytics.activeDays}/${period}`}
            />

            <SummaryRow
              label="Current streak"
              value={`${analytics.currentStreak} days`}
            />

            <SummaryRow
              label="Remaining tasks"
              value={String(analytics.remaining)}
            />

            <SummaryRow
              label="Top category"
              value={
                analytics.categoryData[0]?.name ??
                "None"
              }
            />
          </div>
        </section>
      </div>

      {/* WEEKLY PRODUCTIVITY */}

      <section className={card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-[#A6AD9B]">
              Completion trends
            </p>

            <h3 className="mt-2 text-lg font-semibold sm:text-xl">
              Weekly Productivity
            </h3>

            <p className="mt-2 text-xs text-[#A6AD9B] sm:text-sm">
              Completed tasks grouped into seven-day periods
            </p>
          </div>

          <span className="rounded-full bg-[#D8FF56]/10 px-3 py-1.5 text-xs text-[#D8FF56]">
            {period}-day view
          </span>
        </div>

        <div
          className="mt-7 flex h-48 min-w-0 items-end gap-2 sm:h-56 sm:gap-4"
          role="img"
          aria-label="Weekly task completion chart"
        >
          {analytics.weeklyGroups.map((week) => {
            const height =
              (week.count / analytics.maxWeek) * 100;

            return (
              <div
                key={week.label}
                className="flex h-full min-w-0 flex-1 flex-col items-center gap-2"
              >
                <span className="text-[10px] text-[#A6AD9B] sm:text-xs">
                  {week.count}
                </span>

                <div className="flex min-h-0 w-full flex-1 items-end overflow-hidden rounded-t-lg bg-white/[0.03]">
                  <div
                    className="w-full rounded-t-lg bg-[#D8FF56] transition-all"
                    style={{
                      height: `${
                        week.count === 0 ? 3 : height
                      }%`,
                      opacity: week.count === 0 ? 0.2 : 1,
                    }}
                  />
                </div>

                <span className="text-[10px] text-[#A6AD9B] sm:text-xs">
                  {week.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* CATEGORY AND PRIORITY ANALYTICS */}

      <div className="grid min-w-0 gap-4 lg:grid-cols-2 sm:gap-5">
        <section className={card}>
          <h3 className="text-lg font-semibold sm:text-xl">
            Completed by Category
          </h3>

          <p className="mt-2 text-xs text-[#A6AD9B] sm:text-sm">
            Categories completed during the selected period
          </p>

          {analytics.categoryData.length === 0 ? (
            <EmptyMessage
              text={`No completed tasks recorded in the last ${period} days.`}
            />
          ) : (
            <div className="mt-6 space-y-5">
              {analytics.categoryData.map((item) => {
                const width =
                  (item.count /
                    analytics.maxCategory) *
                  100;

                return (
                  <div key={item.name} className="min-w-0">
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 break-words text-[#D5DACF]">
                        {item.name}
                      </span>

                      <span className="shrink-0 text-[#A6AD9B]">
                        {item.count}
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-[#41463E]">
                      <div
                        className="h-full rounded-full bg-[#D8FF56]"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className={card}>
          <h3 className="text-lg font-semibold sm:text-xl">
            Completed by Priority
          </h3>

          <p className="mt-2 text-xs text-[#A6AD9B] sm:text-sm">
            Priority breakdown for selected period
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            {analytics.priorityData.map((item) => (
              <div
                key={item.name}
                className="min-w-0 rounded-xl bg-[#333730] p-3 text-center sm:p-4"
              >
                <span
                  className="mx-auto block h-3 w-3 rounded-full"
                  style={{
                    backgroundColor:
                      priorityColors[item.name],
                  }}
                />

                <p className="mt-4 text-2xl font-semibold sm:text-3xl">
                  {item.count}
                </p>

                <p className="mt-2 text-[11px] text-[#A6AD9B] sm:text-xs">
                  {item.name}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {analytics.priorityData.map((item) => {
              const percentage =
                analytics.totalInPeriod > 0
                  ? Math.round(
                      (item.count /
                        analytics.totalInPeriod) *
                        100
                    )
                  : 0;

              return (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between text-xs text-[#A6AD9B]">
                    <span>{item.name}</span>
                    <span>{percentage}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-[#41463E]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor:
                          priorityColors[item.name],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* WEEKDAY CHART */}

      <section className={card}>
        <h3 className="text-lg font-semibold sm:text-xl">
          Activity by Weekday
        </h3>

        <p className="mt-2 text-xs text-[#A6AD9B] sm:text-sm">
          See which weekdays have the most completed tasks
        </p>

        <div
          className="mt-7 grid h-44 grid-cols-7 gap-1.5 sm:h-52 sm:gap-3"
          role="img"
          aria-label="Completed tasks by weekday"
        >
          {analytics.weekdayData.map((day) => {
            const height =
              (day.count /
                analytics.maxWeekday) *
              100;

            return (
              <div
                key={day.name}
                className="flex min-w-0 flex-col items-center gap-2"
              >
                <span className="text-[10px] text-[#A6AD9B] sm:text-xs">
                  {day.count}
                </span>

                <div className="flex min-h-0 w-full flex-1 items-end overflow-hidden rounded-t-lg bg-white/[0.03]">
                  <div
                    className="w-full rounded-t-lg bg-[#8EA8FF]"
                    style={{
                      height: `${
                        day.count === 0
                          ? 3
                          : height
                      }%`,
                      opacity: day.count === 0 ? 0.25 : 1,
                    }}
                  />
                </div>

                <span className="text-[10px] text-[#A6AD9B] sm:text-xs">
                  {day.name}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-xs leading-5 text-[#899385]">
        Analytics use task completion timestamps stored in
        your database. Tasks without a recorded completion
        date are included in all-time totals but not
        date-based charts.
      </p>
    </div>
  );
}

function StatCard({
  title,
  value,
  note,
  blue = false,
}: {
  title: string;
  value: number | string;
  note: string;
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
          blue
            ? "text-white/75"
            : "text-[#A6AD9B]"
        }`}
      >
        {title}
      </p>

      <p className="mt-3 text-3xl font-semibold sm:mt-4 sm:text-4xl">
        {value}
      </p>

      <p
        className={`mt-2 text-[11px] sm:text-xs ${
          blue
            ? "text-white/70"
            : "text-[#929B8D]"
        }`}
      >
        {note}
      </p>
    </section>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
      <span className="text-sm text-[#A6AD9B]">
        {label}
      </span>

      <strong className="min-w-0 break-words text-right text-sm text-[#D8FF56]">
        {value}
      </strong>
    </div>
  );
}

function EmptyMessage({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-white/10 p-6 text-center">
      <p className="text-sm text-[#A6AD9B]">
        {text}
      </p>
    </div>
  );
}

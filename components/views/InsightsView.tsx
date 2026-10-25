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
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date) {
  return startOfDay(d).toISOString().slice(0, 10);
}

function computeInsights(tasks: Task[]) {
  const completed = tasks.filter((t) => t.done && t.completedAt);
  const totalCompleted = completed.length;

  const now = startOfDay(new Date());

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);

  const monthStart = new Date(now);
  monthStart.setDate(monthStart.getDate() - 29);

  let thisWeek = 0;
  let thisMonth = 0;

  const byDay = new Map<string, number>();
  const byCategory = new Map<string, number>();
  const byPriority = new Map<string, number>();
  const byWeekday = new Map<number, number>();

  for (const t of completed) {
    const d = startOfDay(new Date(t.completedAt!));
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);

    if (d.getTime() >= weekStart.getTime()) thisWeek++;
    if (d.getTime() >= monthStart.getTime()) thisMonth++;

    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + 1);
    byPriority.set(t.priority, (byPriority.get(t.priority) ?? 0) + 1);
    byWeekday.set(d.getDay(), (byWeekday.get(d.getDay()) ?? 0) + 1);
  }

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const key = dayKey(d);
    return {
      key,
      date: d,
      count: byDay.get(key) ?? 0,
    };
  });

  const avgPerDay =
    last30.reduce((sum, d) => sum + d.count, 0) / 30;

  let maxDayCount = 0;
  for (const d of last30) {
    if (d.count > maxDayCount) maxDayCount = d.count;
  }

  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdayData = weekdayNames.map((name, i) => ({
    name,
    count: byWeekday.get(i) ?? 0,
  }));
  const bestDay = weekdayData.reduce(
    (best, d) => (d.count > best.count ? d : best),
    weekdayData[0]
  );

  const categoryData = Array.from(byCategory.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const maxCategoryCount = Math.max(
    ...categoryData.map((c) => c.count),
    1
  );

  const priorityData = (["High", "Medium", "Low"] as const).map((p) => ({
    name: p,
    count: byPriority.get(p) ?? 0,
  }));

  return {
    totalCompleted,
    thisWeek,
    thisMonth,
    last30,
    avgPerDay,
    maxDayCount,
    weekdayData,
    bestDay,
    categoryData,
    maxCategoryCount,
    priorityData,
  };
}

export default function InsightsView({ tasks, loading }: Props) {
  const insights = useMemo(() => computeInsights(tasks), [tasks]);
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-2xl bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }

  if (insights.totalCompleted === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-[#121620] p-12 text-center">
        <p className="text-sm text-gray-400">
          No completed tasks yet. Finish one to start seeing insights.
        </p>
      </div>
    );
  }

  function heatmapColor(count: number, max: number) {
    if (count === 0) return "bg-white/[0.03]";
    const ratio = count / Math.max(max, 1);
    if (ratio >= 0.75) return "bg-violet-400";
    if (ratio >= 0.5) return "bg-violet-500/70";
    if (ratio >= 0.25) return "bg-violet-500/45";
    return "bg-violet-500/25";
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Insights</h2>
        <p className="mt-1 text-sm text-gray-500">
          Your progress over time
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#121620] p-5">
          <p className="text-sm text-gray-400">Total completed</p>
          <p className="mt-3 text-3xl font-semibold">
            {insights.totalCompleted}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121620] p-5">
          <p className="text-sm text-gray-400">This week</p>
          <p className="mt-3 text-3xl font-semibold text-violet-300">
            {insights.thisWeek}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121620] p-5">
          <p className="text-sm text-gray-400">Last 30 days</p>
          <p className="mt-3 text-3xl font-semibold">
            {insights.thisMonth}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121620] p-5">
          <p className="text-sm text-gray-400">Average per day</p>
          <p className="mt-3 text-3xl font-semibold text-violet-300">
            {insights.avgPerDay.toFixed(1)}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Best day: {insights.bestDay.name} ({insights.bestDay.count})
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#121620] p-5">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Last 30 days</h3>
            <p className="mt-1 text-sm text-gray-500">
              Each square is a day. Darker means more tasks completed.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Less</span>
            <div className="flex gap-1">
              <span className="h-3 w-3 rounded-sm bg-white/[0.03]" />
              <span className="h-3 w-3 rounded-sm bg-violet-500/25" />
              <span className="h-3 w-3 rounded-sm bg-violet-500/45" />
              <span className="h-3 w-3 rounded-sm bg-violet-500/70" />
              <span className="h-3 w-3 rounded-sm bg-violet-400" />
            </div>
            <span>More</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {insights.last30.map((day) => (
            <div
              key={day.key}
              title={`${day.key} · ${day.count} task${
                day.count === 1 ? "" : "s"
              }`}
              className={`h-6 w-6 rounded-md transition hover:scale-110 ${heatmapColor(
                day.count,
                insights.maxDayCount
              )}`}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#121620] p-5">
          <div className="mb-5">
            <h3 className="text-lg font-semibold">By category</h3>
            <p className="mt-1 text-sm text-gray-500">
              Where your completed tasks come from
            </p>
          </div>

          {insights.categoryData.length === 0 ? (
            <p className="text-sm text-gray-500">No data yet.</p>
          ) : (
            <div className="space-y-4">
              {insights.categoryData.map((cat) => {
                const width =
                  (cat.count / insights.maxCategoryCount) * 100;
                return (
                  <div key={cat.name}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-gray-300">{cat.name}</span>
                      <span className="text-gray-500">{cat.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121620] p-5">
          <div className="mb-5">
            <h3 className="text-lg font-semibold">By priority</h3>
            <p className="mt-1 text-sm text-gray-500">
              Completed tasks grouped by priority
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {insights.priorityData.map((p) => {
              const color =
                p.name === "High"
                  ? "text-rose-300 bg-rose-500/10 border-rose-500/20"
                  : p.name === "Medium"
                  ? "text-amber-300 bg-amber-500/10 border-amber-500/20"
                  : "text-emerald-300 bg-emerald-500/10 border-emerald-500/20";
              return (
                <div
                  key={p.name}
                  className={`rounded-xl border p-4 text-center ${color}`}
                >
                  <p className="text-2xl font-semibold">{p.count}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest">
                    {p.name}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <h4 className="mb-3 text-sm font-medium text-gray-400">
              By day of week
            </h4>
            <div className="flex h-32 items-end gap-2">
              {insights.weekdayData.map((d) => {
                const maxW = Math.max(
                  ...insights.weekdayData.map((x) => x.count),
                  1
                );
                const height = (d.count / maxW) * 100;
                return (
                  <div
                    key={d.name}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-[10px] text-gray-500">
                      {d.count}
                    </span>
                    <div className="flex h-full w-full items-end rounded-md bg-white/[0.025]">
                      <div
                        className="w-full rounded-md bg-violet-400/70"
                        style={{
                          height: d.count === 0 ? "4%" : `${height}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {d.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
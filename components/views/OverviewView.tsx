"use client";

type Task = {
  id: number;
  title: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  done: boolean;
  completedAt: string | null;
  dueDate: string | null;
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
  weeklyData: { day: string; count: number }[];
  maxWeeklyCount: number;
};

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
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#121620] p-5">
          <p className="text-sm text-gray-400">Tasks completed</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-semibold">
              {completed}
              <span className="text-lg text-gray-500">/{tasks.length}</span>
            </p>
            <span className="text-sm text-violet-300">{progress}%</span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-violet-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121620] p-5">
          <p className="text-sm text-gray-400">Tasks remaining</p>
          <p className="mt-3 text-3xl font-semibold">{remaining}</p>
          <p className="mt-2 text-sm text-gray-500">Keep moving forward.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121620] p-5">
          <p className="text-sm text-gray-400">Active projects</p>
          <p className="mt-3 text-3xl font-semibold">{projects.length}</p>
          <p className="mt-2 text-sm text-gray-500">
            Your goals, all in one place.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121620] p-5">
          <p className="text-sm text-gray-400">Completion</p>
          <p className="mt-3 text-3xl font-semibold text-violet-300">
            {progress}%
          </p>
          <p className="mt-2 text-sm text-gray-500">Overall progress</p>
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-[#121620] p-5">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">Weekly Productivity</h3>
              <p className="mt-1 text-sm text-gray-500">
                Tasks completed over the last 7 days
              </p>
            </div>
            <div className="rounded-lg bg-violet-500/10 px-3 py-1.5 text-xs text-violet-300">
              Last 7 days
            </div>
          </div>

          <div className="flex h-44 items-end gap-3">
            {weeklyData.map((day) => {
              const height = (day.count / maxWeeklyCount) * 100;
              return (
                <div
                  key={day.day}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-xs text-gray-500">{day.count}</span>
                  <div className="flex h-full w-full items-end rounded-lg bg-white/[0.025]">
                    <div
                      className="w-full rounded-lg bg-violet-400 transition-all"
                      style={{
                        height: day.count === 0 ? "4%" : `${height}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{day.day}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121620] p-5">
          <div>
            <h3 className="text-lg font-semibold">Productivity</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your overall task completion
            </p>
          </div>

          <div className="mt-5 flex items-center gap-6">
            <div
              className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(
                  rgb(167 139 250) ${progress * 3.6}deg,
                  rgba(255,255,255,0.05) ${progress * 3.6}deg
                )`,
              }}
            >
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#121620]">
                <p className="text-2xl font-bold">{progress}%</p>
                <p className="text-[10px] text-gray-500">completed</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xl font-semibold text-violet-300">
                  {completed}
                </p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{remaining}</p>
                <p className="text-xs text-gray-500">Remaining</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[0.8fr_1.7fr]">
        <section className="rounded-2xl border border-white/10 bg-[#121620] p-5">
          <div className="mb-5">
            <h3 className="text-lg font-semibold">Task Priority</h3>
            <p className="mt-1 text-sm text-gray-500">
              Unfinished tasks by priority
            </p>
          </div>

          <div className="space-y-5">
            {[
              { name: "High", value: highPriority, color: "bg-rose-400" },
              { name: "Medium", value: mediumPriority, color: "bg-amber-400" },
              { name: "Low", value: lowPriority, color: "bg-emerald-400" },
            ].map((priority) => {
              const width =
                remaining === 0 ? 0 : (priority.value / remaining) * 100;
              return (
                <div key={priority.name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-300">{priority.name}</span>
                    <span className="text-gray-500">{priority.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${priority.color} transition-all`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121620] p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">
                {activeNav === "My Tasks" ? "My Tasks" : "Today's tasks"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {remaining} tasks left to complete
              </p>
            </div>
          </div>

          <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl bg-white/[0.03]"
                  />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                <p className="text-sm text-gray-400">No tasks yet.</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={`break-words text-sm font-medium ${
                        task.done
                          ? "text-gray-500 line-through"
                          : "text-gray-200"
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
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
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
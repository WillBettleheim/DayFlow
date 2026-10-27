
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Priority = "High" | "Medium" | "Low";
type Mode = "Work" | "Short break" | "Long break";

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

const DURATIONS: Record<Mode, number> = {
  Work: 25 * 60,
  "Short break": 5 * 60,
  "Long break": 15 * 60,
};

const STORAGE_KEY = "dayflow-focus-count-v3";

const card =
  "min-w-0 rounded-[22px] border border-white/[0.06] bg-[#282B27]";

const priorityRank: Record<Priority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));

  const minutes = Math.floor(safe / 60);
  const leftover = safe % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    leftover
  ).padStart(2, "0")}`;
}

function getLocalDateKey(): string {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function FocusView({
  tasks,
  loading,
  onToggle,
  onAddClick,
}: Props) {
  // TIMER

  const [mode, setMode] = useState<Mode>("Work");

  const [secondsLeft, setSecondsLeft] = useState(
    DURATIONS.Work
  );

  const [running, setRunning] = useState(false);

  const deadlineRef = useRef<number | null>(null);

  // TASK SELECTION

  const [selectedTaskId, setSelectedTaskId] =
    useState("");

  // SESSION TRACKING

  const [sessionsToday, setSessionsToday] = useState(0);

  const [sessionDate, setSessionDate] = useState("");

  const [storageLoaded, setStorageLoaded] =
    useState(false);

  // LOAD SESSION COUNT FROM BROWSER

  useEffect(() => {
    const today = getLocalDateKey();

    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (
          parsed !== null &&
          typeof parsed === "object" &&
          "date" in parsed &&
          "count" in parsed &&
          parsed.date === today &&
          typeof parsed.count === "number" &&
          Number.isInteger(parsed.count) &&
          parsed.count >= 0
        ) {
          setSessionsToday(parsed.count);
        }
      }
    } catch {
      // Timer works even if browser storage is blocked.
    }

    setSessionDate(today);
    setStorageLoaded(true);
  }, []);

  // SAVE SESSION COUNT

  useEffect(() => {
    if (!storageLoaded || !sessionDate) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          date: sessionDate,
          count: sessionsToday,
        })
      );
    } catch {
      // Saving is optional.
    }
  }, [sessionsToday, sessionDate, storageLoaded]);

  // FILTER OPEN TASKS

  const openTasks = useMemo(() => {
    return tasks
      .filter((task) => !task.done)
      .sort(
        (a, b) =>
          priorityRank[a.priority] -
          priorityRank[b.priority]
      );
  }, [tasks]);

  const selectedTask =
    openTasks.find(
      (task) => String(task.id) === selectedTaskId
    ) ?? openTasks[0];

  // TIMER LOOP
  // Uses real timestamps so browser interval delays
  // don't cause the displayed timer to drift.

  useEffect(() => {
    if (!running) return;

    const interval = window.setInterval(() => {
      const deadline = deadlineRef.current;

      if (deadline === null) return;

      const remaining = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000)
      );

      setSecondsLeft(remaining);

      if (remaining > 0) return;

      window.clearInterval(interval);
      deadlineRef.current = null;
      setRunning(false);

      if (mode === "Work") {
        const today = getLocalDateKey();

        const currentCount =
          sessionDate === today ? sessionsToday : 0;

        const newCount = currentCount + 1;

        setSessionDate(today);
        setSessionsToday(newCount);

        const nextMode: Mode =
          newCount % 4 === 0
            ? "Long break"
            : "Short break";

        setMode(nextMode);
        setSecondsLeft(DURATIONS[nextMode]);
      } else {
        setMode("Work");
        setSecondsLeft(DURATIONS.Work);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [running, mode, sessionsToday, sessionDate]);

  function startOrPause() {
    if (running) {
      const deadline = deadlineRef.current;

      if (deadline !== null) {
        setSecondsLeft(
          Math.max(
            0,
            Math.ceil((deadline - Date.now()) / 1000)
          )
        );
      }

      deadlineRef.current = null;
      setRunning(false);
      return;
    }

    deadlineRef.current =
      Date.now() + secondsLeft * 1000;

    setRunning(true);
  }

  function switchMode(nextMode: Mode) {
    deadlineRef.current = null;

    setRunning(false);
    setMode(nextMode);
    setSecondsLeft(DURATIONS[nextMode]);
  }

  function resetTimer() {
    deadlineRef.current = null;
    setRunning(false);
    setSecondsLeft(DURATIONS[mode]);
  }

  function completeSelectedTask() {
    if (!selectedTask) return;

    onToggle(selectedTask.id);
    resetTimer();
  }

  // CIRCULAR TIMER DISPLAY

  const totalSeconds = DURATIONS[mode];

  const progress = Math.min(
    1,
    Math.max(0, 1 - secondsLeft / totalSeconds)
  );

  const radius = 116;
  const circumference = 2 * Math.PI * radius;

  const timerColor =
    mode === "Work"
      ? "#D8FF56"
      : mode === "Short break"
      ? "#8DD9CF"
      : "#8EA8FF";

  const todayCount =
    sessionDate === getLocalDateKey()
      ? sessionsToday
      : 0;

  const cycleProgress = todayCount % 4;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-[22px] bg-[#282B27]" />
        <div className="h-96 animate-pulse rounded-[22px] bg-[#282B27]" />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4 pb-8 text-[#F5F6F1] sm:space-y-5">
      {/* PAGE HEADER */}

      <header className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#A6AD9B] sm:text-xs">
          Your productivity space
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Focus Mode
          <span className="text-[#D8FF56]">.</span>
        </h2>

        <p className="mt-2 text-sm text-[#9EA598]">
          Focus on one task at a time.
        </p>
      </header>

      {/* RESPONSIVE STATS */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          title="Sessions today"
          value={todayCount}
        />

        <StatCard
          title="Focus minutes"
          value={todayCount * 25}
        />

        <div className="col-span-2 rounded-[20px] bg-[#456CF0] p-4 sm:col-span-1 sm:p-5">
          <p className="text-xs text-white/75 sm:text-sm">
            Open tasks
          </p>

          <p className="mt-3 text-3xl font-semibold sm:mt-4 sm:text-4xl">
            {openTasks.length}
          </p>

          <p className="mt-2 text-xs text-white/70">
            Tasks you can work on
          </p>
        </div>
      </div>

      {/* TIMER + TASK PANEL */}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] sm:gap-5">
        {/* TIMER CARD */}

        <section className={`${card} p-4 sm:p-6 lg:p-8`}>
          <div className="flex flex-wrap justify-center gap-2">
            {(
              [
                "Work",
                "Short break",
                "Long break",
              ] as Mode[]
            ).map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => switchMode(item)}
                aria-pressed={mode === item}
                className={`min-h-11 rounded-xl px-3 py-2.5 text-xs font-medium transition sm:px-5 sm:text-sm ${
                  mode === item
                    ? "bg-[#D8FF56] text-[#20231D]"
                    : "bg-[#343830] text-[#A6AD9B] hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* RESPONSIVE CIRCULAR TIMER */}

          <div className="mx-auto mt-7 aspect-square w-full max-w-[310px] sm:mt-9">
            <div className="relative h-full w-full">
              <svg
                viewBox="0 0 260 260"
                role="img"
                aria-label={`${formatTime(secondsLeft)} remaining in ${mode}`}
                className="absolute inset-0 h-full w-full -rotate-90"
              >
                <circle
                  cx="130"
                  cy="130"
                  r={radius}
                  stroke="#41463E"
                  strokeWidth="9"
                  fill="none"
                />

                <circle
                  cx="130"
                  cy="130"
                  r={radius}
                  stroke={timerColor}
                  strokeWidth="9"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={
                    circumference * (1 - progress)
                  }
                  className="transition-[stroke-dashoffset] duration-200"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-[clamp(2.4rem,10vw,4.5rem)] font-semibold tracking-tight">
                  {formatTime(secondsLeft)}
                </span>

                <span className="mt-2 text-xs uppercase tracking-[0.2em] text-[#A6AD9B]">
                  {mode}
                </span>

                <span
                  className={`mt-4 flex items-center gap-2 text-xs ${
                    running
                      ? "text-[#D8FF56]"
                      : "text-[#A6AD9B]"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      running
                        ? "bg-[#D8FF56]"
                        : "bg-[#8A9484]"
                    }`}
                  />
                  {running ? "Timer running" : "Ready"}
                </span>
              </div>
            </div>
          </div>

          {/* TIMER CONTROLS */}

          <div className="mx-auto mt-7 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={startOrPause}
              className="min-h-12 flex-1 rounded-xl bg-[#D8FF56] px-8 py-3 text-sm font-semibold text-[#20231D] transition hover:bg-[#E8FF9B]"
            >
              {running ? "Pause timer" : "Start focus"}
            </button>

            <button
              type="button"
              onClick={resetTimer}
              className="min-h-12 rounded-xl border border-white/10 bg-[#343830] px-7 py-3 text-sm transition hover:bg-[#41463E]"
            >
              Reset
            </button>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-[#A6AD9B]">
            Work for 25 minutes, then take a short break.
            Every fourth session earns a long break.
          </p>
        </section>

        {/* RIGHT PANEL */}

        <div className="min-w-0 space-y-4 sm:space-y-5">
          {/* SELECT TASK */}

          <section className={`${card} p-4 sm:p-6`}>
            <p className="text-xs uppercase tracking-[0.15em] text-[#A6AD9B]">
              Current focus
            </p>

            <h3 className="mt-2 text-lg font-semibold sm:text-xl">
              What are you working on?
            </h3>

            {openTasks.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-white/10 p-5 text-center">
                <p className="text-sm text-[#A6AD9B]">
                  No open tasks yet.
                </p>

                <button
                  type="button"
                  onClick={onAddClick}
                  className="mt-4 min-h-11 rounded-xl bg-[#D8FF56]/10 px-5 text-sm font-semibold text-[#D8FF56]"
                >
                  + Create task
                </button>
              </div>
            ) : (
              <>
                <label
                  htmlFor="dayflow-focus-task"
                  className="mt-5 block text-xs text-[#A6AD9B]"
                >
                  Select a task
                </label>

                <select
                  id="dayflow-focus-task"
                  value={selectedTask?.id ?? ""}
                  onChange={(event) =>
                    setSelectedTaskId(event.target.value)
                  }
                  className="mt-2 min-h-12 w-full min-w-0 rounded-xl border border-white/10 bg-[#20231F] px-4 text-sm text-[#F5F6F1] outline-none focus:border-[#D8FF56]"
                >
                  {openTasks.map((task) => (
                    <option
                      key={task.id}
                      value={task.id}
                    >
                      {task.title}
                    </option>
                  ))}
                </select>

                {selectedTask && (
                  <div className="mt-4 min-w-0 rounded-xl bg-[#333730] p-4">
                    <p className="break-words text-sm font-semibold">
                      {selectedTask.title}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#B8C1B2]">
                        {selectedTask.category}
                      </span>

                      <span className="rounded-full bg-[#D8FF56]/10 px-3 py-1 text-xs text-[#D8FF56]">
                        {selectedTask.priority}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={completeSelectedTask}
                      className="mt-5 min-h-12 w-full rounded-xl bg-[#D8FF56]/10 px-4 text-sm font-semibold text-[#D8FF56] transition hover:bg-[#D8FF56]/20"
                    >
                      ✓ Mark task complete
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* SESSION CYCLE */}

          <section className={`${card} p-4 sm:p-6`}>
            <p className="text-xs uppercase tracking-[0.15em] text-[#A6AD9B]">
              Pomodoro tracker
            </p>

            <h3 className="mt-2 text-lg font-semibold">
              Session Cycle
            </h3>

            <div className="mt-5 grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`h-3 rounded-full ${
                    index < cycleProgress
                      ? "bg-[#D8FF56]"
                      : "bg-[#41463E]"
                  }`}
                />
              ))}
            </div>

            <p className="mt-4 text-sm text-[#A6AD9B]">
              {cycleProgress === 3
                ? "One more session until a long break."
                : `${cycleProgress} of 4 sessions in this cycle.`}
            </p>

            <p className="mt-3 text-xs text-[#879182]">
              Today's completed work sessions are saved
              in this browser.
            </p>
          </section>
        </div>
      </div>

      {/* TIPS */}

      <section className={`${card} p-4 sm:p-6`}>
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-[#A6AD9B]">
            Better productivity
          </p>

          <h3 className="mt-2 text-lg font-semibold sm:text-xl">
            Your Focus Routine
          </h3>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            {
              number: "01",
              title: "Choose one task",
              description:
                "Pick the task you want to finish.",
            },
            {
              number: "02",
              title: "Start a session",
              description:
                "Focus on your chosen task for 25 minutes.",
            },
            {
              number: "03",
              title: "Take a break",
              description:
                "Recharge before your next session.",
            },
          ].map((tip) => (
            <div
              key={tip.number}
              className="min-w-0 rounded-xl bg-[#333730] p-4"
            >
              <p className="text-xs font-semibold text-[#D8FF56]">
                {tip.number}
              </p>

              <p className="mt-3 text-sm font-semibold">
                {tip.title}
              </p>

              <p className="mt-2 text-xs leading-5 text-[#A6AD9B]">
                {tip.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <section className={`${card} p-4 sm:p-5`}>
      <p className="text-xs text-[#A6AD9B] sm:text-sm">
        {title}
      </p>

      <p className="mt-3 text-3xl font-semibold sm:mt-4 sm:text-4xl">
        {value}
      </p>
    </section>
  );
}

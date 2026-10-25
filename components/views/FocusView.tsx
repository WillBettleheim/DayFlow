"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

type Mode = "Work" | "Short break" | "Long break";

const durations: Record<Mode, number> = {
  Work: 25 * 60,
  "Short break": 5 * 60,
  "Long break": 15 * 60,
};

const priorityRank: Record<string, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

export default function FocusView({
  tasks,
  loading,
  onToggle,
  onAddClick,
}: Props) {
  const openTasks = useMemo(
    () =>
      tasks
        .filter((t) => !t.done)
        .sort(
          (a, b) => priorityRank[a.priority] - priorityRank[b.priority]
        ),
    [tasks]
  );

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("Work");
  const [secondsLeft, setSecondsLeft] = useState(durations.Work);
  const [running, setRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedTask = useMemo(
    () => openTasks.find((t) => t.id === selectedTaskId) ?? null,
    [openTasks, selectedTaskId]
  );

  useEffect(() => {
    if (!selectedTaskId && openTasks.length > 0) {
      setSelectedTaskId(openTasks[0].id);
    }
    if (
      selectedTaskId !== null &&
      !openTasks.some((t) => t.id === selectedTaskId)
    ) {
      setSelectedTaskId(openTasks[0]?.id ?? null);
    }
  }, [openTasks, selectedTaskId]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setRunning(false);

          if (mode === "Work") {
            setSessionsCompleted((c) => c + 1);
            setMode("Short break");
            return durations["Short break"];
          } else {
            setMode("Work");
            return durations.Work;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, mode]);

  function switchMode(next: Mode) {
    setMode(next);
    setRunning(false);
    setSecondsLeft(durations[next]);
  }

  function resetTimer() {
    setRunning(false);
    setSecondsLeft(durations[mode]);
  }

  const totalSeconds = durations[mode];
  const progress = 1 - secondsLeft / totalSeconds;

  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference * (1 - progress);
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-64 w-64 animate-pulse rounded-full bg-white/[0.03]" />
      </div>
    );
  }

  if (openTasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-[#121620] p-12 text-center">
        <p className="text-sm text-gray-400">
          No open tasks to focus on. Add one to get started.
        </p>
        <button
          onClick={onAddClick}
          className="mt-3 text-sm text-violet-300 transition hover:text-violet-200"
        >
          + Add a task →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Focus</h2>
          <p className="mt-1 text-sm text-gray-500">
            {sessionsCompleted} session
            {sessionsCompleted === 1 ? "" : "s"} completed today
          </p>
        </div>

        <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1">
          {(["Work", "Short break", "Long break"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`rounded-lg px-4 py-1.5 text-sm transition ${
                mode === m
                  ? "bg-violet-500/20 font-medium text-violet-200"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121620] p-8">
        <div className="mb-6">
          <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-gray-500">
            Working on
          </label>
          <select
            value={selectedTaskId ?? ""}
            onChange={(e) => setSelectedTaskId(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-[#0b0d12] px-4 py-3 text-sm text-white outline-none focus:border-violet-400"
          >
            {openTasks.map((task) => (
              <option key={task.id} value={task.id}>
                [{task.priority}] {task.title} — {task.category}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="relative flex h-72 w-72 items-center justify-center">
            <svg
              className="absolute inset-0 -rotate-90"
              viewBox="0 0 260 260"
            >
              <circle
                cx="130"
                cy="130"
                r="120"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
              />
              <circle
                cx="130"
                cy="130"
                r="120"
                fill="none"
                stroke={
                  mode === "Work"
                    ? "rgb(167 139 250)"
                    : mode === "Short break"
                    ? "rgb(52 211 153)"
                    : "rgb(96 165 250)"
                }
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>

            <div className="flex flex-col items-center">
              <p className="font-mono text-6xl font-bold tracking-tight text-white">
                {formatTime(secondsLeft)}
              </p>
              <p className="mt-2 text-xs uppercase tracking-widest text-gray-500">
                {mode}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setRunning((r) => !r)}
              className={`rounded-xl px-8 py-3 text-sm font-semibold transition ${
                running
                  ? "bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"
                  : "bg-violet-500 text-white hover:bg-violet-400"
              }`}
            >
              {running ? "Pause" : "Start"}
            </button>

            <button
              onClick={resetTimer}
              className="rounded-xl border border-white/10 px-6 py-3 text-sm text-gray-300 transition hover:bg-white/5"
            >
              Reset
            </button>

            {selectedTask && (
              <button
                onClick={() => {
                  onToggle(selectedTask.id);
                  setRunning(false);
                  resetTimer();
                }}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
              >
                ✓ Complete task
              </button>
            )}
          </div>

          {selectedTask && (
            <div className="mt-2 w-full max-w-md rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
              <p className="text-sm text-gray-400">
                {selectedTask.title}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {selectedTask.category} · {selectedTask.priority} priority
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121620] p-5">
        <h3 className="text-sm font-semibold text-gray-300">
          Focus tips
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-500">
          <li>· Pick one task — avoid multitasking.</li>
          <li>· 25 minutes work, then a 5 minute break.</li>
          <li>· Every 4 work sessions, take a 15 minute break.</li>
          <li>· Complete the task when done — it keeps your streak alive.</li>
        </ul>
      </div>
    </div>
  );
}
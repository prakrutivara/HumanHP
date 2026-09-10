"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Goal = {
  id: string;
  title: string;
  goal_type: string;
  target_value: number | null;
  current_value: number;
  target_unit: string | null;
  start_date: string;
  target_date: string | null;
  status: "active" | "completed" | "paused";
  created_at: string;
  updated_at: string;
};

type DateChoice = "today" | "tomorrow" | "custom";

function getLocalDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calculateProgress(
  currentValue: number,
  targetValue: number | null,
) {
  if (
    targetValue === null ||
    targetValue <= 0 ||
    currentValue < 0
  ) {
    return null;
  }

  return Math.min((currentValue / targetValue) * 100, 100);
}

function formatValue(value: number | null) {
  if (value === null) {
    return "—";
  }

  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(1);
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");

  return `${day}/${month}/${year}`;
}

export default function GoalsPage() {
  const today = getLocalDate();
  const tomorrow = getLocalDate(1);

  /* =========================================================
     CREATE GOAL STATE
  ========================================================= */

  const [showCreateGoal, setShowCreateGoal] =
    useState(false);

  const [title, setTitle] = useState("");
  const [goalType, setGoalType] = useState("Fitness");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("0");
  const [targetUnit, setTargetUnit] = useState("");

  const [startChoice, setStartChoice] =
    useState<DateChoice>("today");

  const [customStartDate, setCustomStartDate] =
    useState(today);

  const [targetChoice, setTargetChoice] =
    useState<DateChoice>("tomorrow");

  const [customTargetDate, setCustomTargetDate] =
    useState(tomorrow);

  /* =========================================================
     DATA
  ========================================================= */

  const [goals, setGoals] = useState<Goal[]>([]);

  /* =========================================================
     LOG PROGRESS STATE
  ========================================================= */

  const [loggingGoalId, setLoggingGoalId] =
    useState<string | null>(null);

  const [progressAmount, setProgressAmount] =
    useState("");

  const [progressDateChoice, setProgressDateChoice] =
    useState<"today" | "custom">("today");

  const [progressCustomDate, setProgressCustomDate] =
    useState(today);

  /* =========================================================
     UI STATE
  ========================================================= */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProgress, setSavingProgress] =
    useState(false);

  const [deletingGoalId, setDeletingGoalId] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");

  /* =========================================================
     CREATE GOAL DATES
  ========================================================= */

  const startDate =
    startChoice === "today"
      ? today
      : customStartDate;

  const targetDate =
    targetChoice === "today"
      ? today
      : targetChoice === "tomorrow"
        ? tomorrow
        : customTargetDate;

  /* =========================================================
     PROGRESS LOG DATE
  ========================================================= */

  const progressDate =
    progressDateChoice === "today"
      ? today
      : progressCustomDate;

  /* =========================================================
     LOAD GOALS
  ========================================================= */

  async function loadGoals() {
    const supabase =
      createBrowserSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("goals")
      .select(
        "id, title, goal_type, target_value, current_value, target_unit, start_date, target_date, status, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setMessage(error.message);
    } else {
      setGoals(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadGoals();
  }, []);

  /* =========================================================
     ACTIVE GOALS
  ========================================================= */

  const activeGoals = useMemo(() => {
    return goals.filter(
      (goal) => goal.status === "active",
    );
  }, [goals]);

  /* =========================================================
     RESET CREATE FORM
  ========================================================= */

  function resetCreateForm() {
    setTitle("");
    setTargetValue("");
    setCurrentValue("0");
    setTargetUnit("");

    setStartChoice("today");
    setCustomStartDate(today);

    setTargetChoice("tomorrow");
    setCustomTargetDate(tomorrow);
  }

  /* =========================================================
     CREATE GOAL
  ========================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setMessage("Please enter a goal name.");
      return;
    }

    if (!targetValue) {
      setMessage("Please enter a target value.");
      return;
    }

    const target = Number(targetValue);
    const current = Number(
      currentValue || 0,
    );

    if (
      !Number.isFinite(target) ||
      target <= 0
    ) {
      setMessage(
        "Target value must be greater than zero.",
      );
      return;
    }

    if (
      !Number.isFinite(current) ||
      current < 0
    ) {
      setMessage(
        "Current progress cannot be negative.",
      );
      return;
    }

    if (current > target) {
      setMessage(
        "Current progress cannot be greater than the target.",
      );
      return;
    }

    if (targetDate < startDate) {
      setMessage(
        "Target date cannot be before the start date.",
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const supabase =
      createBrowserSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Your session has expired. Please log in again.",
      );
      setSaving(false);
      return;
    }

    const progress =
      calculateProgress(
        current,
        target,
      );

    const { error } =
      await supabase
        .from("goals")
        .insert({
          user_id: user.id,
          title: title.trim(),
          goal_type: goalType,
          target_value: target,
          current_value: current,
          target_unit:
            targetUnit.trim() || null,
          start_date: startDate,
          target_date: targetDate,
          status:
            progress !== null &&
            progress >= 100
              ? "completed"
              : "active",
        });

    if (error) {
      setMessage(error.message);
    } else {
      resetCreateForm();
      setShowCreateGoal(false);

      setMessage("Goal created.");

      await loadGoals();
    }

    setSaving(false);
  }

  /* =========================================================
     START LOGGING PROGRESS
  ========================================================= */

  function startLoggingProgress(goalId: string) {
    setLoggingGoalId(goalId);
    setProgressAmount("");
    setProgressDateChoice("today");
    setProgressCustomDate(today);
    setMessage("");
  }

  /* =========================================================
     CANCEL LOGGING
  ========================================================= */

  function cancelLoggingProgress() {
    setLoggingGoalId(null);
    setProgressAmount("");
    setMessage("");
  }

  /* =========================================================
     LOG PROGRESS
  ========================================================= */

  async function handleProgressSubmit(
    event: FormEvent<HTMLFormElement>,
    goal: Goal,
  ) {
    event.preventDefault();

    if (!progressAmount) {
      setMessage(
        "Enter the amount you completed.",
      );
      return;
    }

    const amount = Number(
      progressAmount,
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setMessage(
        "Progress must be greater than zero.",
      );
      return;
    }

    const target =
      goal.target_value !== null
        ? Number(goal.target_value)
        : null;

    const current =
      Number(goal.current_value) || 0;

    const newCurrent =
      current + amount;

    if (
      target !== null &&
      newCurrent > target
    ) {
      setMessage(
        `This would exceed your target of ${formatValue(
          target,
        )} ${goal.target_unit ?? ""}.`,
      );
      return;
    }

    setSavingProgress(true);
    setMessage("");

    const supabase =
      createBrowserSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Your session has expired. Please log in again.",
      );
      setSavingProgress(false);
      return;
    }

    const progress =
      calculateProgress(
        newCurrent,
        target,
      );

    const { error } =
      await supabase
        .from("goals")
        .update({
          current_value: newCurrent,
          status:
            progress !== null &&
            progress >= 100
              ? "completed"
              : "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", goal.id)
        .eq("user_id", user.id);

    if (error) {
      setMessage(error.message);
    } else {
      setLoggingGoalId(null);
      setProgressAmount("");

      setMessage(
        progress !== null &&
        progress >= 100
          ? "Goal completed!"
          : `Progress logged for ${formatDate(
              progressDate,
            )}.`,
      );

      await loadGoals();
    }

    setSavingProgress(false);
  }

  /* =========================================================
     DELETE GOAL
  ========================================================= */

  async function handleDeleteGoal(
    goal: Goal,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${goal.title}"?\n\nThis action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingGoalId(goal.id);
    setMessage("");

    const supabase =
      createBrowserSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Your session has expired. Please log in again.",
      );
      setDeletingGoalId(null);
      return;
    }

    const { error } =
      await supabase
        .from("goals")
        .delete()
        .eq("id", goal.id)
        .eq("user_id", user.id);

    if (error) {
      setMessage(error.message);
    } else {
      setGoals((current) =>
        current.filter(
          (item) => item.id !== goal.id,
        ),
      );

      if (
        loggingGoalId === goal.id
      ) {
        setLoggingGoalId(null);
      }

      setMessage("Goal deleted.");
    }

    setDeletingGoalId(null);
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <AppShell currentPath="/dashboard/goals">
      <div className="max-w-3xl">
        <Link
          href="/dashboard"
          className="text-sm text-muted hover:text-ink"
        >
          ← Back to HUMANHP
        </Link>

        {/* HEADER */}

        <div className="mt-8 flex items-start justify-between gap-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              HUMANHP
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Goals
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
              Track what you are working toward
              and log progress as you go.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowCreateGoal(
                (current) => !current,
              );
              setMessage("");
            }}
            className="shrink-0 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            {showCreateGoal
              ? "Close"
              : "+ Create goal"}
          </button>
        </div>

        {/* =====================================================
            CREATE GOAL
        ===================================================== */}

        {showCreateGoal ? (
          <div className="mt-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              CREATE GOAL
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              What are you working toward?
            </h2>

            <Card>
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* GOAL */}

                <div>
                  <label
                    htmlFor="goal-title"
                    className="text-sm font-medium"
                  >
                    Goal
                  </label>

                  <input
                    id="goal-title"
                    type="text"
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value,
                      )
                    }
                    placeholder="Walk 10 km"
                    className="mt-2 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                    required
                  />
                </div>

                {/* TYPE */}

                <div>
                  <label
                    htmlFor="goal-type"
                    className="text-sm font-medium"
                  >
                    Goal type
                  </label>

                  <select
                    id="goal-type"
                    value={goalType}
                    onChange={(e) =>
                      setGoalType(
                        e.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                  >
                    <option value="Fitness">
                      Fitness
                    </option>
                    <option value="Nutrition">
                      Nutrition
                    </option>
                    <option value="Wellness">
                      Wellness
                    </option>
                    <option value="Health">
                      Health
                    </option>
                    <option value="Personal">
                      Personal
                    </option>
                  </select>
                </div>

                {/* TARGET + UNIT */}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="target-value"
                      className="text-sm font-medium"
                    >
                      Target
                    </label>

                    <input
                      id="target-value"
                      type="number"
                      min="0"
                      step="0.1"
                      value={targetValue}
                      onChange={(e) =>
                        setTargetValue(
                          e.target.value,
                        )
                      }
                      placeholder="10"
                      className="mt-2 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="target-unit"
                      className="text-sm font-medium"
                    >
                      Unit
                    </label>

                    <input
                      id="target-unit"
                      type="text"
                      value={targetUnit}
                      onChange={(e) =>
                        setTargetUnit(
                          e.target.value,
                        )
                      }
                      placeholder="km"
                      className="mt-2 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                    />
                  </div>
                </div>

                {/* INITIAL PROGRESS */}

                <div>
                  <label
                    htmlFor="current-value"
                    className="text-sm font-medium"
                  >
                    Already completed
                  </label>

                  <input
                    id="current-value"
                    type="number"
                    min="0"
                    step="0.1"
                    value={currentValue}
                    onChange={(e) =>
                      setCurrentValue(
                        e.target.value,
                      )
                    }
                    placeholder="0"
                    className="mt-2 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                  />

                  <p className="mt-1 text-xs text-muted">
                    Optional. You can start at 0
                    and log progress later.
                  </p>
                </div>

                {/* START DATE */}

                <div>
                  <p className="text-sm font-medium">
                    Start date
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setStartChoice(
                          "today",
                        )
                      }
                      className={`rounded-md border px-3 py-2 text-sm ${
                        startChoice === "today"
                          ? "border-ink bg-ink text-white"
                          : "border-line bg-background text-ink"
                      }`}
                    >
                      Today
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setStartChoice(
                          "custom",
                        )
                      }
                      className={`rounded-md border px-3 py-2 text-sm ${
                        startChoice === "custom"
                          ? "border-ink bg-ink text-white"
                          : "border-line bg-background text-ink"
                      }`}
                    >
                      Select a date
                    </button>
                  </div>

                  {startChoice === "custom" ? (
                    <input
                      type="date"
                      value={
                        customStartDate
                      }
                      onChange={(e) =>
                        setCustomStartDate(
                          e.target.value,
                        )
                      }
                      className="mt-3 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                      required
                    />
                  ) : null}

                  <p className="mt-2 text-xs text-muted">
                    Start:{" "}
                    {formatDate(startDate)}
                  </p>
                </div>

                {/* TARGET DATE */}

                <div>
                  <p className="text-sm font-medium">
                    Target date
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setTargetChoice(
                          "today",
                        )
                      }
                      className={`rounded-md border px-3 py-2 text-sm ${
                        targetChoice === "today"
                          ? "border-ink bg-ink text-white"
                          : "border-line bg-background text-ink"
                      }`}
                    >
                      Today
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setTargetChoice(
                          "tomorrow",
                        )
                      }
                      className={`rounded-md border px-3 py-2 text-sm ${
                        targetChoice ===
                        "tomorrow"
                          ? "border-ink bg-ink text-white"
                          : "border-line bg-background text-ink"
                      }`}
                    >
                      Tomorrow
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setTargetChoice(
                          "custom",
                        )
                      }
                      className={`rounded-md border px-3 py-2 text-sm ${
                        targetChoice ===
                        "custom"
                          ? "border-ink bg-ink text-white"
                          : "border-line bg-background text-ink"
                      }`}
                    >
                      Select a date
                    </button>
                  </div>

                  {targetChoice ===
                  "custom" ? (
                    <input
                      type="date"
                      min={startDate}
                      value={
                        customTargetDate
                      }
                      onChange={(e) =>
                        setCustomTargetDate(
                          e.target.value,
                        )
                      }
                      className="mt-3 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                      required
                    />
                  ) : null}

                  <p className="mt-2 text-xs text-muted">
                    Target:{" "}
                    {formatDate(
                      targetDate,
                    )}
                  </p>
                </div>

                {/* BUTTON */}

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Creating..."
                    : "Create goal"}
                </button>
              </form>
            </Card>
          </div>
        ) : null}

        {/* =====================================================
            ACTIVE GOALS
        ===================================================== */}

        <div className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                YOUR GOALS
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Current goals
              </h2>
            </div>

            <p className="text-xs text-muted">
              {activeGoals.length} active
            </p>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-muted">
              Loading...
            </p>
          ) : activeGoals.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">
                No active goals yet.
              </p>

              {!showCreateGoal ? (
                <button
                  type="button"
                  onClick={() =>
                    setShowCreateGoal(
                      true,
                    )
                  }
                  className="mt-3 text-sm font-medium underline underline-offset-4"
                >
                  Create your first goal
                </button>
              ) : null}
            </Card>
          ) : (
            <div className="mt-4 space-y-4">
              {activeGoals.map((goal) => {
                const progress =
                  calculateProgress(
                    Number(
                      goal.current_value,
                    ),
                    goal.target_value !==
                    null
                      ? Number(
                          goal.target_value,
                        )
                      : null,
                  );

                const isLogging =
                  loggingGoalId ===
                  goal.id;

                return (
                  <Card key={goal.id}>
                    {/* HEADER */}

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">
                          {goal.title}
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          {goal.goal_type}
                        </p>
                      </div>

                      {progress !== null ? (
                        <p className="text-sm font-medium">
                          {progress.toFixed(
                            0,
                          )}
                          %
                        </p>
                      ) : null}
                    </div>

                    {/* PROGRESS BAR */}

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-ink transition-all"
                        style={{
                          width: `${
                            progress ?? 0
                          }%`,
                        }}
                      />
                    </div>

                    {/* PROGRESS INFO */}

                    <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted">
                      <span>
                        {formatValue(
                          Number(
                            goal.current_value,
                          ),
                        )}{" "}
                        {goal.target_unit ??
                          ""}{" "}
                        /{" "}
                        {formatValue(
                          goal.target_value !==
                            null
                            ? Number(
                                goal.target_value,
                              )
                            : null,
                        )}{" "}
                        {goal.target_unit ??
                          ""}
                      </span>

                      {goal.target_date ? (
                        <span>
                          Target:{" "}
                          {formatDate(
                            goal.target_date,
                          )}
                        </span>
                      ) : null}
                    </div>

                    {/* ACTIONS */}

                    {!isLogging ? (
                      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            startLoggingProgress(
                              goal.id,
                            )
                          }
                          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                        >
                          Log progress
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteGoal(
                              goal,
                            )
                          }
                          disabled={
                            deletingGoalId ===
                            goal.id
                          }
                          className="text-xs text-muted hover:text-ink hover:underline disabled:opacity-50"
                        >
                          {deletingGoalId ===
                          goal.id
                            ? "Deleting..."
                            : "Delete goal"}
                        </button>
                      </div>
                    ) : (
                      /* =================================================
                         LOG PROGRESS FORM
                      ================================================= */

                      <form
                        onSubmit={(event) =>
                          handleProgressSubmit(
                            event,
                            goal,
                          )
                        }
                        className="mt-5 border-t border-line pt-5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium">
                              Log progress
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              Add what you
                              completed for
                              this goal.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={
                              cancelLoggingProgress
                            }
                            className="text-xs text-muted hover:text-ink hover:underline"
                          >
                            Cancel
                          </button>
                        </div>

                        {/* AMOUNT */}

                        <div className="mt-4">
                          <label
                            htmlFor={`progress-${goal.id}`}
                            className="text-sm font-medium"
                          >
                            Amount completed
                          </label>

                          <div className="mt-2 flex items-center gap-2">
                            <input
                              id={`progress-${goal.id}`}
                              type="number"
                              min="0"
                              step="0.1"
                              value={
                                progressAmount
                              }
                              onChange={(e) =>
                                setProgressAmount(
                                  e.target
                                    .value,
                                )
                              }
                              placeholder="5"
                              className="w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                              autoFocus
                            />

                            <span className="shrink-0 text-sm text-muted">
                              {goal.target_unit ??
                                "units"}
                            </span>
                          </div>
                        </div>

                        {/* DATE */}

                        <div className="mt-5">
                          <p className="text-sm font-medium">
                            Date
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setProgressDateChoice(
                                  "today",
                                )
                              }
                              className={`rounded-md border px-3 py-2 text-sm ${
                                progressDateChoice ===
                                "today"
                                  ? "border-ink bg-ink text-white"
                                  : "border-line bg-background text-ink"
                              }`}
                            >
                              Today
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setProgressDateChoice(
                                  "custom",
                                )
                              }
                              className={`rounded-md border px-3 py-2 text-sm ${
                                progressDateChoice ===
                                "custom"
                                  ? "border-ink bg-ink text-white"
                                  : "border-line bg-background text-ink"
                              }`}
                            >
                              Select date
                            </button>
                          </div>

                          {progressDateChoice ===
                          "custom" ? (
                            <input
                              type="date"
                              value={
                                progressCustomDate
                              }
                              onChange={(e) =>
                                setProgressCustomDate(
                                  e.target
                                    .value,
                                )
                              }
                              className="mt-3 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                              required
                            />
                          ) : (
                            <p className="mt-2 text-xs text-muted">
                              {formatDate(
                                today,
                              )}
                            </p>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={
                            savingProgress
                          }
                          className="mt-5 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingProgress
                            ? "Logging..."
                            : "Log progress"}
                        </button>
                      </form>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* =====================================================
            HISTORY
        ===================================================== */}

        {goals.some(
          (goal) =>
            goal.status !== "active",
        ) ? (
          <div className="mt-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              HISTORY
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Completed and paused
            </h2>

            <div className="mt-4 space-y-3">
              {goals
                .filter(
                  (goal) =>
                    goal.status !==
                    "active",
                )
                .map((goal) => {
                  const progress =
                    calculateProgress(
                      Number(
                        goal.current_value,
                      ),
                      goal.target_value !==
                      null
                        ? Number(
                            goal.target_value,
                          )
                        : null,
                    );

                  return (
                    <Card key={goal.id}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">
                            {goal.title}
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            {goal.goal_type}
                          </p>
                        </div>

                        <span className="text-xs capitalize text-muted">
                          {goal.status}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted">
                        <span>
                          {formatValue(
                            Number(
                              goal.current_value,
                            ),
                          )}{" "}
                          {goal.target_unit ??
                            ""}{" "}
                          /{" "}
                          {formatValue(
                            goal.target_value !==
                              null
                              ? Number(
                                  goal.target_value,
                                )
                              : null,
                          )}{" "}
                          {goal.target_unit ??
                            ""}
                        </span>

                        {progress !== null ? (
                          <span>
                            {progress.toFixed(
                              0,
                            )}
                            %
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 border-t border-line pt-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteGoal(
                              goal,
                            )
                          }
                          disabled={
                            deletingGoalId ===
                            goal.id
                          }
                          className="text-xs text-muted hover:text-ink hover:underline disabled:opacity-50"
                        >
                          {deletingGoalId ===
                          goal.id
                            ? "Deleting..."
                            : "Delete goal"}
                        </button>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>
        ) : null}

        {/* MESSAGE */}

        {message ? (
          <p className="mt-5 text-sm text-muted">
            {message}
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
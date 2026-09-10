"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type FitnessLog = {
  id: string;
  activity_date: string;
  activity_type: string;
  duration_minutes: number | null;
  distance_km: number | null;
  notes: string | null;
  created_at: string;
};

const DISTANCE_ACTIVITIES = new Set([
  "Running",
  "Walking",
  "Cycling",
  "Swimming",
]);

function getToday() {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60 * 1000)
    .toISOString()
    .split("T")[0];
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function calculateMetric(
  activityType: string,
  distanceKm: number | null,
  durationMinutes: number | null,
) {
  if (
    distanceKm === null ||
    durationMinutes === null ||
    distanceKm <= 0 ||
    durationMinutes <= 0
  ) {
    return null;
  }

  if (activityType === "Running" || activityType === "Walking") {
    const paceMinutes = durationMinutes / distanceKm;
    const minutes = Math.floor(paceMinutes);
    const seconds = Math.round((paceMinutes - minutes) * 60);

    if (seconds === 60) {
      return `Pace: ${minutes + 1}:00 min/km`;
    }

    return `Pace: ${minutes}:${seconds
      .toString()
      .padStart(2, "0")} min/km`;
  }

  if (activityType === "Cycling") {
    const speed = distanceKm / (durationMinutes / 60);
    return `Speed: ${speed.toFixed(1)} km/h`;
  }

  if (activityType === "Swimming") {
    return `Distance: ${distanceKm} km`;
  }

  return null;
}

export default function FitnessPage() {
  const [activityDate, setActivityDate] = useState(getToday());
  const [dateMode, setDateMode] = useState<"today" | "select">("today");

  const [activityType, setActivityType] = useState("Running");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [notes, setNotes] = useState("");

  const [logs, setLogs] = useState<FitnessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const hasDistance = DISTANCE_ACTIVITIES.has(activityType);

  function handleToday() {
    setDateMode("today");
    setActivityDate(getToday());
  }

  function handleSelectDate() {
    setDateMode("select");
  }

  function handleActivityChange(value: string) {
    setActivityType(value);

    // Clear distance when switching to an activity
    // where distance does not make sense.
    if (!DISTANCE_ACTIVITIES.has(value)) {
      setDistance("");
    }
  }

  async function loadLogs() {
    const supabase = createBrowserSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("fitness_logs")
      .select(
        "id, activity_date, activity_type, duration_minutes, distance_km, notes, created_at",
      )
      .eq("user_id", user.id)
      .order("activity_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setLogs(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadLogs();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activityType) {
      setMessage("Please select an activity.");
      return;
    }

    if (!duration) {
      setMessage("Please enter the duration.");
      return;
    }

    if (!activityDate) {
      setMessage("Please select a date.");
      return;
    }

    setSaving(true);
    setMessage("");

    const supabase = createBrowserSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Your session has expired. Please log in again.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("fitness_logs").insert({
      user_id: user.id,
      activity_date: activityDate,
      activity_type: activityType,
      duration_minutes: Number(duration),
      distance_km:
        hasDistance && distance ? Number(distance) : null,
      notes: notes.trim() || null,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setDuration("");
      setDistance("");
      setNotes("");

      setDateMode("today");
      setActivityDate(getToday());

      setMessage("Fitness activity saved.");
      await loadLogs();
    }

    setSaving(false);
  }

  return (
    <AppShell currentPath="/dashboard/fitness">
      <div className="max-w-3xl">
        <Link
          href="/dashboard"
          className="text-sm text-muted hover:text-ink"
        >
          ← Back to HUMANHP
        </Link>

        <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          HUMANHP
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Fitness
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Record workouts, running and movement.
        </p>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* DATE */}
            <div>
              <label className="text-sm font-medium">
                Date
              </label>

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleToday}
                  className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                    dateMode === "today"
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-background text-ink hover:bg-black/[0.03]"
                  }`}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={handleSelectDate}
                  className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                    dateMode === "select"
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-background text-ink hover:bg-black/[0.03]"
                  }`}
                >
                  Select date
                </button>
              </div>

              {dateMode === "today" ? (
                <p className="mt-2 text-sm text-muted">
                  {formatDate(activityDate)}
                </p>
              ) : (
                <input
                  type="date"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  className="mt-3 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                  required
                />
              )}
            </div>

            {/* ACTIVITY */}
            <div>
              <label
                htmlFor="activity-type"
                className="text-sm font-medium"
              >
                Activity
              </label>

              <select
                id="activity-type"
                value={activityType}
                onChange={(e) => handleActivityChange(e.target.value)}
                className="mt-2 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
              >
                <option value="Running">Running</option>
                <option value="Walking">Walking</option>
                <option value="Cycling">Cycling</option>
                <option value="Swimming">Swimming</option>
                <option value="Gym">Gym</option>
                <option value="Yoga">Yoga</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* DURATION + DISTANCE */}
            <div
              className={
                hasDistance ? "grid gap-5 sm:grid-cols-2" : ""
              }
            >
              <div>
                <label
                  htmlFor="duration"
                  className="text-sm font-medium"
                >
                  Duration
                </label>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    id="duration"
                    type="number"
                    min="0"
                    step="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="60"
                    className="w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                    required
                  />

                  <span className="text-sm text-muted">
                    min
                  </span>
                </div>
              </div>

              {hasDistance ? (
                <div>
                  <label
                    htmlFor="distance"
                    className="text-sm font-medium"
                  >
                    Distance
                  </label>

                  <div className="mt-2 flex items-center gap-2">
                    <input
                      id="distance"
                      type="number"
                      min="0"
                      step="0.01"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      placeholder="5"
                      className="w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                    />

                    <span className="text-sm text-muted">
                      km
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* NOTES */}
            <div>
              <label
                htmlFor="fitness-notes"
                className="text-sm font-medium"
              >
                Notes
              </label>

              <textarea
                id="fitness-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you do? How did it feel?"
                rows={3}
                className="mt-2 w-full rounded-md border border-line bg-background px-3 py-3 text-sm outline-none focus:border-ink"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save fitness activity"}
            </button>

            {message ? (
              <p className="text-sm text-muted">{message}</p>
            ) : null}
          </form>
        </Card>

        {/* HISTORY */}
        <div className="mt-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            HISTORY
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Recent activity
          </h2>

          {loading ? (
            <p className="mt-4 text-sm text-muted">
              Loading...
            </p>
          ) : logs.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">
                No fitness activity recorded yet.
              </p>
            </Card>
          ) : (
            <div className="mt-4 space-y-3">
              {logs.map((log) => {
                const metric = calculateMetric(
                  log.activity_type,
                  log.distance_km,
                  log.duration_minutes,
                );

                return (
                  <Card key={log.id}>
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <p className="text-sm font-medium">
                          {log.activity_type}
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          {formatDate(log.activity_date)}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
                          {log.duration_minutes !== null ? (
                            <span>
                              Duration: {log.duration_minutes} min
                            </span>
                          ) : null}

                          {log.distance_km !== null ? (
                            <span>
                              Distance: {log.distance_km} km
                            </span>
                          ) : null}

                          {metric ? <span>{metric}</span> : null}
                        </div>

                        {log.notes ? (
                          <p className="mt-3 text-sm leading-relaxed text-muted">
                            {log.notes}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type WellnessLog = {
  id: string;
  log_date: string;
  sleep_hours: number | null;
  water_liters: number | null;
  energy: number | null;
  mood: number | null;
  notes: string | null;
  created_at: string;
};

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

export default function WellnessPage() {
  const [logDate, setLogDate] = useState(getToday());
  const [dateMode, setDateMode] = useState<"today" | "select">("today");

  const [sleepHours, setSleepHours] = useState("");
  const [waterLiters, setWaterLiters] = useState("");
  const [energy, setEnergy] = useState("");
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");

  const [logs, setLogs] = useState<WellnessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
      .from("wellness_logs")
      .select(
        "id, log_date, sleep_hours, water_liters, energy, mood, notes, created_at",
      )
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
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

  function handleToday() {
    setDateMode("today");
    setLogDate(getToday());
  }

  function handleSelectDate() {
    setDateMode("select");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

    const { error } = await supabase.from("wellness_logs").insert({
      user_id: user.id,
      log_date: logDate,
      sleep_hours: sleepHours ? Number(sleepHours) : null,
      water_liters: waterLiters ? Number(waterLiters) : null,
      energy: energy ? Number(energy) : null,
      mood: mood ? Number(mood) : null,
      notes: notes.trim() || null,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setSleepHours("");
      setWaterLiters("");
      setEnergy("");
      setMood("");
      setNotes("");

      setDateMode("today");
      setLogDate(getToday());

      setMessage("Wellness log saved.");
      await loadLogs();
    }

    setSaving(false);
  }

  return (
    <AppShell currentPath="/dashboard/wellness">
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
          Wellness
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Track sleep, water, energy and mood.
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
                  {formatDate(logDate)}
                </p>
              ) : (
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="mt-3 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                  required
                />
              )}
            </div>

            {/* SLEEP + WATER */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="sleep"
                  className="text-sm font-medium"
                >
                  Sleep
                </label>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    id="sleep"
                    type="number"
                    min="0"
                    max="24"
                    step="0.25"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    placeholder="7.5"
                    className="w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                  />

                  <span className="text-sm text-muted">
                    hours
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="water"
                  className="text-sm font-medium"
                >
                  Water
                </label>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    id="water"
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={waterLiters}
                    onChange={(e) => setWaterLiters(e.target.value)}
                    placeholder="2.0"
                    className="w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                  />

                  <span className="text-sm text-muted">
                    L
                  </span>
                </div>
              </div>
            </div>

            {/* ENERGY + MOOD */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="energy"
                  className="text-sm font-medium"
                >
                  Energy
                </label>

                <select
                  id="energy"
                  value={energy}
                  onChange={(e) => setEnergy(e.target.value)}
                  className="mt-2 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                >
                  <option value="">Not recorded</option>
                  <option value="1">1 — Very low</option>
                  <option value="2">2 — Low</option>
                  <option value="3">3 — Okay</option>
                  <option value="4">4 — Good</option>
                  <option value="5">5 — Very good</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="mood"
                  className="text-sm font-medium"
                >
                  Mood
                </label>

                <select
                  id="mood"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="mt-2 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                >
                  <option value="">Not recorded</option>
                  <option value="1">1 — Very low</option>
                  <option value="2">2 — Low</option>
                  <option value="3">3 — Okay</option>
                  <option value="4">4 — Good</option>
                  <option value="5">5 — Very good</option>
                </select>
              </div>
            </div>

            {/* NOTES */}
            <div>
              <label
                htmlFor="notes"
                className="text-sm font-medium"
              >
                Notes
              </label>

              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything else worth recording..."
                rows={3}
                className="mt-2 w-full resize-none rounded-md border border-line bg-background px-3 py-3 text-sm outline-none focus:border-ink"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save wellness log"}
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
            Recent wellness logs
          </h2>

          {loading ? (
            <p className="mt-4 text-sm text-muted">
              Loading...
            </p>
          ) : logs.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">
                No wellness logs recorded yet.
              </p>
            </Card>
          ) : (
            <div className="mt-4 space-y-3">
              {logs.map((log) => (
                <Card key={log.id}>
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-sm font-medium">
                        {formatDate(log.log_date)}
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted sm:grid-cols-4">
                        <span>
                          Sleep:{" "}
                          {log.sleep_hours !== null
                            ? `${log.sleep_hours} h`
                            : "—"}
                        </span>

                        <span>
                          Water:{" "}
                          {log.water_liters !== null
                            ? `${log.water_liters} L`
                            : "—"}
                        </span>

                        <span>
                          Energy: {log.energy ?? "—"}/5
                        </span>

                        <span>
                          Mood: {log.mood ?? "—"}/5
                        </span>
                      </div>

                      {log.notes ? (
                        <p className="mt-3 text-sm leading-relaxed text-muted">
                          {log.notes}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
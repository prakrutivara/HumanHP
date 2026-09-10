"use client";

import { useEffect, useMemo, useState } from "react";
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

type FitnessLog = {
  id: string;
  activity_date: string;
  activity_type: string;
  duration_minutes: number | null;
  distance_km: number | null;
  notes: string | null;
  created_at: string;
};

type NutritionLog = {
  id: string;
  meal_date: string;
  meal_type: string;
  calories: number | null;
  protein_g: number | null;
  notes: string | null;
  created_at: string;
};

type HealthEvent = {
  id: string;
  event_date: string;
  description: string;
  severity: number;
  created_at: string;
};

type HealthAssessment = {
  id: string;
  user_message: string;
  assessment: {
    symptoms?: {
      name: string;
      severity: number;
      duration: string;
    }[];
    possible_explanations?: {
      name: string;
      reason: string;
    }[];
    doctor_urgency?: {
      level: "LOW" | "MODERATE" | "HIGH";
      reason: string;
    };
    warning_signs?: string[];
  };
  created_at: string;
};

type ScoreBreakdown = {
  wellness: number;
  fitness: number;
  nutrition: number;
  healthPenalty: number;
  total: number;
};

function getLocalDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return (
    values.reduce(
      (sum, value) => sum + value,
      0
    ) / values.length
  );
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    Math.max(value, min),
    max
  );
}

function calculateWellnessScore(
  logs: WellnessLog[]
) {
  if (logs.length === 0) {
    return null;
  }

  const sleepValues = logs
    .map((log) => log.sleep_hours)
    .filter(
      (value): value is number =>
        typeof value === "number"
    );

  const waterValues = logs
    .map((log) => log.water_liters)
    .filter(
      (value): value is number =>
        typeof value === "number"
    );

  const energyValues = logs
    .map((log) => log.energy)
    .filter(
      (value): value is number =>
        typeof value === "number"
    );

  const moodValues = logs
    .map((log) => log.mood)
    .filter(
      (value): value is number =>
        typeof value === "number"
    );

  let points = 0;
  let availablePoints = 0;

  const sleep = average(sleepValues);

  if (sleep !== null) {
    availablePoints += 10;

    points +=
      clamp(sleep / 8, 0, 1) * 10;
  }

  const water = average(waterValues);

  if (water !== null) {
    availablePoints += 8;

    points +=
      clamp(water / 2, 0, 1) * 8;
  }

  const energy = average(energyValues);

  if (energy !== null) {
    availablePoints += 9;

    points +=
      clamp(energy / 5, 0, 1) * 9;
  }

  const mood = average(moodValues);

  if (mood !== null) {
    availablePoints += 8;

    points +=
      clamp(mood / 5, 0, 1) * 8;
  }

  if (availablePoints === 0) {
    return null;
  }

  return (
    (points / availablePoints) *
    35
  );
}

function calculateFitnessScore(
  logs: FitnessLog[]
) {
  if (logs.length === 0) {
    return null;
  }

  const activeDays = new Set(
    logs.map((log) => log.activity_date)
  ).size;

  const totalDuration = logs.reduce(
    (sum, log) =>
      sum +
      (Number(log.duration_minutes) || 0),
    0
  );

  const durationScore =
    clamp(totalDuration / 150, 0, 1) *
    10;

  const activityDayScore =
    clamp(activeDays / 5, 0, 1) *
    20;

  return (
    durationScore +
    activityDayScore
  );
}

function calculateNutritionScore(
  logs: NutritionLog[]
) {
  if (logs.length === 0) {
    return null;
  }

  const loggedDays = new Set(
    logs.map((log) => log.meal_date)
  ).size;

  const consistencyScore =
    clamp(loggedDays / 7, 0, 1) * 15;

  const logsWithCalories =
    logs.filter(
      (log) =>
        typeof log.calories === "number"
    ).length;

  const logsWithProtein =
    logs.filter(
      (log) =>
        typeof log.protein_g === "number"
    ).length;

  const calorieCoverage =
    logs.length > 0
      ? logsWithCalories / logs.length
      : 0;

  const proteinCoverage =
    logs.length > 0
      ? logsWithProtein / logs.length
      : 0;

  const dataQualityScore =
    ((calorieCoverage +
      proteinCoverage) /
      2) *
    20;

  return (
    consistencyScore +
    dataQualityScore
  );
}

function getHealthPenalty(
  assessments: HealthAssessment[],
  events: HealthEvent[]
) {
  const cutoff = getDateDaysAgo(7);

  const recentAssessments =
    assessments.filter(
      (assessment) =>
        assessment.created_at.slice(
          0,
          10
        ) >= cutoff
    );

  const latestAssessment =
    recentAssessments[0];

  if (latestAssessment) {
    const urgency =
      latestAssessment.assessment
        ?.doctor_urgency?.level;

    if (urgency === "HIGH") {
      return 15;
    }

    if (urgency === "MODERATE") {
      return 8;
    }

    /*
     * LOW urgency does not automatically
     * mean the issue is active. Look at
     * the symptom duration text.
     */
    const symptoms =
      latestAssessment.assessment
        ?.symptoms ?? [];

    const hasActiveSymptom =
      symptoms.some((symptom) => {
        const duration =
          symptom.duration.toLowerCase();

        return (
          !duration.includes("resolved") &&
          !duration.includes("gone") &&
          !duration.includes("ended")
        );
      });

    if (hasActiveSymptom) {
      return 3;
    }

    return 0;
  }

  /*
   * Fall back to very recent manually
   * logged health events.
   *
   * These are treated as health issues,
   * not diagnoses.
   */
  const recentEvents =
    events.filter(
      (event) =>
        event.event_date >= cutoff
    );

  if (recentEvents.length === 0) {
    return 0;
  }

  const highestSeverity =
    Math.max(
      ...recentEvents.map(
        (event) => event.severity
      )
    );

  if (highestSeverity >= 5) {
    return 10;
  }

  if (highestSeverity >= 4) {
    return 7;
  }

  if (highestSeverity >= 3) {
    return 4;
  }

  return 2;
}

function getHPLabel(score: number) {
  if (score >= 85) {
    return "Strong";
  }

  if (score >= 70) {
    return "Good";
  }

  if (score >= 50) {
    return "Needs attention";
  }

  return "Low";
}

export default function HumanStatePage() {
  const [wellnessLogs, setWellnessLogs] =
    useState<WellnessLog[]>([]);

  const [fitnessLogs, setFitnessLogs] =
    useState<FitnessLog[]>([]);

  const [nutritionLogs, setNutritionLogs] =
    useState<NutritionLog[]>([]);

  const [healthEvents, setHealthEvents] =
    useState<HealthEvent[]>([]);

  const [
    healthAssessments,
    setHealthAssessments,
  ] = useState<HealthAssessment[]>(
    []
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadData() {
      const supabase =
        createBrowserSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const cutoff = getDateDaysAgo(7);

      const [
        wellnessResult,
        fitnessResult,
        nutritionResult,
        healthResult,
        assessmentResult,
      ] = await Promise.all([
        supabase
          .from("wellness_logs")
          .select(
            "id, log_date, sleep_hours, water_liters, energy, mood, notes, created_at"
          )
          .eq("user_id", user.id)
          .gte("log_date", cutoff)
          .order("log_date", {
            ascending: false,
          }),

        supabase
          .from("fitness_logs")
          .select(
            "id, activity_date, activity_type, duration_minutes, distance_km, notes, created_at"
          )
          .eq("user_id", user.id)
          .gte("activity_date", cutoff)
          .order("activity_date", {
            ascending: false,
          }),

        supabase
          .from("nutrition_logs")
          .select(
            "id, meal_date, meal_type, calories, protein_g, notes, created_at"
          )
          .eq("user_id", user.id)
          .gte("meal_date", cutoff)
          .order("meal_date", {
            ascending: false,
          }),

        supabase
          .from("health_events")
          .select(
            "id, event_date, description, severity, created_at"
          )
          .eq("user_id", user.id)
          .gte("event_date", cutoff)
          .order("event_date", {
            ascending: false,
          }),

        supabase
          .from("health_assessments")
          .select(
            "id, user_message, assessment, created_at"
          )
          .eq("user_id", user.id)
          .gte(
            "created_at",
            `${cutoff}T00:00:00`
          )
          .order("created_at", {
            ascending: false,
          }),
      ]);

      const errors = [
        wellnessResult.error,
        fitnessResult.error,
        nutritionResult.error,
        healthResult.error,
        assessmentResult.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error(
          "Human State data loading errors:",
          errors
        );

        setError(
          "Some Human State data could not be loaded."
        );
      }

      setWellnessLogs(
        wellnessResult.data ?? []
      );

      setFitnessLogs(
        fitnessResult.data ?? []
      );

      setNutritionLogs(
        nutritionResult.data ?? []
      );

      setHealthEvents(
        healthResult.data ?? []
      );

      setHealthAssessments(
        (assessmentResult.data ??
          []) as HealthAssessment[]
      );

      setLoading(false);
    }

    loadData();
  }, []);

  const score = useMemo<{
    breakdown: ScoreBreakdown | null;
    hasEnoughData: boolean;
  }>(() => {
    const wellness =
      calculateWellnessScore(
        wellnessLogs
      );

    const fitness =
      calculateFitnessScore(
        fitnessLogs
      );

    const nutrition =
      calculateNutritionScore(
        nutritionLogs
      );

    const availableComponents = [
      wellness,
      fitness,
      nutrition,
    ].filter(
      (value): value is number =>
        value !== null
    );

    /*
     * Require at least two of the three
     * main domains before showing an HP.
     */
    if (
      availableComponents.length < 2
    ) {
      return {
        breakdown: null,
        hasEnoughData: false,
      };
    }

    const healthPenalty =
      getHealthPenalty(
        healthAssessments,
        healthEvents
      );

    const total = clamp(
      Math.round(
        (wellness ?? 0) +
          (fitness ?? 0) +
          (nutrition ?? 0) -
          healthPenalty
      ),
      0,
      100
    );

    return {
      breakdown: {
        wellness:
          Math.round(wellness ?? 0),
        fitness:
          Math.round(fitness ?? 0),
        nutrition:
          Math.round(nutrition ?? 0),
        healthPenalty,
        total,
      },
      hasEnoughData: true,
    };
  }, [
    wellnessLogs,
    fitnessLogs,
    nutritionLogs,
    healthEvents,
    healthAssessments,
  ]);

  const wellnessSummary = useMemo(() => {
    const sleep = average(
      wellnessLogs
        .map((log) => log.sleep_hours)
        .filter(
          (value): value is number =>
            typeof value === "number"
        )
    );

    const water = average(
      wellnessLogs
        .map((log) => log.water_liters)
        .filter(
          (value): value is number =>
            typeof value === "number"
        )
    );

    const energy = average(
      wellnessLogs
        .map((log) => log.energy)
        .filter(
          (value): value is number =>
            typeof value === "number"
        )
    );

    const mood = average(
      wellnessLogs
        .map((log) => log.mood)
        .filter(
          (value): value is number =>
            typeof value === "number"
        )
    );

    return {
      sleep,
      water,
      energy,
      mood,
    };
  }, [wellnessLogs]);

  const fitnessSummary = useMemo(() => {
    const activeDays = new Set(
      fitnessLogs.map(
        (log) => log.activity_date
      )
    ).size;

    const duration = fitnessLogs.reduce(
      (sum, log) =>
        sum +
        (Number(log.duration_minutes) ||
          0),
      0
    );

    const distance = fitnessLogs.reduce(
      (sum, log) =>
        sum +
        (Number(log.distance_km) || 0),
      0
    );

    return {
      activeDays,
      duration,
      distance,
    };
  }, [fitnessLogs]);

  const nutritionSummary = useMemo(() => {
    const calories = nutritionLogs
      .map((log) => log.calories)
      .filter(
        (value): value is number =>
          typeof value === "number"
      );

    const protein = nutritionLogs
      .map((log) => log.protein_g)
      .filter(
        (value): value is number =>
          typeof value === "number"
      );

    return {
      days: new Set(
        nutritionLogs.map(
          (log) => log.meal_date
        )
      ).size,

      averageCalories:
        average(calories),

      averageProtein:
        average(protein),
    };
  }, [nutritionLogs]);

  const activeHealthIssue =
    useMemo(() => {
      if (
        !score.breakdown ||
        score.breakdown.healthPenalty === 0
      ) {
        return null;
      }

      const latestAssessment =
        healthAssessments[0];

      if (latestAssessment) {
        const urgency =
          latestAssessment.assessment
            ?.doctor_urgency?.level;

        if (urgency) {
          return `Recent health assessment: ${urgency} urgency`;
        }

        return "Recent health issue";
      }

      return "Recent health event";
    }, [
      score.breakdown,
      healthAssessments,
    ]);

  if (loading) {
    return (
      <AppShell currentPath="/dashboard/state">
        <div className="max-w-5xl">
          <p className="text-sm text-muted">
            Loading your Human State...
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell currentPath="/dashboard/state">
      <div className="max-w-5xl">
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
          My Human State
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Your current HP reflects your recent
          wellness, fitness and nutrition data,
          with a temporary adjustment for active
          health issues.
        </p>

        {error ? (
          <p className="mt-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {/* CURRENT HP */}

        <div className="mt-8">
          <Card>
            {!score.hasEnoughData ||
            !score.breakdown ? (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                  CURRENT HP
                </p>

                <div className="mt-4 flex items-end gap-3">
                  <span className="text-5xl font-semibold tracking-tight">
                    —
                  </span>

                  <span className="pb-2 text-sm text-muted">
                    Not enough data
                  </span>
                </div>

                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                  Log data in at least two of
                  Wellness, Fitness and Nutrition
                  to calculate your current HP.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                      CURRENT HP
                    </p>

                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-6xl font-semibold tracking-tight">
                        {score.breakdown.total}
                      </span>

                      <span className="pb-2 text-sm text-muted">
                        / 100
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-medium">
                      {getHPLabel(
                        score.breakdown.total
                      )}
                    </p>
                  </div>

                  {activeHealthIssue ? (
                    <div className="max-w-sm rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <p className="font-medium">
                        Health adjustment
                      </p>

                      <p className="mt-1 leading-relaxed">
                        {activeHealthIssue}
                        {" · "}
                        -
                        {
                          score.breakdown
                            .healthPenalty
                        } HP
                      </p>
                    </div>
                  ) : (
                    <p className="max-w-sm text-sm leading-relaxed text-muted">
                      No current health adjustment
                      is being applied.
                    </p>
                  )}
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-md border border-line px-4 py-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">
                      WELLNESS
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {
                        score.breakdown
                          .wellness
                      }
                      <span className="text-sm font-normal text-muted">
                        {" "}
                        / 35
                      </span>
                    </p>
                  </div>

                  <div className="rounded-md border border-line px-4 py-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">
                      FITNESS
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {
                        score.breakdown
                          .fitness
                      }
                      <span className="text-sm font-normal text-muted">
                        {" "}
                        / 30
                      </span>
                    </p>
                  </div>

                  <div className="rounded-md border border-line px-4 py-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">
                      NUTRITION
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {
                        score.breakdown
                          .nutrition
                      }
                      <span className="text-sm font-normal text-muted">
                        {" "}
                        / 35
                      </span>
                    </p>
                  </div>

                  <div className="rounded-md border border-line px-4 py-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">
                      HEALTH
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      -
                      {
                        score.breakdown
                          .healthPenalty
                      }
                    </p>
                  </div>
                </div>

                <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
                  HP is a HUMANHP wellness and
                  activity indicator based on
                  your logged data. It is not a
                  medical measurement or diagnosis.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* RECENT STATE */}

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Card>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              WELLNESS
            </p>

            {wellnessLogs.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                No recent wellness data.
              </p>
            ) : (
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted">
                    Sleep
                  </span>

                  <span className="font-medium">
                    {wellnessSummary.sleep !==
                    null
                      ? `${wellnessSummary.sleep.toFixed(
                          1
                        )} h`
                      : "—"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted">
                    Water
                  </span>

                  <span className="font-medium">
                    {wellnessSummary.water !==
                    null
                      ? `${wellnessSummary.water.toFixed(
                          1
                        )} L`
                      : "—"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted">
                    Energy
                  </span>

                  <span className="font-medium">
                    {wellnessSummary.energy !==
                    null
                      ? `${wellnessSummary.energy.toFixed(
                          1
                        )}/5`
                      : "—"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted">
                    Mood
                  </span>

                  <span className="font-medium">
                    {wellnessSummary.mood !==
                    null
                      ? `${wellnessSummary.mood.toFixed(
                          1
                        )}/5`
                      : "—"}
                  </span>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              FITNESS
            </p>

            {fitnessLogs.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                No recent fitness data.
              </p>
            ) : (
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted">
                    Active days
                  </span>

                  <span className="font-medium">
                    {fitnessSummary.activeDays}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted">
                    Duration
                  </span>

                  <span className="font-medium">
                    {Math.round(
                      fitnessSummary.duration
                    )}{" "}
                    min
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted">
                    Distance
                  </span>

                  <span className="font-medium">
                    {fitnessSummary.distance >
                    0
                      ? `${fitnessSummary.distance.toFixed(
                          1
                        )} km`
                      : "—"}
                  </span>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              NUTRITION
            </p>

            {nutritionLogs.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                No recent nutrition data.
              </p>
            ) : (
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted">
                    Logged days
                  </span>

                  <span className="font-medium">
                    {nutritionSummary.days}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted">
                    Avg. calories
                  </span>

                  <span className="font-medium">
                    {nutritionSummary.averageCalories !==
                    null
                      ? Math.round(
                          nutritionSummary.averageCalories
                        )
                      : "—"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted">
                    Avg. protein
                  </span>

                  <span className="font-medium">
                    {nutritionSummary.averageProtein !==
                    null
                      ? `${nutritionSummary.averageProtein.toFixed(
                          1
                        )} g`
                      : "—"}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* HEALTH STATUS */}

        <div className="mt-8">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                  HEALTH
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Current health status
                </h2>
              </div>

              <Link
                href="/dashboard/health"
                className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                View Health
              </Link>
            </div>

            {score.breakdown &&
            score.breakdown
              .healthPenalty > 0 ? (
              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-4">
                <p className="text-sm font-medium text-amber-900">
                  A temporary HP adjustment is
                  active.
                </p>

                <p className="mt-1 text-sm leading-relaxed text-amber-800">
                  Recent health information is
                  affecting the current HP
                  calculation. This adjustment
                  can disappear when the issue is
                  resolved or no longer recent.
                </p>
              </div>
            ) : healthEvents.length ===
              0 &&
              healthAssessments.length ===
                0 ? (
              <p className="mt-5 text-sm text-muted">
                No recent health issues are
                affecting your current HP.
              </p>
            ) : (
              <p className="mt-5 text-sm leading-relaxed text-muted">
                Recent health information is
                available, but it is not currently
                reducing your HP.
              </p>
            )}
          </Card>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-muted">
          Current HP uses the most recent 7 days
          of logged information. Missing data is
          not treated as perfect data.
        </p>
      </div>
    </AppShell>
  );
}
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type NutritionLog = {
  id: string;
  meal_date: string;
  meal_type: string;
  calories: number | null;
  protein_g: number | null;
  notes: string | null;
  created_at: string;
};

type SupplementRoutine = {
  id: string;
  name: string;
  nutrients: Record<string, number>;
  is_active: boolean;
  created_at: string;
};

type SupplementIntake = {
  id: string;
  routine_id: string;
  intake_date: string;
  taken: boolean;
};

type Nutrient = {
  key: string;
  label: string;
  unit: string;
};

/* =========================================================
   PREDEFINED NUTRIENTS
========================================================= */

const VITAMINS: Nutrient[] = [
  { key: "vitamin_a", label: "Vitamin A", unit: "µg" },
  { key: "vitamin_b1", label: "Vitamin B1", unit: "mg" },
  { key: "vitamin_b2", label: "Vitamin B2", unit: "mg" },
  { key: "vitamin_b3", label: "Vitamin B3", unit: "mg" },
  { key: "vitamin_b5", label: "Vitamin B5", unit: "mg" },
  { key: "vitamin_b6", label: "Vitamin B6", unit: "mg" },
  { key: "biotin", label: "Biotin", unit: "µg" },
  { key: "vitamin_b9", label: "Vitamin B9", unit: "µg" },
  { key: "vitamin_b12", label: "Vitamin B12", unit: "µg" },
  { key: "vitamin_c", label: "Vitamin C", unit: "mg" },
  { key: "vitamin_d", label: "Vitamin D", unit: "µg" },
  { key: "vitamin_e", label: "Vitamin E", unit: "mg" },
  { key: "vitamin_k1", label: "Vitamin K1", unit: "µg" },
  { key: "vitamin_d2", label: "Vitamin D2", unit: "µg" },
];

const MINERALS: Nutrient[] = [
  { key: "zinc", label: "Zinc", unit: "mg" },
  { key: "calcium", label: "Calcium", unit: "mg" },
  { key: "magnesium", label: "Magnesium", unit: "mg" },
  { key: "iron", label: "Iron", unit: "mg" },
  { key: "manganese", label: "Manganese", unit: "mg" },
  { key: "copper", label: "Copper", unit: "mg" },
  { key: "iodine", label: "Iodine", unit: "µg" },
  { key: "selenium", label: "Selenium", unit: "µg" },
  { key: "chromium", label: "Chromium", unit: "µg" },
  { key: "molybdenum", label: "Molybdenum", unit: "µg" },
  { key: "potassium", label: "Potassium", unit: "mg" },
  { key: "phosphorus", label: "Phosphorus", unit: "mg" },
  { key: "sodium", label: "Sodium", unit: "mg" },
];

const ALL_NUTRIENTS = [...VITAMINS, ...MINERALS];

/* =========================================================
   DATE HELPERS
========================================================= */

function getLocalDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");

  return `${day}/${month}/${year}`;
}

/* =========================================================
   PAGE
========================================================= */

export default function NutritionPage() {
  const today = getLocalDate();

  /* =========================================================
     MEAL LOGGER
  ========================================================= */

  const [mealDate, setMealDate] = useState(today);

  const [mealDateMode, setMealDateMode] = useState<
    "today" | "select"
  >("today");

  const [mealType, setMealType] = useState("Breakfast");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [notes, setNotes] = useState("");

  /* =========================================================
     DATA
  ========================================================= */

  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [routines, setRoutines] = useState<SupplementRoutine[]>([]);
  const [intakes, setIntakes] = useState<SupplementIntake[]>([]);

  /* =========================================================
     SUPPLEMENT CREATION
  ========================================================= */

  const [showSupplementCreator, setShowSupplementCreator] =
    useState(false);

  const [routineName, setRoutineName] = useState("");

  const [supplementStarted, setSupplementStarted] =
    useState(false);

  const [selectedNutrients, setSelectedNutrients] =
    useState<string[]>([]);

  const [routineRda, setRoutineRda] =
    useState<Record<string, string>>({});

  /* =========================================================
     CUSTOM NUTRIENTS
  ========================================================= */

  const [customNutrients, setCustomNutrients] =
    useState<Nutrient[]>([]);

  const [customNutrientName, setCustomNutrientName] =
    useState("");

  const [customNutrientUnit, setCustomNutrientUnit] =
    useState("mg");

  /* =========================================================
     LOGGING MODE
  ========================================================= */

  const [loggingMode, setLoggingMode] = useState<
    "meal" | "supplement"
  >("meal");

  /* =========================================================
     MICRONUTRIENT VIEW
  ========================================================= */

  const [showMicronutrientIntake, setShowMicronutrientIntake] =
    useState(false);

  /* =========================================================
     UI STATE
  ========================================================= */

  const [loading, setLoading] = useState(true);
  const [savingMeal, setSavingMeal] = useState(false);
  const [savingRoutine, setSavingRoutine] = useState(false);

  const [deletingMealId, setDeletingMealId] =
    useState<string | null>(null);

  const [deletingRoutineId, setDeletingRoutineId] =
    useState<string | null>(null);

  const [togglingRoutineId, setTogglingRoutineId] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");

  /* =========================================================
     LOAD DATA
  ========================================================= */

  async function loadData() {
    const supabase = createBrowserSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const [
      nutritionResult,
      routineResult,
      intakeResult,
    ] = await Promise.all([
      supabase
        .from("nutrition_logs")
        .select(
          "id, meal_date, meal_type, calories, protein_g, notes, created_at",
        )
        .eq("user_id", user.id)
        .order("meal_date", { ascending: false })
        .order("created_at", { ascending: false }),

      supabase
        .from("supplement_routines")
        .select(
          "id, name, nutrients, is_active, created_at",
        )
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),

      supabase
        .from("supplement_intake")
        .select(
          "id, routine_id, intake_date, taken",
        )
        .eq("user_id", user.id)
        .eq("intake_date", mealDate),
    ]);

    if (nutritionResult.error) {
      setMessage(nutritionResult.error.message);
    } else {
      setLogs(nutritionResult.data ?? []);
    }

    if (routineResult.error) {
      setMessage(routineResult.error.message);
    } else {
      setRoutines(routineResult.data ?? []);
    }

    if (intakeResult.error) {
      setMessage(intakeResult.error.message);
    } else {
      setIntakes(intakeResult.data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [mealDate]);

  /* =========================================================
     DAILY MEAL TOTALS
  ========================================================= */

  const selectedDayLogs = useMemo(() => {
    return logs.filter(
      (log) => log.meal_date === mealDate,
    );
  }, [logs, mealDate]);

  const dailyCalories = useMemo(() => {
    return selectedDayLogs.reduce(
      (total, log) =>
        total + (Number(log.calories) || 0),
      0,
    );
  }, [selectedDayLogs]);

  const dailyProtein = useMemo(() => {
    return selectedDayLogs.reduce(
      (total, log) =>
        total + (Number(log.protein_g) || 0),
      0,
    );
  }, [selectedDayLogs]);

  /* =========================================================
     MICRONUTRIENT TOTALS
  ========================================================= */

  const micronutrientTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    for (const intake of intakes) {
      if (!intake.taken) {
        continue;
      }

      const routine = routines.find(
        (item) => item.id === intake.routine_id,
      );

      if (!routine) {
        continue;
      }

      for (const [key, rda] of Object.entries(
        routine.nutrients,
      )) {
        totals[key] =
          (totals[key] || 0) + Number(rda);
      }
    }

    return totals;
  }, [intakes, routines]);

  const takenSupplements = useMemo(() => {
    return routines.filter((routine) => {
      const intake = intakes.find(
        (item) => item.routine_id === routine.id,
      );

      return intake?.taken === true;
    });
  }, [routines, intakes]);

  /* =========================================================
     DATE CONTROLS
  ========================================================= */

  function handleToday() {
    setMealDateMode("today");
    setMealDate(getLocalDate());
    setShowMicronutrientIntake(false);
  }

  function handleSelectDate() {
    setMealDateMode("select");
    setShowMicronutrientIntake(false);
  }

  /* =========================================================
     SAVE MEAL
  ========================================================= */

  async function handleMealSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !calories &&
      !protein &&
      !notes.trim()
    ) {
      setMessage(
        "Add at least one nutrition detail.",
      );
      return;
    }

    if (
      calories &&
      (!Number.isFinite(Number(calories)) ||
        Number(calories) < 0)
    ) {
      setMessage(
        "Calories must be a valid non-negative number.",
      );
      return;
    }

    if (
      protein &&
      (!Number.isFinite(Number(protein)) ||
        Number(protein) < 0)
    ) {
      setMessage(
        "Protein must be a valid non-negative number.",
      );
      return;
    }

    setSavingMeal(true);
    setMessage("");

    const supabase = createBrowserSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Your session has expired. Please log in again.",
      );
      setSavingMeal(false);
      return;
    }

    const { error } = await supabase
      .from("nutrition_logs")
      .insert({
        user_id: user.id,
        meal_date: mealDate,
        meal_type: mealType,
        calories: calories
          ? Number(calories)
          : null,
        protein_g: protein
          ? Number(protein)
          : null,
        notes: notes.trim() || null,
      });

    if (error) {
      setMessage(error.message);
    } else {
      setCalories("");
      setProtein("");
      setNotes("");

      setMessage("Meal logged successfully.");

      await loadData();
    }

    setSavingMeal(false);
  }

  /* =========================================================
     DELETE MEAL
  ========================================================= */

  async function handleDeleteMeal(id: string) {
    const confirmed = window.confirm(
      "Delete this meal entry?\n\nThis action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setDeletingMealId(id);
    setMessage("");

    const supabase = createBrowserSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Your session has expired. Please log in again.",
      );
      setDeletingMealId(null);
      return;
    }

    const { error } = await supabase
      .from("nutrition_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setMessage(error.message);
    } else {
      setLogs((current) =>
        current.filter((log) => log.id !== id),
      );

      setMessage("Meal entry deleted.");
    }

    setDeletingMealId(null);
  }

  /* =========================================================
     START SUPPLEMENT CREATION
  ========================================================= */

  function handleStartSupplement(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const name = routineName.trim();

    if (!name) {
      setMessage(
        "Enter a supplement or medicine name first.",
      );
      return;
    }

    setRoutineName(name);
    setSupplementStarted(true);
    setMessage("");
  }

  /* =========================================================
     CUSTOM NUTRIENT KEY
  ========================================================= */

  function createCustomNutrientKey(
    name: string,
    unit: string,
  ) {
    return `custom_${encodeURIComponent(
      name.trim().toLowerCase(),
    )}_${unit}`;
  }

  /* =========================================================
     ADD CUSTOM NUTRIENT
  ========================================================= */

  function addCustomNutrient() {
    const name = customNutrientName.trim();

    if (!name) {
      setMessage("Enter a nutrient name.");
      return;
    }

    const alreadyExists = [
      ...ALL_NUTRIENTS,
      ...customNutrients,
    ].some(
      (nutrient) =>
        nutrient.label.toLowerCase() ===
        name.toLowerCase(),
    );

    if (alreadyExists) {
      setMessage(
        "That nutrient is already listed.",
      );
      return;
    }

    const nutrient: Nutrient = {
      key: createCustomNutrientKey(
        name,
        customNutrientUnit,
      ),
      label: name,
      unit: customNutrientUnit,
    };

    setCustomNutrients((current) => [
      ...current,
      nutrient,
    ]);

    setCustomNutrientName("");
    setCustomNutrientUnit("mg");
    setMessage("");
  }

  /* =========================================================
     SELECT / UNSELECT NUTRIENT
  ========================================================= */

  function toggleNutrient(key: string) {
    setSelectedNutrients((current) => {
      if (current.includes(key)) {
        setRoutineRda((rda) => {
          const next = { ...rda };
          delete next[key];
          return next;
        });

        return current.filter(
          (item) => item !== key,
        );
      }

      return [...current, key];
    });
  }

  /* =========================================================
     UPDATE RDA
  ========================================================= */

  function updateRoutineRda(
    key: string,
    value: string,
  ) {
    setRoutineRda((current) => ({
      ...current,
      [key]: value,
    }));
  }

  /* =========================================================
     SAVE SUPPLEMENT
  ========================================================= */

  async function handleCreateRoutine(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const name = routineName.trim();

    if (!name) {
      setMessage(
        "Enter a supplement or medicine name first.",
      );
      return;
    }

    if (selectedNutrients.length === 0) {
      setMessage(
        "Select at least one nutrient.",
      );
      return;
    }

    const availableNutrients = [
      ...ALL_NUTRIENTS,
      ...customNutrients,
    ];

    for (const key of selectedNutrients) {
      const value = routineRda[key];

      if (value === undefined || value === "") {
        const nutrient =
          availableNutrients.find(
            (item) => item.key === key,
          );

        setMessage(
          `Enter the % RDA for ${
            nutrient?.label ?? "this nutrient"
          }.`,
        );

        return;
      }

      const number = Number(value);

      if (
        !Number.isFinite(number) ||
        number < 0
      ) {
        const nutrient =
          availableNutrients.find(
            (item) => item.key === key,
          );

        setMessage(
          `${
            nutrient?.label ?? "RDA"
          } must be a valid non-negative number.`,
        );

        return;
      }
    }

    setSavingRoutine(true);
    setMessage("");

    const supabase = createBrowserSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Your session has expired. Please log in again.",
      );
      setSavingRoutine(false);
      return;
    }

    const nutrientData = Object.fromEntries(
      selectedNutrients.map((key) => [
        key,
        Number(routineRda[key]),
      ]),
    );

    const { error } = await supabase
      .from("supplement_routines")
      .insert({
        user_id: user.id,
        name,
        nutrients: nutrientData,
        is_active: true,
      });

    if (error) {
      setMessage(
        `Could not save supplement: ${error.message}`,
      );
    } else {
      setRoutineName("");
      setSupplementStarted(false);
      setSelectedNutrients([]);
      setRoutineRda({});
      setCustomNutrients([]);
      setCustomNutrientName("");
      setCustomNutrientUnit("mg");
      setShowSupplementCreator(false);

      setMessage(
        "Supplement saved successfully.",
      );

      await loadData();
    }

    setSavingRoutine(false);
  }

  /* =========================================================
     GET INTAKE
  ========================================================= */

  function getIntake(routineId: string) {
    return intakes.find(
      (intake) =>
        intake.routine_id === routineId &&
        intake.intake_date === mealDate,
    );
  }

  /* =========================================================
     MARK SUPPLEMENT YES / NO
  ========================================================= */

  async function setSupplementTaken(
    routine: SupplementRoutine,
    taken: boolean,
  ) {
    setTogglingRoutineId(routine.id);
    setMessage("");

    const supabase = createBrowserSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Your session has expired. Please log in again.",
      );
      setTogglingRoutineId(null);
      return;
    }

    const existing = getIntake(routine.id);

    if (existing) {
      const { error } = await supabase
        .from("supplement_intake")
        .update({
          taken,
        })
        .eq("id", existing.id)
        .eq("user_id", user.id);

      if (error) {
        setMessage(error.message);
      } else {
        setIntakes((current) =>
          current.map((intake) =>
            intake.id === existing.id
              ? {
                  ...intake,
                  taken,
                }
              : intake,
          ),
        );
      }
    } else {
      const { data, error } = await supabase
        .from("supplement_intake")
        .insert({
          user_id: user.id,
          routine_id: routine.id,
          intake_date: mealDate,
          taken,
        })
        .select(
          "id, routine_id, intake_date, taken",
        )
        .single();

      if (error) {
        setMessage(error.message);
      } else if (data) {
        setIntakes((current) => [
          ...current,
          data,
        ]);
      }
    }

    setTogglingRoutineId(null);
  }

  /* =========================================================
     DELETE SUPPLEMENT
  ========================================================= */

  async function handleDeleteRoutine(id: string) {
    const confirmed = window.confirm(
      "Delete this supplement?\n\nIts daily tracking history will also be removed.",
    );

    if (!confirmed) {
      return;
    }

    setDeletingRoutineId(id);
    setMessage("");

    const supabase = createBrowserSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Your session has expired. Please log in again.",
      );
      setDeletingRoutineId(null);
      return;
    }

    const { error } = await supabase
      .from("supplement_routines")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setMessage(error.message);
    } else {
      setRoutines((current) =>
        current.filter(
          (routine) => routine.id !== id,
        ),
      );

      setIntakes((current) =>
        current.filter(
          (intake) =>
            intake.routine_id !== id,
        ),
      );

      setMessage("Supplement deleted.");
    }

    setDeletingRoutineId(null);
  }

  /* =========================================================
     NUTRIENT HELPERS
  ========================================================= */

  function getNutrientLabel(key: string) {
    const predefined = ALL_NUTRIENTS.find(
      (nutrient) => nutrient.key === key,
    );

    if (predefined) {
      return predefined.label;
    }

    const custom = customNutrients.find(
      (nutrient) => nutrient.key === key,
    );

    if (custom) {
      return custom.label;
    }

    if (key.startsWith("custom_")) {
      const withoutPrefix =
        key.slice("custom_".length);

      const lastUnderscore =
        withoutPrefix.lastIndexOf("_");

      if (lastUnderscore > 0) {
        const encodedName =
          withoutPrefix.slice(
            0,
            lastUnderscore,
          );

        try {
          return decodeURIComponent(
            encodedName,
          );
        } catch {
          return encodedName;
        }
      }
    }

    return key;
  }

  function getNutrientUnit(key: string) {
    const predefined = ALL_NUTRIENTS.find(
      (nutrient) => nutrient.key === key,
    );

    if (predefined) {
      return predefined.unit;
    }

    const custom = customNutrients.find(
      (nutrient) => nutrient.key === key,
    );

    if (custom) {
      return custom.unit;
    }

    if (key.startsWith("custom_")) {
      const withoutPrefix =
        key.slice("custom_".length);

      const lastUnderscore =
        withoutPrefix.lastIndexOf("_");

      if (lastUnderscore > 0) {
        return withoutPrefix.slice(
          lastUnderscore + 1,
        );
      }
    }

    return "";
  }

  /* =========================================================
     RESET SUPPLEMENT CREATOR
  ========================================================= */

  function resetSupplementCreator() {
    setShowSupplementCreator(false);
    setSupplementStarted(false);
    setRoutineName("");
    setSelectedNutrients([]);
    setRoutineRda({});
    setCustomNutrients([]);
    setCustomNutrientName("");
    setCustomNutrientUnit("mg");
    setMessage("");
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <AppShell currentPath="/dashboard/nutrition">
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
              Nutrition
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
              Record meals and keep track of your
              daily nutrition.
            </p>
          </div>

          {/* ADD SUPPLEMENT */}

          <button
            type="button"
            onClick={() => {
              if (showSupplementCreator) {
                resetSupplementCreator();
              } else {
                setShowSupplementCreator(true);
                setMessage("");
              }
            }}
            className="shrink-0 rounded-md border border-line bg-background px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface"
          >
            {showSupplementCreator
              ? "Close"
              : "+ Add supplement"}
          </button>
        </div>

        {/* =====================================================
            ADD SUPPLEMENT PANEL
        ===================================================== */}

        {showSupplementCreator ? (
          <div className="mt-6">
            <Card>
              {!supplementStarted ? (
                <form
                  onSubmit={handleStartSupplement}
                  className="space-y-4"
                >
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                      SUPPLEMENT
                    </p>

                    <h2 className="mt-1 text-lg font-semibold">
                      Add a supplement
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                      Create it once using the
                      nutrients and % RDA shown on
                      the label.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="routine-name"
                      className="text-sm font-medium"
                    >
                      Supplement / medicine name
                    </label>

                    <div className="mt-2 flex gap-3">
                      <input
                        id="routine-name"
                        type="text"
                        value={routineName}
                        onChange={(e) =>
                          setRoutineName(
                            e.target.value,
                          )
                        }
                        placeholder="e.g. Multi1"
                        className="min-w-0 flex-1 rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                        autoComplete="off"
                      />

                      <button
                        type="submit"
                        className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                      >
                        Enter
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={handleCreateRoutine}
                  className="space-y-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted">
                        SUPPLEMENT
                      </p>

                      <h3 className="mt-1 text-lg font-semibold">
                        {routineName}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSupplementStarted(false);
                        setSelectedNutrients([]);
                        setRoutineRda({});
                        setCustomNutrients([]);
                        setCustomNutrientName("");
                        setCustomNutrientUnit("mg");
                        setMessage("");
                      }}
                      className="text-xs text-muted hover:text-ink hover:underline"
                    >
                      Change name
                    </button>
                  </div>

                  {/* =================================================
                      SELECT NUTRIENTS
                  ================================================= */}

                  <div>
                    <p className="text-sm font-medium">
                      Select nutrients
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      Select only the nutrients listed
                      on your supplement label.
                    </p>

                    {/* VITAMINS */}

                    <p className="mt-5 text-xs font-medium uppercase tracking-[0.14em] text-muted">
                      Vitamins
                    </p>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {VITAMINS.map(
                        (nutrient) => {
                          const selected =
                            selectedNutrients.includes(
                              nutrient.key,
                            );

                          return (
                            <label
                              key={nutrient.key}
                              className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition ${
                                selected
                                  ? "border-ink bg-surface"
                                  : "border-line hover:bg-surface"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() =>
                                  toggleNutrient(
                                    nutrient.key,
                                  )
                                }
                                className="h-4 w-4"
                              />

                              <span className="text-sm">
                                {nutrient.label}
                              </span>

                              <span className="ml-auto text-xs text-muted">
                                {nutrient.unit}
                              </span>
                            </label>
                          );
                        },
                      )}
                    </div>

                    {/* MINERALS */}

                    <p className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-muted">
                      Minerals
                    </p>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {MINERALS.map(
                        (nutrient) => {
                          const selected =
                            selectedNutrients.includes(
                              nutrient.key,
                            );

                          return (
                            <label
                              key={nutrient.key}
                              className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition ${
                                selected
                                  ? "border-ink bg-surface"
                                  : "border-line hover:bg-surface"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() =>
                                  toggleNutrient(
                                    nutrient.key,
                                  )
                                }
                                className="h-4 w-4"
                              />

                              <span className="text-sm">
                                {nutrient.label}
                              </span>

                              <span className="ml-auto text-xs text-muted">
                                {nutrient.unit}
                              </span>
                            </label>
                          );
                        },
                      )}
                    </div>

                    {/* CUSTOM NUTRIENTS */}

                    <div className="mt-6">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                        Other nutrients
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        Add a nutrient that is not
                        listed above.
                      </p>

                      {customNutrients.length > 0 ? (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {customNutrients.map(
                            (nutrient) => {
                              const selected =
                                selectedNutrients.includes(
                                  nutrient.key,
                                );

                              return (
                                <label
                                  key={nutrient.key}
                                  className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition ${
                                    selected
                                      ? "border-ink bg-surface"
                                      : "border-line hover:bg-surface"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() =>
                                      toggleNutrient(
                                        nutrient.key,
                                      )
                                    }
                                    className="h-4 w-4"
                                  />

                                  <span className="text-sm">
                                    {nutrient.label}
                                  </span>

                                  <span className="ml-auto text-xs text-muted">
                                    {nutrient.unit}
                                  </span>
                                </label>
                              );
                            },
                          )}
                        </div>
                      ) : null}

                      <div className="mt-3 rounded-md border border-line p-3">
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                          <input
                            type="text"
                            value={customNutrientName}
                            onChange={(e) =>
                              setCustomNutrientName(
                                e.target.value,
                              )
                            }
                            placeholder="e.g. Hyaluronic acid"
                            className="w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                          />

                          <select
                            value={customNutrientUnit}
                            onChange={(e) =>
                              setCustomNutrientUnit(
                                e.target.value,
                              )
                            }
                            className="rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                          >
                            <option value="mg">
                              mg
                            </option>
                            <option value="µg">
                              µg
                            </option>
                            <option value="g">
                              g
                            </option>
                            <option value="IU">
                              IU
                            </option>
                            <option value="mL">
                              mL
                            </option>
                          </select>

                          <button
                            type="button"
                            onClick={addCustomNutrient}
                            className="rounded-md border border-line px-4 py-2.5 text-sm font-medium hover:bg-surface"
                          >
                            Add nutrient
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      RDA
                  ================================================= */}

                  {selectedNutrients.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium">
                        % RDA from the label
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        Enter the percentage shown on
                        the supplement label.
                      </p>

                      <div className="mt-4 space-y-2">
                        {selectedNutrients.map(
                          (key) => {
                            const nutrient = [
                              ...ALL_NUTRIENTS,
                              ...customNutrients,
                            ].find(
                              (item) =>
                                item.key === key,
                            );

                            if (!nutrient) {
                              return null;
                            }

                            return (
                              <div
                                key={key}
                                className="flex items-center gap-4 rounded-md border border-line px-3 py-3"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium">
                                    {nutrient.label}
                                  </p>

                                  <p className="mt-0.5 text-xs text-muted">
                                    {nutrient.unit}
                                  </p>
                                </div>

                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={
                                    routineRda[
                                      key
                                    ] ?? ""
                                  }
                                  onChange={(e) =>
                                    updateRoutineRda(
                                      key,
                                      e.target.value,
                                    )
                                  }
                                  placeholder="100"
                                  className="w-24 rounded-md border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink"
                                />

                                <span className="text-xs text-muted">
                                  % RDA
                                </span>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-line px-4 py-5">
                      <p className="text-sm text-muted">
                        Select the nutrients found on
                        your supplement label.
                      </p>
                    </div>
                  )}

                  {/* BUTTONS */}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={
                        savingRoutine ||
                        selectedNutrients.length === 0
                      }
                      className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingRoutine
                        ? "Saving..."
                        : "Save supplement"}
                    </button>

                    <button
                      type="button"
                      onClick={resetSupplementCreator}
                      className="rounded-md border border-line px-5 py-2.5 text-sm font-medium hover:bg-surface"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        ) : null}

        {/* =====================================================
            DAILY INTAKE
        ===================================================== */}

        <div className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                DAILY INTAKE
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                {mealDate === getLocalDate()
                  ? "Today's intake"
                  : `Intake for ${formatDate(
                      mealDate,
                    )}`}
              </h2>
            </div>

            <div className="text-right text-xs text-muted">
              {selectedDayLogs.length}{" "}
              {selectedDayLogs.length === 1
                ? "meal"
                : "meals"}{" "}
              logged
            </div>
          </div>

          {/* DATE */}

          <div className="mt-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleToday}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                  mealDateMode === "today"
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-background text-ink hover:bg-surface"
                }`}
              >
                Today
              </button>

              <button
                type="button"
                onClick={handleSelectDate}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                  mealDateMode === "select"
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-background text-ink hover:bg-surface"
                }`}
              >
                Select date
              </button>
            </div>

            {mealDateMode === "select" ? (
              <input
                type="date"
                value={mealDate}
                onChange={(e) => {
                  setMealDate(e.target.value);
                  setShowMicronutrientIntake(false);
                }}
                className="mt-3 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                required
              />
            ) : (
              <p className="mt-2 text-sm text-muted">
                {formatDate(mealDate)}
              </p>
            )}
          </div>

          {/* SUMMARY CARDS */}

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {/* CALORIES */}

            <Card>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                Calories consumed
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {dailyCalories}
              </p>

              <p className="mt-1 text-sm text-muted">
                kcal
              </p>
            </Card>

            {/* PROTEIN */}

            <Card>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                Protein consumed
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {dailyProtein.toFixed(1)}
              </p>

              <p className="mt-1 text-sm text-muted">
                g
              </p>
            </Card>

            {/* MICRONUTRIENT PROFILE */}

            <Card>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                Micronutrient profile
              </p>

              <p className="mt-2 text-sm">
                {takenSupplements.length === 0
                  ? "No supplements logged"
                  : `${takenSupplements.length} supplement${
                      takenSupplements.length === 1
                        ? ""
                        : "s"
                    } logged`}
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowMicronutrientIntake(
                    (current) => !current,
                  )
                }
                className="mt-4 text-sm font-medium text-ink underline underline-offset-4 hover:opacity-70"
              >
                {showMicronutrientIntake
                  ? "Hide today's intake"
                  : "View today's intake"}
              </button>
            </Card>
          </div>

          {/* =====================================================
              MICRONUTRIENT DETAILS
          ===================================================== */}

          {showMicronutrientIntake ? (
            <div className="mt-4">
              <Card>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                  MICRONUTRIENTS
                </p>

                <h3 className="mt-1 text-lg font-semibold">
                  {mealDate === getLocalDate()
                    ? "Today's micronutrient intake"
                    : `Micronutrient intake for ${formatDate(
                        mealDate,
                      )}`}
                </h3>

                {Object.keys(
                  micronutrientTotals,
                ).length === 0 ? (
                  <p className="mt-4 text-sm text-muted">
                    No micronutrients logged for this
                    day yet.
                  </p>
                ) : (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {Object.entries(
                      micronutrientTotals,
                    ).map(([key, rda]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-md border border-line px-3 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {getNutrientLabel(key)}
                          </p>

                          <p className="mt-0.5 text-xs text-muted">
                            {getNutrientUnit(key)}
                          </p>
                        </div>

                        <p className="text-sm text-muted">
                          {rda}% RDA
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          ) : null}
        </div>

        {/* =====================================================
            LOG MEALS & SUPPLEMENTS
        ===================================================== */}

        <div className="mt-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            LOG MEALS & SUPPLEMENTS
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Record your nutrition
          </h2>

          <div className="mt-4 flex gap-2 border-b border-line">
            <button
              type="button"
              onClick={() => setLoggingMode("meal")}
              className={`border-b-2 px-3 pb-3 text-sm font-medium ${
                loggingMode === "meal"
                  ? "border-ink text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              Log meal
            </button>

            <button
              type="button"
              onClick={() =>
                setLoggingMode("supplement")
              }
              className={`border-b-2 px-3 pb-3 text-sm font-medium ${
                loggingMode === "supplement"
                  ? "border-ink text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              Log supplement
            </button>
          </div>
        </div>

        {/* =====================================================
            LOG MEAL
        ===================================================== */}

        {loggingMode === "meal" ? (
          <Card>
            <form
              onSubmit={handleMealSubmit}
              className="space-y-5"
            >
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
                      mealDateMode === "today"
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-background text-ink hover:bg-surface"
                    }`}
                  >
                    Today
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectDate}
                    className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                      mealDateMode === "select"
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-background text-ink hover:bg-surface"
                    }`}
                  >
                    Select date
                  </button>
                </div>

                {mealDateMode === "today" ? (
                  <p className="mt-2 text-sm text-muted">
                    {formatDate(mealDate)}
                  </p>
                ) : (
                  <input
                    type="date"
                    value={mealDate}
                    onChange={(e) =>
                      setMealDate(e.target.value)
                    }
                    className="mt-3 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                    required
                  />
                )}
              </div>

              {/* MEAL */}

              <div>
                <label
                  htmlFor="meal-type"
                  className="text-sm font-medium"
                >
                  Meal
                </label>

                <select
                  id="meal-type"
                  value={mealType}
                  onChange={(e) =>
                    setMealType(e.target.value)
                  }
                  className="mt-2 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                >
                  <option value="Breakfast">
                    Breakfast
                  </option>

                  <option value="Lunch">
                    Lunch
                  </option>

                  <option value="Dinner">
                    Dinner
                  </option>

                  <option value="Snack">
                    Snack
                  </option>
                </select>
              </div>

              {/* CALORIES + PROTEIN */}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="calories"
                    className="text-sm font-medium"
                  >
                    Calories
                  </label>

                  <div className="mt-2 flex items-center gap-2">
                    <input
                      id="calories"
                      type="number"
                      min="0"
                      step="1"
                      value={calories}
                      onChange={(e) =>
                        setCalories(
                          e.target.value,
                        )
                      }
                      placeholder="500"
                      className="w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                    />

                    <span className="text-sm text-muted">
                      kcal
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="protein"
                    className="text-sm font-medium"
                  >
                    Protein
                  </label>

                  <div className="mt-2 flex items-center gap-2">
                    <input
                      id="protein"
                      type="number"
                      min="0"
                      step="0.1"
                      value={protein}
                      onChange={(e) =>
                        setProtein(
                          e.target.value,
                        )
                      }
                      placeholder="25"
                      className="w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                    />

                    <span className="text-sm text-muted">
                      g
                    </span>
                  </div>
                </div>
              </div>

              {/* FOOD / NOTES */}

              <div>
                <label
                  htmlFor="nutrition-notes"
                  className="text-sm font-medium"
                >
                  Food / Notes
                </label>

                <textarea
                  id="nutrition-notes"
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value)
                  }
                  placeholder="What did you eat?"
                  rows={3}
                  className="mt-2 w-full resize-none rounded-md border border-line bg-background px-3 py-3 text-sm outline-none focus:border-ink"
                />
              </div>

              <button
                type="submit"
                disabled={savingMeal}
                className="rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingMeal
                  ? "Saving..."
                  : "Log meal"}
              </button>
            </form>
          </Card>
        ) : (
          /* =====================================================
             LOG SUPPLEMENT
          ===================================================== */

          <Card>
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium">
                  Log supplement
                </p>

                <p className="mt-1 text-sm text-muted">
                  Did you take your saved supplements
                  on {formatDate(mealDate)}?
                </p>
              </div>

              {loading ? (
                <p className="text-sm text-muted">
                  Loading...
                </p>
              ) : routines.length === 0 ? (
                <div className="rounded-md border border-dashed border-line px-4 py-5">
                  <p className="text-sm text-muted">
                    No supplements have been added
                    yet.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setShowSupplementCreator(true)
                    }
                    className="mt-3 text-sm font-medium underline underline-offset-4"
                  >
                    Add a supplement
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {routines.map((routine) => {
                    const intake = getIntake(
                      routine.id,
                    );

                    const taken = intake?.taken;

                    return (
                      <div
                        key={routine.id}
                        className="rounded-md border border-line p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium">
                              {routine.name}
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              {
                                Object.keys(
                                  routine.nutrients,
                                ).length
                              }{" "}
                              nutrient
                              {Object.keys(
                                routine.nutrients,
                              ).length === 1
                                ? ""
                                : "s"}{" "}
                              configured
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSupplementTaken(
                                  routine,
                                  true,
                                )
                              }
                              disabled={
                                togglingRoutineId ===
                                routine.id
                              }
                              className={`rounded-md border px-4 py-2 text-sm font-medium ${
                                taken === true
                                  ? "border-ink bg-ink text-white"
                                  : "border-line bg-background hover:bg-surface"
                              }`}
                            >
                              Yes
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setSupplementTaken(
                                  routine,
                                  false,
                                )
                              }
                              disabled={
                                togglingRoutineId ===
                                routine.id
                              }
                              className={`rounded-md border px-4 py-2 text-sm font-medium ${
                                taken === false
                                  ? "border-ink bg-ink text-white"
                                  : "border-line bg-background hover:bg-surface"
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>

                        {/* MICRONUTRIENTS LOGGED */}

                        {taken === true ? (
                          <div className="mt-4 border-t border-line pt-4">
                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                              Micronutrients logged
                            </p>

                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {Object.entries(
                                routine.nutrients,
                              ).map(
                                ([key, rda]) => (
                                  <div
                                    key={key}
                                    className="flex items-center justify-between rounded-md border border-line px-3 py-2.5"
                                  >
                                    <div>
                                      <span className="text-sm">
                                        {getNutrientLabel(
                                          key,
                                        )}
                                      </span>

                                      <p className="mt-0.5 text-xs text-muted">
                                        {getNutrientUnit(
                                          key,
                                        )}
                                      </p>
                                    </div>

                                    <span className="text-sm text-muted">
                                      {rda}% RDA
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        ) : null}

                        {taken === false ? (
                          <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
                            Not taken.
                          </p>
                        ) : null}

                        {/* DELETE */}

                        <div className="mt-4 border-t border-line pt-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteRoutine(
                                routine.id,
                              )
                            }
                            disabled={
                              deletingRoutineId ===
                              routine.id
                            }
                            className="text-xs text-muted hover:text-ink hover:underline disabled:opacity-50"
                          >
                            {deletingRoutineId ===
                            routine.id
                              ? "Deleting..."
                              : "Delete supplement"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* =====================================================
            MEALS
        ===================================================== */}

        <div className="mt-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            MEALS
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Meals for this day
          </h2>

          {loading ? (
            <p className="mt-4 text-sm text-muted">
              Loading...
            </p>
          ) : selectedDayLogs.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">
                No meals recorded for this day.
              </p>
            </Card>
          ) : (
            <div className="mt-4 space-y-3">
              {selectedDayLogs.map((log) => (
                <Card key={log.id}>
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {log.meal_type}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        {formatDate(log.meal_date)}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
                        {log.calories !== null ? (
                          <span>
                            {log.calories} kcal
                          </span>
                        ) : null}

                        {log.protein_g !== null ? (
                          <span>
                            {log.protein_g} g protein
                          </span>
                        ) : null}
                      </div>

                      {log.notes ? (
                        <p className="mt-3 text-sm leading-relaxed text-muted">
                          {log.notes}
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteMeal(log.id)
                      }
                      disabled={
                        deletingMealId === log.id
                      }
                      className="shrink-0 text-xs text-muted hover:text-ink hover:underline disabled:opacity-50"
                    >
                      {deletingMealId === log.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

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
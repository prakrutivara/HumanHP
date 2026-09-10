"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type HealthEvent = {
  id: string;
  event_date: string;
  description: string;
  severity: number;
  created_at: string;
};

type Symptom = {
  name: string;
  severity: number;
  duration: string;
  possible_explanations?: PossibleExplanation[];
  warning_signs?: string[];
  recommended_actions?: string[];
};

type PossibleExplanation = {
  name: string;
  reason: string;
};

type Assessment = {
  symptoms: Symptom[];
  doctor_urgency: {
    level: "LOW" | "MODERATE" | "HIGH";
    reason: string;
  };
  // Legacy fields are kept only so older saved assessments do not break.
  possible_explanations?: PossibleExplanation[];
  warning_signs?: string[];
  recommended_actions?: string[];
};


function AssessmentTable({
  assessment,
  date,
}: {
  assessment: Assessment;
  date: string;
}) {
  const [openPanel, setOpenPanel] =
    useState<string | null>(null);

  const symptoms = assessment.symptoms ?? [];

  function getPossibilities(symptom: Symptom, index: number) {
    return symptom.possible_explanations ??
      (index === 0 ? assessment.possible_explanations ?? [] : []);
  }

  function getWarnings(symptom: Symptom, index: number) {
    return symptom.warning_signs ??
      (index === 0 ? assessment.warning_signs ?? [] : []);
  }

  function getActions(symptom: Symptom, index: number) {
    return symptom.recommended_actions ??
      (index === 0 ? assessment.recommended_actions ?? [] : []);
  }

  return (
    <div className="overflow-hidden rounded-md border border-line">
      <table className="w-full min-w-[1120px] text-left text-sm">
        <thead className="border-b border-line bg-black/[0.02]">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Symptom</th>
            <th className="px-4 py-3 font-medium">Severity</th>
            <th className="px-4 py-3 font-medium">Duration</th>
            <th className="px-4 py-3 font-medium">Possibilities</th>
            <th className="px-4 py-3 font-medium">Doctor urgency</th>
            <th className="px-4 py-3 font-medium">Warning signs</th>
            <th className="px-4 py-3 font-medium">Next steps</th>
          </tr>
        </thead>

        <tbody>
          {symptoms.length === 0 ? (
            <tr>
              <td className="px-4 py-4 text-muted" colSpan={8}>
                No symptoms were specified.
              </td>
            </tr>
          ) : (
            symptoms.map((symptom, index) => {
              const possibilities = getPossibilities(symptom, index);
              const warnings = getWarnings(symptom, index);
              const actions = getActions(symptom, index);

              return (
                <tr key={`${symptom.name}-${index}`} className="align-top border-b border-line last:border-b-0">
                  <td className="px-4 py-4 whitespace-nowrap">{date}</td>

                  <td className="px-4 py-4 font-medium">{symptom.name}</td>

                  <td className="px-4 py-4 whitespace-nowrap text-muted">
                    {severityLabel(symptom.severity)}
                  </td>

                  <td className="px-4 py-4 max-w-[180px]">
                    {symptom.duration}
                  </td>

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenPanel(
                          openPanel === `possibilities-${index}`
                            ? null
                            : `possibilities-${index}`
                        )
                      }
                      className="text-sm font-medium underline underline-offset-4 hover:opacity-70"
                    >
                      {openPanel === `possibilities-${index}` ? "Hide" : "View"}
                    </button>

                    {openPanel === `possibilities-${index}` ? (
                      <div className="mt-3 min-w-[220px] max-w-[320px] space-y-3">
                        {possibilities.length === 0 ? (
                          <p className="text-sm text-muted">
                            No specific possibilities were identified from the available information.
                          </p>
                        ) : (
                          possibilities.map((item, itemIndex) => (
                            <div key={`${item.name}-${itemIndex}`} className="rounded-md border border-line px-3 py-3">
                              <p className="font-medium">{item.name}</p>
                              <p className="mt-1 leading-relaxed text-muted">{item.reason}</p>
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
                  </td>

                  <td className="px-4 py-4">
                    <div
                      className={`inline-flex rounded-md border px-2.5 py-1.5 text-xs font-semibold ${urgencyClass(
                        assessment.doctor_urgency.level
                      )}`}
                    >
                      {assessment.doctor_urgency.level}
                    </div>
                    <p className="mt-2 max-w-[190px] text-xs leading-relaxed text-muted">
                      {assessment.doctor_urgency.reason}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenPanel(
                          openPanel === `warnings-${index}`
                            ? null
                            : `warnings-${index}`
                        )
                      }
                      className="text-sm font-medium underline underline-offset-4 hover:opacity-70"
                    >
                      {openPanel === `warnings-${index}` ? "Hide" : "View"}
                    </button>

                    {openPanel === `warnings-${index}` ? (
                      <div className="mt-3 min-w-[200px] max-w-[280px]">
                        {warnings.length === 0 ? (
                          <p className="text-sm text-muted">
                            No specific warning signs were identified from the information provided.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {warnings.map((warning, warningIndex) => (
                              <li key={warningIndex} className="text-sm leading-relaxed">
                                • {warning}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </td>

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenPanel(
                          openPanel === `actions-${index}`
                            ? null
                            : `actions-${index}`
                        )
                      }
                      className="text-sm font-medium underline underline-offset-4 hover:opacity-70"
                    >
                      {openPanel === `actions-${index}` ? "Hide" : "View"}
                    </button>

                    {openPanel === `actions-${index}` ? (
                      <div className="mt-3 min-w-[220px] max-w-[300px]">
                        {actions.length === 0 ? (
                          <p className="text-sm text-muted">
                            No specific next steps were identified from the information provided.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {actions.map((action, actionIndex) => (
                              <li key={actionIndex} className="text-sm leading-relaxed">
                                • {action}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}


type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AssistantResult = {
  type: "follow_up" | "assessment";
  message: string;
  assessment?: Assessment;
};

type SavedAssessment = {
  id: string;
  user_message: string;
  assessment: Assessment;
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

function formatDateTime(date: string) {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function urgencyClass(
  level: Assessment["doctor_urgency"]["level"]
) {
  if (level === "HIGH") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (level === "MODERATE") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-line bg-background text-ink";
}

function severityLabel(severity: number) {
  return `${severity}/5`;
}

function RecommendedNextSteps({
  assessment,
}: {
  assessment: Assessment;
}) {
  const groups = (assessment.symptoms ?? [])
    .map((symptom, index) => ({
      name: symptom.name,
      actions:
        symptom.recommended_actions ??
        (index === 0 ? assessment.recommended_actions ?? [] : []),
    }))
    .filter((group) => group.actions.length > 0);

  return (
    <div className="mt-5 rounded-md border border-line bg-background px-4 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        Recommended Next Steps
      </p>

      {groups.length > 0 ? (
        <div className="mt-3 space-y-4">
          {groups.map((group, index) => (
            <div key={`${group.name}-${index}`}>
              <p className="text-sm font-medium">{group.name}</p>
              <ul className="mt-2 space-y-2">
                {group.actions.map((action, actionIndex) => (
                  <li key={actionIndex} className="text-sm leading-relaxed">
                    • {action}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-muted">
          No specific next steps were identified from the information provided.
          Follow the guidance above and seek professional medical care when appropriate.
        </p>
      )}
    </div>
  );
}

export default function HealthPage() {
  const [eventDate, setEventDate] =
    useState(getToday());

  const [dateMode, setDateMode] =
    useState<"today" | "select">("today");

  const [description, setDescription] =
    useState("");

  const [severity, setSeverity] =
    useState("1");

  const [events, setEvents] =
    useState<HealthEvent[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [chatInput, setChatInput] =
    useState("");

  const [chatMessages, setChatMessages] =
    useState<ChatMessage[]>([]);

  const [assistantLoading, setAssistantLoading] =
    useState(false);

  const [assistantError, setAssistantError] =
    useState("");

  const [currentAssessment, setCurrentAssessment] =
    useState<Assessment | null>(null);

  const [currentAssessmentDate, setCurrentAssessmentDate] =
    useState("");

  const [savedAssessments, setSavedAssessments] =
    useState<SavedAssessment[]>([]);

  const [assessmentLoading, setAssessmentLoading] =
    useState(true);

  async function loadEvents() {
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
      .from("health_events")
      .select(
        "id, event_date, description, severity, created_at"
      )
      .eq("user_id", user.id)
      .order("event_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setMessage(error.message);
    } else {
      setEvents(data ?? []);
    }

    setLoading(false);
  }

  async function loadAssessments() {
    const supabase =
      createBrowserSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAssessmentLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("health_assessments")
      .select(
        "id, user_message, assessment, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Assessment history error:",
        error
      );
    } else {
      setSavedAssessments(
        (data ?? []) as SavedAssessment[]
      );
    }

    setAssessmentLoading(false);
  }

  useEffect(() => {
    loadEvents();
    loadAssessments();
  }, []);

  function handleToday() {
    setDateMode("today");
    setEventDate(getToday());
  }

  function handleSelectDate() {
    setDateMode("select");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!eventDate) {
      setMessage("Please select a date.");
      return;
    }

    if (!description.trim()) {
      setMessage(
        "Please describe what you experienced."
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
        "Your session has expired. Please log in again."
      );

      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("health_events")
      .insert({
        user_id: user.id,
        event_date: eventDate,
        description: description.trim(),
        severity: Number(severity),
      });

    if (error) {
      setMessage(error.message);
    } else {
      setDescription("");
      setSeverity("1");
      setDateMode("today");
      setEventDate(getToday());

      setMessage("Health event saved.");

      await loadEvents();
    }

    setSaving(false);
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Delete this health entry?\n\nThis action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setMessage("");

    const supabase =
      createBrowserSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Your session has expired. Please log in again."
      );

      setDeletingId(null);
      return;
    }

    const { error } = await supabase
      .from("health_events")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setMessage(error.message);
    } else {
      setEvents((current) =>
        current.filter(
          (entry) => entry.id !== id
        )
      );

      setMessage("Health entry deleted.");
    }

    setDeletingId(null);
  }

  async function handleAssistantSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const message = chatInput.trim();

    if (!message || assistantLoading) {
      return;
    }

    setAssistantError("");
    setChatInput("");

    const updatedMessages: ChatMessage[] = [
      ...chatMessages,
      {
        role: "user",
        content: message,
      },
    ];

    setChatMessages(updatedMessages);
    setAssistantLoading(true);

    try {
      const response = await fetch(
        "/api/health-assistant",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            conversation: chatMessages,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Health Assistant request failed."
        );
      }

      const result =
        data.result as AssistantResult;

      setChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.message,
        },
      ]);

      if (
        result.type === "assessment" &&
        result.assessment
      ) {
        setCurrentAssessment(
          result.assessment
        );

        setCurrentAssessmentDate(
          new Date().toISOString()
        );

        const supabase =
          createBrowserSupabaseClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { error: saveError } =
            await supabase
              .from("health_assessments")
              .insert({
                user_id: user.id,
                user_message:
                  updatedMessages
                    .filter(
                      (item) =>
                        item.role === "user"
                    )
                    .map(
                      (item) => item.content
                    )
                    .join("\n"),
                assessment:
                  result.assessment,
              });

          if (saveError) {
            console.error(
              "Assessment save error:",
              saveError
            );
          } else {
            await loadAssessments();
          }
        }
      }
    } catch (error) {
      console.error(
        "Health Assistant request error:",
        error
      );

      setAssistantError(
        error instanceof Error
          ? error.message
          : "Unable to reach the Health Assistant."
      );
    } finally {
      setAssistantLoading(false);
    }
  }

  function clearAssessmentConversation() {
    setChatMessages([]);
    setCurrentAssessment(null);
    setCurrentAssessmentDate("");
    setAssistantError("");
  }

  async function handleDeleteAssessment(
    id: string
  ) {
    const confirmed = window.confirm(
      "Delete this health assessment?"
    );

    if (!confirmed) {
      return;
    }

    const supabase =
      createBrowserSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { error } = await supabase
      .from("health_assessments")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (!error) {
      setSavedAssessments((current) =>
        current.filter(
          (item) => item.id !== id
        )
      );
    }
  }

  return (
    <AppShell currentPath="/dashboard/health">
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
          Health
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Record health events, discuss symptoms,
          and review Health Assessments.
        </p>

        {/* HEALTH ASSISTANT */}

        <div className="mt-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            HEALTH ASSISTANT
          </p>

          <div className="mt-2 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              Health Assessment
            </h2>

            {chatMessages.length > 0 ? (
              <button
                type="button"
                onClick={
                  clearAssessmentConversation
                }
                className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                New assessment
              </button>
            ) : null}
          </div>

          <p className="mt-2 text-sm leading-relaxed text-muted">
            Describe what you are experiencing
            naturally. The assistant may ask
            follow-up questions before preparing an
            assessment.
          </p>
        </div>

        <div className="mt-4">
          <Card>
            {chatMessages.length === 0 ? (
              <div className="rounded-md border border-line bg-background px-4 py-4">
                <p className="text-sm font-medium">
                  Start by telling me what you are
                  experiencing.
                </p>

                <p className="mt-2 text-sm leading-relaxed text-muted">
                  For example: “I have had a
                  headache for three days and it is
                  about 4 out of 5 in severity.”
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map(
                  (chat, index) => (
                    <div
                      key={`${chat.role}-${index}`}
                      className={
                        chat.role === "user"
                          ? "ml-8 rounded-md bg-ink px-4 py-3 text-sm text-white"
                          : "mr-8 rounded-md border border-line bg-background px-4 py-3 text-sm leading-relaxed"
                      }
                    >
                      {chat.content}
                    </div>
                  )
                )}
              </div>
            )}

            {assistantLoading ? (
              <p className="mt-4 text-sm text-muted">
                Thinking...
              </p>
            ) : null}

            {assistantError ? (
              <p className="mt-4 text-sm text-red-700">
                {assistantError}
              </p>
            ) : null}

            <form
              onSubmit={handleAssistantSubmit}
              className="mt-5 flex flex-col gap-3 sm:flex-row"
            >
              <textarea
                value={chatInput}
                onChange={(event) =>
                  setChatInput(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();

                    if (
                      !assistantLoading &&
                      chatInput.trim()
                    ) {
                      event.currentTarget.form?.requestSubmit();
                    }
                  }
                }}
                placeholder="Describe your symptoms or ask a health question..."
                rows={3}
                className="min-h-[76px] flex-1 resize-none rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                disabled={assistantLoading}
              />

              <button
                type="submit"
                disabled={
                  assistantLoading ||
                  !chatInput.trim()
                }
                className="self-end rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assistantLoading
                  ? "Sending..."
                  : "Send"}
              </button>
            </form>

            <p className="mt-2 text-xs text-muted">
              Enter to send · Shift + Enter for a
              new line
            </p>
          </Card>
        </div>

        {/* CURRENT ASSESSMENT */}

        {currentAssessment ? (
          <div className="mt-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              ASSESSMENT
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Current Health Assessment
            </h2>

            <div className="mt-4 overflow-x-auto">
              <AssessmentTable
                assessment={currentAssessment}
                date={
                  currentAssessmentDate
                    ? formatDate(
                        currentAssessmentDate
                          .slice(0, 10)
                      )
                    : formatDate(getToday())
                }
              />
            </div>

            <RecommendedNextSteps assessment={currentAssessment} />

            <p className="mt-4 text-xs leading-relaxed text-muted">
              This is an AI-assisted health
              assessment, not a medical diagnosis.
              Possible explanations are not
              definitive. Seek professional medical
              care when appropriate, especially if
              symptoms are severe, worsening, or
              accompanied by warning signs.
            </p>
          </div>
        ) : null}

        {/* SAVED ASSESSMENTS */}

        <div className="mt-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            ASSESSMENT HISTORY
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Previous Health Assessments
          </h2>

          {assessmentLoading ? (
            <p className="mt-4 text-sm text-muted">
              Loading...
            </p>
          ) : savedAssessments.length === 0 ? (
            <div className="mt-4">
              <Card>
                <p className="text-sm text-muted">
                  No Health Assessments saved yet.
                </p>
              </Card>
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              {savedAssessments.map((saved) => (
                <div key={saved.id}>
                  <div className="mb-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteAssessment(
                          saved.id
                        )
                      }
                      className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <AssessmentTable
                      assessment={
                        saved.assessment
                      }
                      date={formatDate(
                        saved.created_at.slice(
                          0,
                          10
                        )
                      )}
                    />
                  </div>

                  <RecommendedNextSteps assessment={saved.assessment} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LOG HEALTH EVENT */}

        <div className="mt-12">
          <h2 className="text-xl font-semibold">
            Log manually
          </h2>

          <p className="mt-2 text-sm font-semibold">
            Enter your symptoms and severity
          </p>
        </div>

        <Card>
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
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
                  {formatDate(eventDate)}
                </p>
              ) : (
                <input
                  type="date"
                  value={eventDate}
                  onChange={(event) =>
                    setEventDate(
                      event.target.value
                    )
                  }
                  className="mt-3 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                  required
                />
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="text-sm font-medium"
              >
                What happened?
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="e.g. Headache after a long day"
                rows={4}
                className="mt-2 w-full resize-none rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
                required
              />
            </div>

            <div>
              <label
                htmlFor="severity"
                className="text-sm font-medium"
              >
                Severity
              </label>

              <select
                id="severity"
                value={severity}
                onChange={(event) =>
                  setSeverity(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-md border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-ink"
              >
                <option value="1">
                  1 — Mild
                </option>

                <option value="2">
                  2 — Moderate
                </option>

                <option value="3">
                  3 — Noticeable
                </option>

                <option value="4">
                  4 — Severe
                </option>

                <option value="5">
                  5 — Very severe
                </option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save health event"}
            </button>

            {message ? (
              <p className="text-sm text-muted">
                {message}
              </p>
            ) : null}
          </form>
        </Card>

        {/* HEALTH EVENT HISTORY */}

        <div className="mt-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            HISTORY
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Health timeline
          </h2>

          {loading ? (
            <p className="mt-4 text-sm text-muted">
              Loading...
            </p>
          ) : events.length === 0 ? (
            <div className="mt-4">
              <Card>
                <p className="text-sm text-muted">
                  No health events logged yet.
                </p>
              </Card>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {events.map((entry) => (
                <Card key={entry.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-muted">
                        {formatDate(
                          entry.event_date
                        )}
                      </p>

                      <p className="mt-2 text-sm leading-relaxed">
                        {entry.description}
                      </p>

                      <p className="mt-2 text-xs text-muted">
                        Severity: {entry.severity}/5
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(entry.id)
                      }
                      disabled={
                        deletingId === entry.id
                      }
                      className="shrink-0 text-xs text-muted underline-offset-4 hover:text-ink hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === entry.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
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
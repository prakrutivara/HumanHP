import { NextResponse } from "next/server";
import OpenAI from "openai";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type Symptom = {
  name: string;
  severity: number;
  duration: string;
  possible_explanations: PossibleExplanation[];
  warning_signs: string[];
  recommended_actions: string[];
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
};

type AssistantResult = {
  type: "follow_up" | "assessment";
  message: string;
  assessment?: Assessment;
};

const SYSTEM_PROMPT = `
You are the Health Assessment assistant inside HUMANHP.

Your job is to have a careful, short conversational intake about the user's
current health concern and ONLY THEN produce an informational health
assessment.

You are not a doctor and this is not a diagnosis.

IMPORTANT MEDICAL SAFETY RULES:

- Do NOT diagnose a disease with certainty.
- Do NOT claim that the user definitely has or definitely does not have a condition.
- Do NOT prescribe medication.
- Do NOT provide medication dosages.
- Possible explanations must always be described as possibilities.
- Do not make unsupported causal claims.
- If the user asks whether something caused a symptom, use cautious language such
  as "may be related", "can sometimes contribute", or "there is not enough
  information to determine that".
- If potentially serious or emergency symptoms are described, recommend urgent
  or emergency medical care.
- Never reassure the user that medical care is unnecessary.
- Do not invent information that the user has not provided.
- Do not infer that a symptom is absent simply because the user did not mention it.

==================================================
CONVERSATION / INTAKE RULES
==================================================

This is a CONVERSATION, not a one-message classifier.

Your first priority is to understand what the user is actually experiencing.

DO NOT TERMINATE THE CONVERSATION WITH AN ASSESSMENT JUST BECAUSE THE USER
HAS GIVEN A SYMPTOM NAME AND A SEVERITY.

Before producing an assessment, collect the important information that is
relevant to the user's particular symptoms.

For each relevant symptom, try to establish:

1. WHAT the symptom is.
2. WHEN it started.
3. HOW LONG it has been present.
4. SEVERITY from 1 to 5, if applicable.
5. WHETHER it is improving, worsening, or staying the same.
6. IMPORTANT associated symptoms.
7. Relevant triggers, activities, or circumstances.
8. What makes it better or worse, when relevant.
9. Relevant red-flag information for that type of symptom.

You do NOT need to ask every possible medical question.

Ask only questions that are relevant and useful.

Do NOT ask all questions at once.

Ask ONE concise follow-up question at a time, or at most two closely related
questions when they naturally belong together.

==================================================
HARD ASSESSMENT GATE
==================================================

You may return type "assessment" ONLY when the conversation contains enough
information to reasonably understand the current concern.

For a normal non-emergency concern, the minimum useful information should
generally include:

- the main symptom or symptoms
- severity or a reasonable description of severity
- onset / duration
- whether it is improving, worsening, or stable
- relevant associated symptoms OR enough information to determine that there
  are no concerning associated symptoms mentioned by the user
- relevant red-flag screening for the symptom

If any important item is missing, return type "follow_up".

Do NOT make an assessment merely because the user has answered one question.

Do NOT repeatedly ask for information the user has already provided.

Use the entire conversation, including all previous user messages and your
previous questions, when deciding what information is still missing.

If the user's initial message already contains all of the relevant information,
you may proceed to the assessment without unnecessary questioning.

==================================================
EMERGENCY EXCEPTION
==================================================

If the user describes symptoms that could indicate an emergency, do not delay
urgent guidance just to complete the normal intake process.

In that situation, provide the urgent recommendation immediately and use
HIGH urgency in the assessment when appropriate.

==================================================
FOLLOW-UP STYLE
==================================================

Follow-up questions should sound natural and human.

Do not overwhelm the user.

==================================================
FINAL ASSESSMENT
==================================================

When the hard assessment gate has been satisfied, produce the final
informational assessment.

Every symptom must be represented individually.

Possible explanations, warning signs, and recommended actions must be relevant
to the individual symptom.

Do not give generic explanations when the conversation supports a more
specific possibility.

Use cautious wording such as:

- "may be related to"
- "can sometimes occur with"
- "one possible explanation is"
- "this pattern can be seen with"

Do not claim certainty.

Recommended actions should be practical, conservative, and appropriate to the
information provided.

Do not prescribe medication or dosages.

==================================================
STRUCTURED OUTPUT
==================================================

You MUST return exactly one JSON object.

There are only two valid response types.

FOLLOW-UP:

{
  "type": "follow_up",
  "message": "one concise follow-up question"
}

ASSESSMENT:

{
  "type": "assessment",
  "message": "a short natural summary of what was understood",
  "assessment": {
    "symptoms": [
      {
        "name": "symptom name",
        "severity": 1,
        "duration": "duration",
        "possible_explanations": [
          {
            "name": "possible explanation",
            "reason": "why this possibility fits the information provided"
          }
        ],
        "warning_signs": [
          "symptom-specific warning sign"
        ],
        "recommended_actions": [
          "reasonable next step"
        ]
      }
    ],
    "doctor_urgency": {
      "level": "LOW",
      "reason": "why this urgency level was selected"
    }
  }
}

Severity MUST be an integer from 1 to 5.

Doctor urgency MUST be exactly one of:

- LOW
- MODERATE
- HIGH

Use an empty array when there are no relevant items.

If the user explicitly says they do not know, are unsure, or cannot remember
something, use "Not specified" rather than inventing an answer.

Do not include confidence percentages.

Do not include Markdown.

Do not include code fences.

Do not put any text outside the JSON object.

The final assessment is informational and should encourage professional medical
care when appropriate.
`;

function cleanJsonText(text: string): string {
  let cleaned = text.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  return cleaned;
}

function extractJson(text: string): unknown {
  const cleaned = cleanJsonText(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    // Continue below.
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("FreeLLMAPI returned invalid JSON.");
  }

  const possibleJson = cleaned.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(possibleJson);
  } catch {
    throw new Error("FreeLLMAPI returned invalid JSON.");
  }
}

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function validateAssessment(
  value: unknown
): value is Assessment {
  if (!isObject(value)) {
    return false;
  }

  if (!Array.isArray(value.symptoms)) {
    return false;
  }

  if (!isObject(value.doctor_urgency)) {
    return false;
  }

  for (const symptom of value.symptoms) {
    if (!isObject(symptom)) {
      return false;
    }

    if (typeof symptom.name !== "string") {
      return false;
    }

    if (
      typeof symptom.severity !== "number" ||
      !Number.isInteger(symptom.severity) ||
      symptom.severity < 1 ||
      symptom.severity > 5
    ) {
      return false;
    }

    if (typeof symptom.duration !== "string") {
      return false;
    }

    if (!Array.isArray(symptom.possible_explanations)) {
      return false;
    }

    if (!Array.isArray(symptom.warning_signs)) {
      return false;
    }

    if (!Array.isArray(symptom.recommended_actions)) {
      return false;
    }

    for (const explanation of symptom.possible_explanations) {
      if (!isObject(explanation)) {
        return false;
      }

      if (typeof explanation.name !== "string") {
        return false;
      }

      if (typeof explanation.reason !== "string") {
        return false;
      }
    }

    for (const warning of symptom.warning_signs) {
      if (typeof warning !== "string") {
        return false;
      }
    }

    for (const action of symptom.recommended_actions) {
      if (typeof action !== "string") {
        return false;
      }
    }
  }

  const urgency = value.doctor_urgency;

  if (
    urgency.level !== "LOW" &&
    urgency.level !== "MODERATE" &&
    urgency.level !== "HIGH"
  ) {
    return false;
  }

  if (typeof urgency.reason !== "string") {
    return false;
  }

  return true;
}

function validateResult(
  value: unknown
): AssistantResult {
  if (!isObject(value)) {
    throw new Error("FreeLLMAPI returned an invalid response.");
  }

  if (
    value.type !== "follow_up" &&
    value.type !== "assessment"
  ) {
    throw new Error("FreeLLMAPI returned an invalid response type.");
  }

  if (typeof value.message !== "string") {
    throw new Error("FreeLLMAPI returned an invalid message.");
  }

  if (value.type === "follow_up") {
    return {
      type: "follow_up",
      message: value.message,
    };
  }

  if (!validateAssessment(value.assessment)) {
    throw new Error(
      "FreeLLMAPI returned an incomplete health assessment."
    );
  }

  return {
    type: "assessment",
    message: value.message,
    assessment: value.assessment,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const conversation: ConversationMessage[] =
      Array.isArray(body.conversation)
        ? body.conversation.filter(
            (item: unknown): item is ConversationMessage =>
              isObject(item) &&
              (item.role === "user" ||
                item.role === "assistant") &&
              typeof item.content === "string"
          )
        : [];

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a message.",
        },
        { status: 400 }
      );
    }

    const messages = [
      {
        role: "system" as const,
        content: SYSTEM_PROMPT,
      },
      ...conversation.map((item) => ({
        role: item.role,
        content: item.content,
      })),
      {
        role: "user" as const,
        content: message,
      },
    ];

    const apiKey = process.env.FREELLMAPI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "FREELLMAPI_API_KEY is not configured."
      );
    }

    const client = new OpenAI({
      apiKey,
      baseURL:
        process.env.FREELLMAPI_BASE_URL ||
        "http://127.0.0.1:31415/v1",
    });

    const response = await client.chat.completions.create({
      model: "auto",
      messages,
      temperature: 0.1,
      max_tokens: 1600,
      response_format: {
        type: "json_object",
      },
    });

    const rawResponse =
      response.choices[0]?.message?.content;

    if (!rawResponse || !rawResponse.trim()) {
      throw new Error(
        "FreeLLMAPI returned an empty response."
      );
    }

    console.log(
      "FreeLLMAPI health response:",
      rawResponse
    );

    const parsed = extractJson(rawResponse);
    const result = validateResult(parsed);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error(
      "Health Assistant API error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to process the Health Assessment.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}	
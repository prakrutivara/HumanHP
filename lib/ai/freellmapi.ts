```ts
import OpenAI from "openai";

const apiKey = process.env.FREELLMAPI_API_KEY;
const baseURL =
  process.env.FREELLMAPI_BASE_URL || "http://127.0.0.1:31415/v1";

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const healthAssessmentSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["follow_up", "assessment"],
    },
    message: {
      type: "string",
    },
    assessment: {
      type: "object",
      properties: {
        symptoms: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
              },
              severity: {
                type: "integer",
              },
              duration: {
                type: "string",
              },
            },
            required: ["name", "severity", "duration"],
            additionalProperties: false,
          },
        },

        possible_explanations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
              },
              reason: {
                type: "string",
              },
            },
            required: ["name", "reason"],
            additionalProperties: false,
          },
        },

        doctor_urgency: {
          type: "object",
          properties: {
            level: {
              type: "string",
              enum: ["LOW", "MODERATE", "HIGH"],
            },
            reason: {
              type: "string",
            },
          },
          required: ["level", "reason"],
          additionalProperties: false,
        },

        warning_signs: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },

      required: [
        "symptoms",
        "possible_explanations",
        "doctor_urgency",
        "warning_signs",
      ],

      additionalProperties: false,
    },
  },

  required: ["type", "message", "assessment"],
  additionalProperties: false,
};

export async function freellmapiChat(
  messages: AIMessage[]
): Promise<string> {
  if (!apiKey) {
    throw new Error("FREELLMAPI_API_KEY is not configured.");
  }

  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  try {
    const response = await client.chat.completions.create({
      model: "auto",
      messages,
      temperature: 0.1,
      max_tokens: 1600,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "health_assessment",
          strict: true,
          schema: healthAssessmentSchema,
        },
      },
    });

    const text = response.choices[0]?.message?.content;

    if (!text || !text.trim()) {
      throw new Error("FreeLLMAPI returned an empty response.");
    }

    return text.trim();
  } catch (error) {
    console.error("FreeLLMAPI error:", error);

    if (error instanceof Error) {
      throw new Error(
        "FreeLLMAPI request failed: " + error.message
      );
    }

    throw new Error("FreeLLMAPI request failed.");
  }
}
```

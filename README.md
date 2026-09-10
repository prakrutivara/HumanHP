# HumanHP

<p align="center">
  <strong>Your Human State, in one place.</strong><br>
  A personal health, wellness, fitness, nutrition, and goals platform with AI-assisted interpretation.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Supabase-Auth%20%2B%20Database-3ECF8E?logo=supabase\&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/AI-FreeLLMAPI-purple" alt="AI">
</p>

\---

## Overview

**HumanHP** is a web-first personal **Human State** system.

Most personal health and wellness tools treat sleep, exercise, food, symptoms, and goals as separate trackers. HumanHP is designed around a different idea:

> \*\*Capture the different parts of a person's life, then bring them together into one structured view of their current state.\*\*

Users can record information across five connected domains:

* **Health** — symptoms and health events
* **Wellness** — sleep, water, energy, and mood
* **Fitness** — workouts and physical activity
* **Nutrition** — meals, calories, protein, and supplement routines
* **Goals** — personal goals and measurable progress

The application aggregates these records into a **Human State**, where deterministic analytics identify supported observations and cross-domain patterns.

\---

## Why HumanHP?

The interesting part of HumanHP is not simply storing health data.

It is the separation between **what the application can calculate reliably** and **what AI is useful for**.

```text
Health ──────┐
Wellness ────┤
Fitness ─────┤
Nutrition ───┼──> Human State ──> Analytics ──> AI Context ──> Interpretation
Goals ───────┘
```

**Application code performs calculations. AI handles language and interpretation.**

For example, pace is calculated deterministically from distance and duration rather than asking a language model to perform arithmetic.

\---

# Features

## Health

### Health Event Logging

Record health-related observations with:

* Event type
* Severity (1–5)
* Duration
* Notes
* Date

### AI-Assisted Health Assessment

Describe symptoms naturally and HumanHP can conduct a conversational assessment.

The assessment can provide:

* Structured symptom information
* Severity and duration
* Possible explanations
* Warning signs to watch for
* Recommended next steps
* Doctor-urgency guidance

The assistant can ask focused follow-up questions when additional information is needed instead of immediately producing an assessment.

> \*\*Safety:\*\* HumanHP's Health Assessment is informational and AI-assisted. It is \*\*not a medical diagnosis\*\*, and possible explanations are not definitive.

\---

## Wellness

Track the everyday signals that contribute to how you feel:

* Sleep duration
* Water intake
* Energy (1–5)
* Mood (1–5)

\---

## Fitness

Log physical activity such as:

* Running
* Walking
* Gym
* Cycling
* Yoga
* Other activities

Track:

* Duration
* Distance
* Intensity
* Notes

For activities where distance and duration are available, HumanHP calculates pace deterministically in application code.

\---

## Nutrition

Keep nutrition logging simple and useful rather than trying to become a massive food database.

Record:

* Meals / food descriptions
* Calories
* Protein
* Additional nutrition information
* Notes

HumanHP also supports supplement routines and nutrient/RDA information.

\---

## Goals

Create personal goals and track measurable progress alongside the rest of your Human State.

The goal system is designed to avoid inventing progress when the available data is insufficient.

\---

## Human State

The Human State is the core concept behind HumanHP.

It brings together:

|Domain|Example information|
|-|-|
|**Wellness**|Sleep, water, energy, mood|
|**Health**|Recent events, severity, frequency|
|**Fitness**|Activity, duration, distance|
|**Nutrition**|Calories, protein, available nutrition data|
|**Goals**|Active goals and measurable progress|
|**Signals**|Supported observations across domains|

### Cross-domain observations

When the data supports it, HumanHP can identify patterns such as:

* Fatigue occurring alongside below-average sleep
* Changes in activity volume
* Sleep differences on higher-activity days
* Protein intake compared with workout days
* Mood or energy changes alongside changes in sleep

These are expressed as **observations**, not unsupported causal claims.

For example:

> Lower sleep was observed on days with higher activity.

rather than:

> Your workout caused your poor sleep.

\---

# AI Architecture

HumanHP keeps the AI layer separate from the underlying Human State engine.

```text
User Data
    │
    ▼
Data Access
    │
    ▼
Human State Builder
    │
    ▼
Deterministic Analytics
    │
    ├── Metrics
    ├── Aggregations
    └── Supported observations
    │
    ▼
AI Context
    │
    ▼
AI Provider
    │
    ▼
Natural-language interpretation
```

This separation makes the system easier to reason about and allows the AI provider to change without redesigning the Human State model.

### Current AI setup

The current development version uses **FreeLLMAPI** as a local OpenAI-compatible AI gateway.

That means:

* Provider credentials remain outside the application source code
* The application talks to an OpenAI-compatible endpoint
* FreeLLMAPI handles the configured provider/model routing
* The AI integration can remain provider-independent

\---

# Architecture

```text
┌─────────────────────────────────────────────────────┐
│                     Next.js App                     │
│                                                     │
│  Health │ Wellness │ Fitness │ Nutrition │ Goals   │
│                         │                           │
│                         ▼                           │
│                  Human State Page                   │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │     Supabase    │
                 │ Auth + Database │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │    Analytics    │
                 │  Deterministic  │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │    AI Context   │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   FreeLLMAPI    │
                 │ Local AI Router │
                 └─────────────────┘
```

### Technology

* **Next.js** — application framework
* **React** — UI
* **TypeScript** — application types and logic
* **Tailwind CSS** — styling
* **Supabase** — authentication and persistent user data
* **FreeLLMAPI** — local OpenAI-compatible AI gateway
* **OpenAI SDK** — compatible client interface
* **Zod** — validation where applicable

\---

# Data \& Privacy

HumanHP is designed around authenticated, user-owned records.

Supabase is used for authentication and persistence, with records associated with authenticated user IDs and protected using Row Level Security where configured.

Sensitive environment files are intentionally excluded from Git:

```text
.env
.env.\*
!.env.example
```

**Never commit `.env.local` or an API key to the repository.**

\---

# Getting Started

## Prerequisites

You will need:

* Node.js
* npm
* A Supabase project configured for the application
* FreeLLMAPI running locally if you want to use the current AI Health Assessment

## 1\. Clone

```bash
git clone https://github.com/prakrutivara/HumanHP.git
cd HumanHP
```

## 2\. Install dependencies

```bash
npm install
```

## 3\. Configure environment variables

Create a local environment file:

```text
.env.local
```

Use `.env.example` as the template and provide your own Supabase credentials.

For the current FreeLLMAPI setup, the AI configuration is:

```env
FREELLMAPI\_BASE\_URL=http://127.0.0.1:31415/v1
FREELLMAPI\_API\_KEY=your\_freellmapi\_unified\_key
```

The API key must remain local and must never be committed.

## 4\. Start FreeLLMAPI

Run FreeLLMAPI locally and configure at least one AI provider/model.

The application uses the local OpenAI-compatible endpoint exposed by the FreeLLMAPI desktop application.

## 5\. Start HumanHP

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

\---

# Project Structure

```text
HumanHP/
│
├── app/
│   ├── api/
│   │   ├── health-assistant/
│   │   ├── insight/
│   │   └── test/
│   │
│   ├── auth/
│   ├── dashboard/
│   │   ├── health/
│   │   ├── wellness/
│   │   ├── fitness/
│   │   ├── nutrition/
│   │   ├── goals/
│   │   └── state/
│   │
│   └── ...
│
├── components/
│   ├── auth/
│   ├── brand/
│   ├── layout/
│   └── ui/
│
├── lib/
│   ├── ai/
│   ├── supabase/
│   ├── analytics.ts
│   ├── types.ts
│   ├── seedData.ts
│   └── ...
│
├── scripts/
│
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

\---

# Design Principles

### 1\. Data first

Insights should come from actual logged information rather than invented data.

### 2\. Deterministic where possible

If the application can calculate something reliably, application code should calculate it.

### 3\. AI for interpretation

AI is useful for natural-language interaction, contextual explanations, and conversational interpretation — not for basic arithmetic or authoritative medical decisions.

### 4\. Observation over causation

Patterns are described cautiously using the evidence available in the user's data.

### 5\. User-owned data

Authenticated users should only access their own records.

### 6\. Provider independence

The Human State engine should not depend on one particular AI provider.

### 7\. Simple product design

The interface intentionally favors minimalism, clear typography, responsive layouts, compact information, and consistent interaction patterns.

\---

# Health Disclaimer

HumanHP's Health Assessment is an **AI-assisted informational feature, not a medical diagnosis**.

Possible explanations are not definitive. Users should seek appropriate professional medical care when needed, especially when symptoms are severe, worsening, or accompanied by warning signs.

\---

# Project Status

**Active development**

HumanHP is being developed as a practical personal Human State platform, with the current focus on:

* Reliable user data persistence
* Cross-domain Human State analytics
* AI-assisted interaction
* Clear separation between deterministic application logic and AI interpretation
* A simple, professional web experience

\---

<p align="center">
  <strong>HumanHP</strong><br>
  <sub>One place to understand the different parts of your human state.</sub>
</p>


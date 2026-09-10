export interface HealthEvent {
  date: string; // "2026-09-09"
  type: string; // "headache", "fatigue", etc.
  severity: number; // 1-5
  durationHours?: number;
  notes?: string;
}

export interface WellnessLog {
  date: string;
  sleepMinutes: number;
  waterMl: number;
  energy: number; // 1-5
  mood: number; // 1-5
}

export interface HumanStateDay {
  date: string;
  wellness?: WellnessLog;
  healthEvents: HealthEvent[];
}
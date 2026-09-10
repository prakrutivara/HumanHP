import { HealthEvent, WellnessLog } from './types';

export const wellnessLogs: WellnessLog[] = [
  { date: "2026-09-05", sleepMinutes: 390, waterMl: 2000, energy: 3, mood: 3 },
  { date: "2026-09-06", sleepMinutes: 420, waterMl: 2400, energy: 4, mood: 4 },
  { date: "2026-09-07", sleepMinutes: 350, waterMl: 1800, energy: 2, mood: 2 },
  { date: "2026-09-08", sleepMinutes: 460, waterMl: 2600, energy: 4, mood: 4 },
  { date: "2026-09-09", sleepMinutes: 340, waterMl: 1900, energy: 2, mood: 3 },
];

export const healthEvents: HealthEvent[] = [
  { date: "2026-09-05", type: "fatigue", severity: 2 },
  { date: "2026-09-07", type: "headache", severity: 3, durationHours: 4 },
  { date: "2026-09-09", type: "fatigue", severity: 3 },
];
import { WellnessLog, HealthEvent } from './types';

export function averageSleepMinutes(logs: WellnessLog[]): number {
  if (!logs.length) return 0;
  return logs.reduce((sum, l) => sum + l.sleepMinutes, 0) / logs.length;
}

export function averageEnergy(logs: WellnessLog[]): number {
  if (!logs.length) return 0;
  return logs.reduce((sum, l) => sum + l.energy, 0) / logs.length;
}

export function healthEventFrequency(events: HealthEvent[], type: string): number {
  return events.filter(e => e.type === type).length;
}

export function lowSleepFatigueOverlap(
  wellness: WellnessLog[],
  events: HealthEvent[]
): string[] {
  const avgSleep = averageSleepMinutes(wellness);
  const fatigueDays = events.filter(e => e.type === "fatigue").map(e => e.date);

  return fatigueDays.filter(date => {
    const log = wellness.find(w => w.date === date);
    return log && log.sleepMinutes < avgSleep;
  });
}
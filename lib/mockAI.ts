import { WellnessLog, HealthEvent } from './types';
import { averageSleepMinutes, averageEnergy, lowSleepFatigueOverlap } from './analytics';

// This is intentionally NOT calling any LLM. It reads the deterministic
// output and phrases it. When you get an OpenAI key later, this function's
// signature stays the same — only its internals change.
export function generateInsight(wellness: WellnessLog[], events: HealthEvent[]): string {
  const avgSleep = Math.round(averageSleepMinutes(wellness));
  const avgEnergy = averageEnergy(wellness).toFixed(1);
  const overlapDays = lowSleepFatigueOverlap(wellness, events);

  let insight = `Your average sleep this period was ${Math.floor(avgSleep / 60)}h ${avgSleep % 60}m, and your average energy rating was ${avgEnergy}/5. `;

  if (overlapDays.length > 0) {
    insight += `Fatigue was recorded on ${overlapDays.length} day(s) that also had below-average sleep. This may be worth watching, but it doesn't establish cause.`;
  } else {
    insight += `No clear overlap was found between fatigue and low sleep in this sample.`;
  }

  return insight;
}
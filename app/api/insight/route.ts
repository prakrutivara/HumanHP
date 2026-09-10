import { NextResponse } from 'next/server';
import { wellnessLogs, healthEvents } from '@/lib/seedData';
import { generateInsight } from '@/lib/mockAI';

export async function GET() {
  const insight = generateInsight(wellnessLogs, healthEvents);
  return NextResponse.json({ insight, wellnessLogs, healthEvents });
}
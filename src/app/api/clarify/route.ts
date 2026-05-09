import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are given the Manim code for an animation that was already shown to a student, and the student's follow-up question about something they did not understand. Your job is to produce a NEW, SHORT Manim scene (one Scene class, under 30 seconds) that shows something the original did NOT show. Do not reproduce the original animation. Identify the specific sub-concept the student is asking about, and build a visual that isolates and clarifies only that. If the original showed a static band, consider animating a value moving through it. If the original labeled things, consider showing what happens when the parameters change. Produce a Python script with a single class named ClarificationScene.

Additional requirements:
- Use Manim Community Edition syntax only
- Use color constants: BLUE, RED, GREEN, YELLOW, WHITE
- Every object must be added to the scene before animating it
- Return ONLY raw Python code, no markdown, no explanation, no code fences`;

export async function POST(request: NextRequest) {
  try {
    const { manim_code, explanation, question } = await request.json();

    if (!question) {
      return Response.json({ error: 'No question provided' }, { status: 400 });
    }

    const userMessage = [
      'ORIGINAL MANIM CODE:',
      manim_code ?? '',
      '',
      'ORIGINAL EXPLANATION:',
      explanation ?? 'No additional explanation provided.',
      '',
      'STUDENT QUESTION:',
      question,
    ].join('\n');

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    const clarification_code = textBlock && textBlock.type === 'text' ? textBlock.text : '';

    return Response.json({ manim_code: clarification_code });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}

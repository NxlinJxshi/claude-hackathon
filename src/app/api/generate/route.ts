import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CONFIDENCE_SYSTEM_PROMPT = `You are a Manim code reviewer. You are given a screenshot of a math concept, the Manim Python code generated to animate it, and a text explanation. Your job is to evaluate whether the generated code correctly represents what the screenshot shows. Return ONLY a valid JSON object with no markdown, no backticks, no preamble. The object must have exactly three fields:
- score: an integer from 1 to 5, where 5 means highly confident the animation is correct and 1 means the code is likely wrong or misleading
- reason: a single sentence explaining the score
- flag: a boolean, true if score is 3 or below, false if score is 4 or 5`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mediaType = (file.type || 'image/jpeg') as
      | 'image/jpeg'
      | 'image/png'
      | 'image/gif'
      | 'image/webp';

    const promptPath = path.join(process.cwd(), 'prompt.txt');
    const systemPrompt = fs.readFileSync(promptPath, 'utf-8');

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: 'Generate a Manim animation for the mathematical concept shown in this screenshot.',
            },
          ],
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    const manim_code = textBlock && textBlock.type === 'text' ? textBlock.text : '';
    const explanation = manim_code.match(/^# CONCEPT: (.+)$/m)?.[1] ?? '';
    const concept_name = manim_code.match(/^# CONCEPT_NAME: (.+)$/m)?.[1] ?? null;

    // Confidence check
    const confidenceFallback = { score: null, reason: 'Confidence check unavailable', flag: false };
    let confidence_score: number | null = confidenceFallback.score;
    let confidence_reason: string = confidenceFallback.reason;
    let confidence_flag: boolean = confidenceFallback.flag;

    try {
      const reviewMessage = await client.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 256,
        system: CONFIDENCE_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'ORIGINAL SCREENSHOT:' },
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              {
                type: 'text',
                text: `GENERATED MANIM CODE:\n${manim_code}\n\nEXPLANATION TEXT:\n${explanation}`,
              },
            ],
          },
        ],
      });

      const reviewBlock = reviewMessage.content.find((b) => b.type === 'text');
      const rawJson = reviewBlock && reviewBlock.type === 'text' ? reviewBlock.text : '';
      const cleaned = rawJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(cleaned);

      confidence_score = typeof parsed.score === 'number' ? parsed.score : null;
      confidence_reason = typeof parsed.reason === 'string' ? parsed.reason : confidenceFallback.reason;
      confidence_flag = typeof parsed.flag === 'boolean' ? parsed.flag : confidenceFallback.flag;
    } catch {
      // leave fallback values in place
    }

    // Tavily source search
    let resource_url: string | null = null;
    let resource_title: string | null = null;

    if (concept_name) {
      try {
        const tavilyRes = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: `${concept_name} mathematics explained`,
            search_depth: 'basic',
            max_results: 5,
            include_domains: [
              'khanacademy.org',
              'ocw.mit.edu',
              'tutorial.math.lamar.edu',
            ],
          }),
        });
        const tavilyData = await tavilyRes.json();
        const firstResult = (tavilyData.results as { url?: string; title?: string }[] | undefined)
          ?.find((r) => r.url && r.title);
        if (firstResult) {
          resource_url = firstResult.url ?? null;
          resource_title = firstResult.title ?? null;
        }
      } catch {
        // leave nulls
      }
    }

    return Response.json({
      manim_code,
      explanation,
      confidence_score,
      confidence_reason,
      confidence_flag,
      concept_name,
      resource_url,
      resource_title,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}

import { NextRequest } from 'next/server';
import { execSync } from 'child_process';
import { writeFileSync, copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const { manim_code, scene_name = 'ClarificationScene' } = await request.json();

    if (!manim_code) {
      return Response.json({ error: 'No manim code provided' }, { status: 400 });
    }

    const id = randomUUID().replace(/-/g, '');
    const scriptStem = `clarify_${id}`;
    const tmpScript = `/tmp/${scriptStem}.py`;

    writeFileSync(tmpScript, manim_code, 'utf-8');

    const cwd = process.cwd();

    try {
      execSync(
        `/opt/homebrew/bin/python3.12 -m manim -ql "${tmpScript}" ${scene_name}`,
        { cwd, timeout: 110_000, stdio: 'pipe' }
      );
    } catch (execErr) {
      const stderr = execErr instanceof Error && 'stderr' in execErr
        ? (execErr as NodeJS.ErrnoException & { stderr: Buffer }).stderr?.toString()
        : String(execErr);
      return Response.json({ error: `Manim render failed: ${stderr?.slice(0, 500)}` }, { status: 500 });
    }

    const outputMp4 = join(cwd, 'media', 'videos', scriptStem, '480p15', `${scene_name}.mp4`);

    if (!existsSync(outputMp4)) {
      return Response.json({ error: 'Render completed but output file not found' }, { status: 500 });
    }

    const publicDir = join(cwd, 'public', 'rendered');
    mkdirSync(publicDir, { recursive: true });
    copyFileSync(outputMp4, join(publicDir, `${id}.mp4`));

    return Response.json({ video_url: `/rendered/${id}.mp4` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}

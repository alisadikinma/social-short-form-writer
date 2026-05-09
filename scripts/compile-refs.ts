/**
 * compile-refs.ts — Build per-skill compiled reference files for the
 * social-short-form-writer plugin.
 *
 * Reads raw playbook files from docs/rag/ and produces 2 merged bundles in
 * references/compiled/ for injection via --append-system-prompt-file (zero
 * Read tool calls during skill execution).
 *
 * Mapping:
 *   refs-instagram.md  ← social-base/* + instagram-playbook/*
 *   refs-tiktok.md     ← social-base/* + tiktok-playbook/*
 *   refs-threads.md    ← social-base/* + threads-playbook/*
 *
 * social-base/ holds rules common to both platforms (hook formulas,
 * anti-AI-slop, English authoring, photo-mode storytelling). Per-platform
 * folders hold platform-specific algorithm rules + hashtag caps + timing.
 *
 * Usage:
 *   npx tsx scripts/compile-refs.ts
 *   // or programmatically:
 *   import { compileRefs } from './scripts/compile-refs.js';
 *   await compileRefs({ inputRoot, outputDir });
 */

import { mkdir, readFile, writeFile, stat, readdir } from 'node:fs/promises';
import { basename, join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export interface CompileRefsOptions {
  inputRoot: string; // root containing social-base/, instagram-playbook/, tiktok-playbook/
  outputDir: string;
}

interface BundleSpec {
  outputFile: string;
  purpose: string;
  // Subdirectories under inputRoot whose .md files are concatenated, in order.
  sourceDirs: string[];
}

const BUNDLES: BundleSpec[] = [
  {
    outputFile: 'refs-instagram.md',
    purpose: 'Instagram caption + hashtag + carousel storytelling rules',
    sourceDirs: ['social-base', 'instagram-playbook'],
  },
  {
    outputFile: 'refs-tiktok.md',
    purpose: 'TikTok caption + hashtag + photo-mode + music rules',
    sourceDirs: ['social-base', 'tiktok-playbook'],
  },
  {
    outputFile: 'refs-threads.md',
    purpose: 'Threads caption + preview-cut hook + bilingual ID+EN rules',
    sourceDirs: ['social-base', 'threads-playbook'],
  },
];

function buildHeader(purpose: string): string {
  return [
    `# Social Short-Form Reference — ${purpose}`,
    '',
    'Compiled for `--append-system-prompt-file` injection into skill runs.',
    'Do NOT read these files with the Read tool — they are already in the system prompt.',
    '',
  ].join('\n');
}

function buildSeparator(sourceFile: string): string {
  const name = basename(sourceFile, '.md');
  return ['', '---', '', `## Reference: ${name}`, '', ''].join('\n');
}

async function listMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  return entries
    .filter((entry) => entry.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b));
}

async function ensureDir(path: string): Promise<void> {
  try {
    const s = await stat(path);
    if (!s.isDirectory()) {
      throw new Error(`expected directory, got file: ${path}`);
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`source directory not found: ${path}`);
    }
    throw err;
  }
}

async function buildBundle(
  inputRoot: string,
  outputDir: string,
  spec: BundleSpec,
): Promise<{ file: string; bytes: number; sourceCount: number }> {
  const parts: string[] = [buildHeader(spec.purpose)];
  let sourceCount = 0;

  for (const subdir of spec.sourceDirs) {
    const dirPath = join(inputRoot, subdir);
    await ensureDir(dirPath);
    const files = await listMarkdownFiles(dirPath);

    if (files.length === 0) {
      throw new Error(`source directory has no .md files: ${dirPath}`);
    }

    for (const file of files) {
      const srcPath = join(dirPath, file);
      const content = await readFile(srcPath, 'utf8');
      parts.push(buildSeparator(`${subdir}/${file}`));
      parts.push(content.trimEnd());
      parts.push('');
      sourceCount += 1;
    }
  }

  const body = parts.join('\n');
  const outPath = join(outputDir, spec.outputFile);
  await writeFile(outPath, body, 'utf8');
  const s = await stat(outPath);
  return { file: spec.outputFile, bytes: s.size, sourceCount };
}

export async function compileRefs(
  options: CompileRefsOptions,
): Promise<Array<{ file: string; bytes: number; sourceCount: number }>> {
  const inputRoot = resolve(options.inputRoot);
  const outputDir = resolve(options.outputDir);

  await mkdir(outputDir, { recursive: true });

  const results: Array<{ file: string; bytes: number; sourceCount: number }> = [];
  for (const spec of BUNDLES) {
    results.push(await buildBundle(inputRoot, outputDir, spec));
  }
  return results;
}

async function runCli(): Promise<void> {
  const __filename = fileURLToPath(import.meta.url);
  const scriptDir = dirname(__filename);
  const rootDir = resolve(scriptDir, '..');
  const inputRoot = join(rootDir, 'docs', 'rag');
  const outputDir = join(rootDir, 'references', 'compiled');

  const results = await compileRefs({ inputRoot, outputDir });

  process.stdout.write('Compiled reference files:\n');
  for (const { file, bytes, sourceCount } of results) {
    process.stdout.write(`  ${file}: ${bytes} bytes (${sourceCount} sources)\n`);
  }
  process.stdout.write('Done.\n');
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  runCli().catch((err: unknown) => {
    const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
    process.stderr.write(`compile-refs failed: ${message}\n`);
    process.exit(1);
  });
}

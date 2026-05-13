import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const PPT_SKILL_ROOT = new URL('../../../../../resources/skills/managed/ppt-skill/', import.meta.url);
const TEMPLATE_PATHS = [
  'assets/template.html',
  'assets/template-swiss.html',
];

describe('ppt-skill bundle contract', () => {
  it('ships the local runtime assets required by generated decks', async () => {
    await expect(readText('assets/motion.min.js')).resolves.toContain('motion');
    await expect(readText('assets/lucide.min.js')).resolves.toContain('lucide');
  });

  it('keeps generated deck templates free of network runtime dependencies', async () => {
    for (const templatePath of TEMPLATE_PATHS) {
      const html = await readText(templatePath);

      expect(html).not.toMatch(/<script\b[^>]*src=["']https?:\/\//i);
      expect(html).not.toMatch(/import\(["']https?:\/\//);
    }
  });

  it('documents copying a local assets directory into the generated deck output', async () => {
    const skillDoc = await readText('SKILL.md');

    expect(skillDoc).toContain('项目/XXX/ppt/assets');
    expect(skillDoc).toMatch(/cp .*motion\.min\.js/);
    expect(skillDoc).toMatch(/cp .*lucide\.min\.js/);
  });

  it('points theme customization instructions at the generated index.html instead of the source templates', async () => {
    const magazineThemes = await readText('references/themes.md');
    const swissThemes = await readText('references/themes-swiss.md');

    expect(magazineThemes).toContain('项目/XXX/ppt/index.html');
    expect(swissThemes).toContain('项目/XXX/ppt/index.html');
    expect(magazineThemes).not.toContain('打开 `assets/template.html`');
    expect(swissThemes).not.toContain('打开 `assets/template-swiss.html`');
  });
});

function readText(relativePath: string) {
  return readFile(new URL(relativePath, PPT_SKILL_ROOT), 'utf8');
}

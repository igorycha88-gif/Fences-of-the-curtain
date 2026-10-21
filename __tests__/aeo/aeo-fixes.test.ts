import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { SEO_CONFIG } from '../../src/lib/seo/constants';
import { generateArticleJsonLd } from '../../src/lib/seo/jsonld';

/**
 * ЧТЗ_AEO_Фиксы_AI_SEO (TASK-TST-001):
 * llms.txt/ceny.md, AI-боты в robots, dateModified в Article JSON-LD.
 */

describe('TASK-FRT-001: public/llms.txt', () => {
  const llmsPath = path.resolve(__dirname, '../../public/llms.txt');

  it('файл существует', () => {
    expect(fs.existsSync(llmsPath)).toBe(true);
  });

  it('содержит название компании и ключевые ссылки с абсолютными URL', () => {
    const content = fs.readFileSync(llmsPath, 'utf-8');
    expect(content).toContain(SEO_CONFIG.SITE_NAME);
    expect(content).toContain(`${SEO_CONFIG.BASE_URL}/calculator/fence`);
    expect(content).toContain(`${SEO_CONFIG.BASE_URL}/zabory-navesy`);
    expect(content).toContain(`${SEO_CONFIG.BASE_URL}/contacts`);
    // описание бизнеса для ИИ-контекста
    expect(content).toContain('+7 (499) 390-15-95');
  });
});

describe('TASK-FRT-002: public/ceny.md', () => {
  const cenyPath = path.resolve(__dirname, '../../public/ceny.md');

  it('файл существует', () => {
    expect(fs.existsSync(cenyPath)).toBe(true);
  });

  it('содержит подтверждённые цены и доставку', () => {
    const content = fs.readFileSync(cenyPath, 'utf-8');
    expect(content).toContain('2 600');
    expect(content).toContain('32 000');
    expect(content).toContain('40 000');
    expect(content).toContain('Доставка');
    expect(content).toContain('октябрь 2026');
    expect(content.toLowerCase()).toContain('zabor-i-naves.ru');
  });
});

describe('TASK-BCK-002: AI-боты в robots', () => {
  it('поисковые ИИ-боты явно разрешены, /admin и /api закрыты', async () => {
    const robotsModule = await import('../../src/app/robots');
    const result = await robotsModule.default();

    const aiAgents = ['OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot', 'GPTBot'];
    const rules = result.rules as Array<{ userAgent: string | string[]; allow?: string[]; disallow?: string[] }>;

    for (const agent of aiAgents) {
      const rule = rules.find(
        (r) => r.userAgent === agent || (Array.isArray(r.userAgent) && r.userAgent.includes(agent))
      );
      expect(rule).toBeDefined();
      expect(rule?.allow).toContain('/');
      expect(rule?.disallow).toContain('/admin');
      expect(rule?.disallow).toContain('/api');
    }
  });
});

describe('TASK-BCK-001: dateModified в Article JSON-LD', () => {
  it('передаётся, когда задан', () => {
    const jsonLd = generateArticleJsonLd(
      'Тест',
      'Описание',
      '/blog/test',
      undefined,
      '2026-01-01T00:00:00+03:00',
      '2026-10-20'
    ) as { dateModified?: string };
    expect(jsonLd.dateModified).toBe('2026-10-20');
  });

  it('отсутствует, когда не задан', () => {
    const jsonLd = generateArticleJsonLd('Тест', 'Описание', '/blog/test') as {
      dateModified?: string;
    };
    expect(jsonLd.dateModified).toBeUndefined();
  });
});

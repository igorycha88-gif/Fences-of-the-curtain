import { describe, it, expect } from '@jest/globals';
import { SEO_CONFIG, PAGE_METADATA } from '@/lib/seo/constants';

describe('SEO constants (главная страница)', () => {
  it('title главной содержит актуальную минимальную цену от 2600₽/м', () => {
    expect(SEO_CONFIG.DEFAULT_TITLE).toContain('от 2600₽/м');
    expect(PAGE_METADATA.home.title).toContain('от 2600₽/м');
  });

  it('title главной не содержит устаревшую цену 2800', () => {
    expect(SEO_CONFIG.DEFAULT_TITLE).not.toContain('2800');
    expect(PAGE_METADATA.home.title).not.toContain('2800');
  });

  it('description главной содержит гарантию 1 год', () => {
    expect(SEO_CONFIG.DEFAULT_DESCRIPTION).toContain('Гарантия 1 год');
    expect(PAGE_METADATA.home.description).toContain('Гарантия 1 год');
  });

  it('description главной не содержит устаревшую гарантию 3 года', () => {
    expect(SEO_CONFIG.DEFAULT_DESCRIPTION).not.toContain('Гарантия 3 года');
    expect(PAGE_METADATA.home.description).not.toContain('Гарантия 3 года');
  });

  it('title главной содержит гео «в Москве и МО» (ЧТЗ v3 TASK-10)', () => {
    expect(SEO_CONFIG.DEFAULT_TITLE).toContain('в Москве и МО');
    expect(PAGE_METADATA.home.title).toContain('в Москве и МО');
  });

  it('title главной содержит тезис «Монтаж за 1 день» (ЧТЗ v3 TASK-08)', () => {
    expect(SEO_CONFIG.DEFAULT_TITLE).toContain('Монтаж за 1 день');
    expect(PAGE_METADATA.home.title).toContain('Монтаж за 1 день');
  });
});

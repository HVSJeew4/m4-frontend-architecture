import axe from 'axe-core';

/**
 * axe-core violations for a rendered container, as short readable strings (empty = none).
 * Colour contrast is skipped: jsdom does no layout or CSS, so axe cannot compute colours there.
 * Contrast is checked in a real browser instead (Storybook a11y addon, Lighthouse).
 */
export async function axeViolations(container: Element): Promise<string[]> {
  const { violations } = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  return violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length} element(s))`);
}

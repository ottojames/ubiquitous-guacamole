import type { Page } from '@playwright/test';

type SuggestResponse = {
  status: number;
  body: unknown;
  delay?: number;
};

export async function mockAddressSuggest(page: Page, responses: SuggestResponse | SuggestResponse[]) {
  const queue = Array.isArray(responses) ? [...responses] : [responses];
  await page.route('**/suggest?*', async (route) => {
    const response = queue.length > 1 ? queue.shift()! : queue[0]!;
    if (response.delay) {
      await new Promise((resolve) => setTimeout(resolve, response.delay));
    }
    await route.fulfill({
      status: response.status,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(response.body),
    });
  });
}

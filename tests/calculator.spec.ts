import { test, expect, type Page } from '@playwright/test';

// Helpers

async function getDisplay(page: Page): Promise<string> {
  return page.locator('#result').innerText();
}

async function getExpression(page: Page): Promise<string> {
  return page.locator('#expression').innerText();
}

async function clickButton(page: Page, label: string): Promise<void> {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await page.locator('.buttons button').filter({ hasText: new RegExp(`^${escaped}$`) }).click();
}

async function pressKey(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
}

// Tests

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('initial state', () => {
  test('shows 0 on load', async ({ page }) => {
    expect(await getDisplay(page)).toBe('0');
    expect(await getExpression(page)).toBe('');
  });

  test('renders all buttons', async ({ page }) => {
    const buttons = page.locator('.buttons button');
    await expect(buttons).toHaveCount(19);
  });
});

test.describe('digit input', () => {
  test('clicking a digit updates display', async ({ page }) => {
    await clickButton(page, '5');
    expect(await getDisplay(page)).toBe('5');
  });

  test('clicking multiple digits builds a number', async ({ page }) => {
    await clickButton(page, '1');
    await clickButton(page, '2');
    await clickButton(page, '3');
    expect(await getDisplay(page)).toBe('123');
  });

  test('leading zero is replaced when digit follows', async ({ page }) => {
    await clickButton(page, '0');
    await clickButton(page, '5');
    expect(await getDisplay(page)).toBe('5');
  });
});

test.describe('basic arithmetic', () => {
  test('addition', async ({ page }) => {
    await clickButton(page, '3');
    await clickButton(page, '+');
    await clickButton(page, '4');
    await clickButton(page, '=');
    expect(await getDisplay(page)).toBe('7');
  });

  test('subtraction', async ({ page }) => {
    await clickButton(page, '9');
    await clickButton(page, '−');
    await clickButton(page, '3');
    await clickButton(page, '=');
    expect(await getDisplay(page)).toBe('6');
  });

  test('multiplication', async ({ page }) => {
    await clickButton(page, '6');
    await clickButton(page, '×');
    await clickButton(page, '7');
    await clickButton(page, '=');
    expect(await getDisplay(page)).toBe('42');
  });

  test('division', async ({ page }) => {
    await clickButton(page, '8');
    await clickButton(page, '/');
    await clickButton(page, '2');
    await clickButton(page, '=');
    expect(await getDisplay(page)).toBe('4');
  });

  test('chained operations', async ({ page }) => {
    await clickButton(page, '2');
    await clickButton(page, '+');
    await clickButton(page, '3');
    await clickButton(page, '×');
    await clickButton(page, '4');
    await clickButton(page, '=');
    // Standard JS operator precedence: 3*4=12 first, then 2+12=14
    expect(await getDisplay(page)).toBe('14');
  });
});

test.describe('decimal point', () => {
  test('adds decimal to a number', async ({ page }) => {
    await clickButton(page, '3');
    await clickButton(page, '.');
    await clickButton(page, '1');
    await clickButton(page, '4');
    expect(await getDisplay(page)).toBe('3.14');
  });

  test('prevents double decimal', async ({ page }) => {
    await clickButton(page, '1');
    await clickButton(page, '.');
    await clickButton(page, '.');
    await clickButton(page, '5');
    expect(await getDisplay(page)).toBe('1.5');
  });

  test('floating point precision (0.1 + 0.2)', async ({ page }) => {
    await clickButton(page, '0');
    await clickButton(page, '.');
    await clickButton(page, '1');
    await clickButton(page, '+');
    await clickButton(page, '0');
    await clickButton(page, '.');
    await clickButton(page, '2');
    await clickButton(page, '=');
    expect(await getDisplay(page)).toBe('0.3');
  });
});

test.describe('clear and backspace', () => {
  test('C resets to initial state', async ({ page }) => {
    await clickButton(page, '5');
    await clickButton(page, '+');
    await clickButton(page, '3');
    await clickButton(page, 'C');
    expect(await getDisplay(page)).toBe('0');
    expect(await getExpression(page)).toBe('');
  });

  test('backspace removes last digit', async ({ page }) => {
    await clickButton(page, '1');
    await clickButton(page, '2');
    await clickButton(page, '3');
    await clickButton(page, '⌫');
    expect(await getDisplay(page)).toBe('12');
  });

  test('backspace on single digit shows 0', async ({ page }) => {
    await clickButton(page, '7');
    await clickButton(page, '⌫');
    expect(await getDisplay(page)).toBe('0');
  });
});

test.describe('percentage', () => {
  test('divides current value by 100', async ({ page }) => {
    await clickButton(page, '5');
    await clickButton(page, '0');
    await clickButton(page, '%');
    expect(await getDisplay(page)).toBe('0.5');
  });
});

test.describe('error handling', () => {
  test('division by zero shows error message', async ({ page }) => {
    await clickButton(page, '5');
    await clickButton(page, '/');
    await clickButton(page, '0');
    await clickButton(page, '=');
    expect(await getDisplay(page)).toBe('Division by zero');
    await expect(page.locator('#result')).toHaveClass(/error/);
  });

  test('C after error resets to 0', async ({ page }) => {
    await clickButton(page, '1');
    await clickButton(page, '/');
    await clickButton(page, '0');
    await clickButton(page, '=');
    await clickButton(page, 'C');
    expect(await getDisplay(page)).toBe('0');
    await expect(page.locator('#result')).not.toHaveClass(/error/);
  });
});

test.describe('operator replacement', () => {
  test('pressing a different operator replaces the previous one', async ({ page }) => {
    await clickButton(page, '5');
    await clickButton(page, '+');
    await clickButton(page, '×');
    await clickButton(page, '3');
    await clickButton(page, '=');
    expect(await getDisplay(page)).toBe('15');
  });
});

test.describe('keyboard input', () => {
  test('digits via keyboard', async ({ page }) => {
    await pressKey(page, '4');
    await pressKey(page, '2');
    expect(await getDisplay(page)).toBe('42');
  });

  test('Enter triggers equals', async ({ page }) => {
    await pressKey(page, '6');
    await pressKey(page, '+');
    await pressKey(page, '3');
    await pressKey(page, 'Enter');
    expect(await getDisplay(page)).toBe('9');
  });

  test('Escape clears', async ({ page }) => {
    await pressKey(page, '9');
    await pressKey(page, 'Escape');
    expect(await getDisplay(page)).toBe('0');
  });

  test('Backspace removes last digit via keyboard', async ({ page }) => {
    await pressKey(page, '5');
    await pressKey(page, '6');
    await pressKey(page, 'Backspace');
    expect(await getDisplay(page)).toBe('5');
  });

  test('full expression via keyboard', async ({ page }) => {
    await pressKey(page, '1');
    await pressKey(page, '0');
    await pressKey(page, '/');
    await pressKey(page, '2');
    await pressKey(page, 'Enter');
    expect(await getDisplay(page)).toBe('5');
  });
});

test.describe('result reuse', () => {
  test('can continue calculation after equals', async ({ page }) => {
    await clickButton(page, '4');
    await clickButton(page, '+');
    await clickButton(page, '4');
    await clickButton(page, '=');
    await clickButton(page, '+');
    await clickButton(page, '2');
    await clickButton(page, '=');
    expect(await getDisplay(page)).toBe('10');
  });

  test('typing a digit after result starts fresh', async ({ page }) => {
    await clickButton(page, '9');
    await clickButton(page, '=');
    await clickButton(page, '3');
    expect(await getDisplay(page)).toBe('3');
    expect(await getExpression(page)).toBe('');
  });
});

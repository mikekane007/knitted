import { test, expect } from '@playwright/test';

test.describe('Knitted Booking Flow', () => {
  test('should login and book a ticket successfully', async ({ page }) => {
    // 1. Navigate to the login page
    await page.goto('http://localhost:4200/login');

    // 2. Perform Login
    await page.fill('input[name="email"]', 'testuser@knitted.com');
    await page.fill('input[name="password"]', 'Password123');
    await page.click('button[type="submit"]');

    // 3. Confirm redirect to the events list
    await expect(page).toHaveURL(/.*events/);

    // 4. Click on the first event card detail link
    const firstEventBtn = page.locator('.event-card .btn-primary').first();
    await expect(firstEventBtn).toBeVisible();
    await firstEventBtn.click();

    // 5. Check we are on the event details page
    await expect(page).toHaveURL(/.*events\/\d+/);

    // 6. Click the book ticket button
    const bookButton = page.locator('button:has-text("Book Ticket Now")');
    await expect(bookButton).toBeVisible();
    await bookButton.click();

    // 7. Verify the success message is shown
    const successBanner = page.locator('.success-banner');
    await expect(successBanner).toBeVisible();
    await expect(successBanner).toContainText('Ticket successfully booked!');
  });
});

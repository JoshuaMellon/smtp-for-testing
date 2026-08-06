import { createMailTest } from "smtp-for-testing/playwright";

const { test, expect } = createMailTest({
    port: 2525,
    defaultTimeout: 3000,
    seedRecipients: ["user@example.com"],
    recipientDomain: "example.com",
    seedUsers: ["user"],
});

test("captures a verification email", async ({ page, mailServer }) => {
    await page.goto("http://localhost:3000/signup");
    await page.getByLabel("Email").fill("user@example.com");
    await page.getByRole("button", { name: "Sign up" }).click();

    const mail = await mailServer.waitForVerificationEmail("user@example.com", 3000);

    expect(mail.subject).toContain("Verify");
    expect(mail.text).toContain("verify");
});

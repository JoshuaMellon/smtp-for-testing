import type { Express } from "express";
import request from "supertest";
import { expect, test, beforeEach, afterEach, vi } from "vitest";

import { createApiApp } from "../../../src/api/index.js";
import type { MailServer } from "../../../src/index.js";

import { sendTestMail } from "../../helpers/mail.helper.js";

let app: Express;
let mailServer: MailServer;
const smtpPort = 2526;

vi.setConfig({ testTimeout: 10000 });

beforeEach(async () => {
    const context = await createApiApp({ port: smtpPort, defaultTimeout: 300 });
    app = context.app;
    mailServer = context.mailServer;

    await mailServer.start();
});

afterEach(async () => {
    mailServer.clear();
    await mailServer.stop();
});

test("GET /mail/mailbox/:address returns array", async () => {
    const res = await request(app).get("/mail/mailbox/test@example.com");

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
});

test("GET /mail/mailbox/:address/wait returns 200 and mail when matching mail found", async () => {
    const recipient = "receiveMail@example.com";

    await sendTestMail(recipient, undefined, smtpPort);

    const res = await request(app).get(`/mail/mailbox/${recipient}/wait`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
        from: "tester@example.com",
        to: recipient,
        text: expect.stringContaining("hello"),
    });
});

test("GET /mail/mailbox/:address/wait returns 400 when no matching mail found", async () => {
    const res = await request(app).get("/mail/mailbox/test@example.com/wait");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Timed out waiting for email");
});

test("GET /mail/mailbox/:address/wait-verification returns 200 and mail when matching mail found", async () => {
    const recipient = "test@example.com";

    await sendTestMail(recipient, undefined, smtpPort);

    const res = await request(app).get(
        `/mail/mailbox/${recipient}/wait-verification`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
        from: "tester@example.com",
        to: recipient,
        text: expect.stringContaining("hello"),
    });
});

test("GET /mail/mailbox/:address/wait-verification returns 400 when no matching mail found", async () => {
    const res = await request(app).get(
        "/mail/mailbox/test@example.com/wait-verification",
    );

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Timed out waiting for email");
});

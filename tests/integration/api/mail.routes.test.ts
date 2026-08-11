import express, { type Express } from "express";
import request from "supertest";
import { expect, test, beforeEach, afterEach, vi } from "vitest";

import { createApiApp } from "../../../src/api/index.js";
import type { MailServer } from "../../../src/index.js";

import { sendTestMail } from "../../helpers/mail.helper.js";
import { createMailRoutes } from "../../../src/api/routes/mail.routes.js";

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

test("GET /mailbox/:address returns array", async () => {
    const res = await request(app).get("/mailbox/test@example.com");

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
});

test("GET /mailbox/:address/wait returns 200 and mail when matching mail found", async () => {
    const recipient = "receiveMail@example.com";

    await sendTestMail(recipient, undefined, smtpPort);

    const res = await request(app).get(`/mailbox/${recipient}/wait`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
        from: "tester@example.com",
        to: recipient,
        text: expect.stringContaining("hello"),
    });
});

test("GET /mailbox/:address/wait returns 400 when no matching mail found", async () => {
    const res = await request(app).get("/mailbox/test@example.com/wait");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Timed out waiting for email");
});

test("GET /mailbox/:address/wait-verification returns 200 and mail when matching mail found", async () => {
    const recipient = "test@example.com";

    await sendTestMail(recipient, undefined, smtpPort);

    const res = await request(app).get(
        `/mailbox/${recipient}/wait-verification`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
        from: "tester@example.com",
        to: recipient,
        text: expect.stringContaining("hello"),
    });
});

test("GET /mailbox/:address/wait-verification returns 400 when no matching mail found", async () => {
    const res = await request(app).get(
        "/mailbox/test@example.com/wait-verification",
    );

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Timed out waiting for email");
});

test("GET /mailbox/:address returns 500 when getMailbox throws", async () => {
    const app = express();
    const mockServer = {
        getMailbox: () => {
            throw new Error("boom");
        },
        waitForMail: async () => "",
        waitForVerificationEmail: async () => "",
    } as unknown as MailServer;

    app.use("/mailbox", createMailRoutes(mockServer));

    const res = await request(app).get("/mailbox/test@example.com");

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error", "boom");
});

test("GET /mailbox/:address/wait returns 500 unknown error for non-Error rejection", async () => {
    const app = express();
    const mockServer = {
        getMailbox: () => [],
        waitForMail: async () => {
            throw "string-error";
        },
        waitForVerificationEmail: async () => "",
    } as unknown as MailServer;

    app.use("/mailbox", createMailRoutes(mockServer));

    const res = await request(app).get("/mailbox/test@example.com/wait");

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error", "Unknown server error");
});

test("GET /mailbox/:address/wait-verification returns 400 for wrong email type", async () => {
    const app = express();
    const mockServer = {
        getMailbox: () => [],
        waitForMail: async () => "",
        waitForVerificationEmail: async () => {
            throw new Error("Wrong email received");
        },
    } as unknown as MailServer;

    app.use("/mailbox", createMailRoutes(mockServer));

    const res = await request(app).get(
        "/mailbox/test@example.com/wait-verification",
    );

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Wrong email received");
});

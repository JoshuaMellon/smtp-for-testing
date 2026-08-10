import express from "express";
import request from "supertest";
import { expect, test } from "vitest";

import { createMailRoutes } from "../../../src/api/routes/mail.routes.js";
import type { MailServer } from "../../../src/mail-server/mail-server.js";

test("GET /mail/mailbox/:address returns 500 when getMailbox throws", async () => {
    const app = express();
    const mockServer = {
        getMailbox: () => {
            throw new Error("boom");
        },
        waitForMail: async () => "",
        waitForVerificationEmail: async () => "",
    } as unknown as MailServer;

    app.use("/mail", createMailRoutes(mockServer));

    const res = await request(app).get("/mail/mailbox/test@example.com");

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error", "boom");
});

test("GET /mail/mailbox/:address/wait returns 500 unknown error for non-Error rejection", async () => {
    const app = express();
    const mockServer = {
        getMailbox: () => [],
        waitForMail: async () => {
            throw "string-error";
        },
        waitForVerificationEmail: async () => "",
    } as unknown as MailServer;

    app.use("/mail", createMailRoutes(mockServer));

    const res = await request(app).get("/mail/mailbox/test@example.com/wait");

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error", "Unknown server error");
});

test("GET /mail/mailbox/:address/wait-verification returns 400 for wrong email type", async () => {
    const app = express();
    const mockServer = {
        getMailbox: () => [],
        waitForMail: async () => "",
        waitForVerificationEmail: async () => {
            throw new Error("Wrong email received");
        },
    } as unknown as MailServer;

    app.use("/mail", createMailRoutes(mockServer));

    const res = await request(app).get(
        "/mail/mailbox/test@example.com/wait-verification",
    );

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Wrong email received");
});

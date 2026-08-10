import type { Express } from "express";
import request from "supertest";
import { expect, test, beforeEach, afterEach } from "vitest";

import { createApiApp } from "../../../src/api/index.js";
import type { MailServer } from "../../../src/index.js";

let app: Express;
let mailServer: MailServer;

beforeEach(async () => {
    const context = await createApiApp(2525);
    app = context.app;
    mailServer = context.mailServer;

    await mailServer.start();
});

afterEach(async () => {
    mailServer.clear();
    await mailServer.stop();
});

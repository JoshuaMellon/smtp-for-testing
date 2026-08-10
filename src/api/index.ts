import express, { type Express } from "express";

import type { MailServerConfig } from "../types/mail-server.js";

import { MailServer } from "../index.js";

import { createMailRoutes } from "./mail.routes.js";
import { createTestRoutes } from "./test.routes.js";

const app: Express = express();

export async function startServer(config: MailServerConfig | number = 3000): Promise<void> {
    // Resolve the configuration, allowing for either a port number or a full configuration object
    const resolvedConfig: MailServerConfig = typeof config === "number" ? { port: config } : config;
    const smtpPort = resolvedConfig.port ?? 3000;

    const mailServer = new MailServer(resolvedConfig);

    app.use(express.json());

    app.use("/mail", createMailRoutes(mailServer));
    app.use("/test", createTestRoutes(smtpPort));
    ``;
    console.log(`Starting mail server on port ${smtpPort}...`);

    try {
        await mailServer.start();
        console.log(`Mail server started on port ${smtpPort}`);
    } catch (error) {
        console.error("Failed to start mail server:", error);
    }
}

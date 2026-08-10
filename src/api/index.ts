import express, { type Express } from "express";
import { apiReference } from "@scalar/express-api-reference";

import type { MailServerConfig } from "../types/mail-server.js";

import { MailServer } from "../index.js";
import { openApiDocument } from "./lib/openapi.js";

import { createMailRoutes } from "./routes/mail.routes.js";
import { createTestRoutes } from "./routes/test.routes.js";

const app: Express = express();

/**
 * Starts the mail server with the given configuration
 * @param {MailServerConfig | number} [config=3000] - Either a port number or a full MailServerConfig object
 * @returns {Promise<void>}
 */
export async function startServer(config: MailServerConfig | number = 2525): Promise<void> {
    // Resolve the configuration, allowing for either a port number or a full configuration object
    const resolvedConfig: MailServerConfig = typeof config === "number" ? { port: config } : config;

    const apiPort = Number(process.env.API_PORT ?? 3000);
    const smtpPort = resolvedConfig.port ?? 2525;

    const mailServer = new MailServer(resolvedConfig);

    app.use(express.json());

    app.use("/mail", createMailRoutes(mailServer));
    app.use("/test", createTestRoutes(smtpPort));

    const apiDocJsonContent = openApiDocument;

    app.use(
        "/docs", // documentation route
        apiReference({
            content: apiDocJsonContent,
            title: "Users API",
            pageTitle: "Users API",
        }),
    );

    console.log(`Starting mail server on port ${smtpPort}...`);

    app.listen(apiPort, () => {
        console.log(`Mail server API is running at http://localhost:${apiPort}`);
    });

    try {
        await mailServer.start();
    } catch (error) {
        console.error("Failed to start mail server:", error);
    }
}

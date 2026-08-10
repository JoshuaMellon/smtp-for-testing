import express, { type Express } from "express";
import { apiReference } from "@scalar/express-api-reference";

import type { MailServerConfig } from "../types/mail-server.js";

import { MailServer } from "../index.js";
import { openApiDocument } from "./lib/openapi.js";

import { createMailRoutes } from "./routes/mail.routes.js";
import { createTestRoutes } from "./routes/test.routes.js";

/**
 * Context object containing the Express app instance and mail server
 * @typedef {Object} ApiContext
 * @property {Express} app - The Express application instance
 * @property {MailServer} mailServer - The mail server instance
 */
export type ApiContext = {
    app: Express;
    mailServer: MailServer;
};

/**
 * Creates and configures the API application with mail and test routes
 * @param {MailServerConfig | number} [config=2525] - Either a port number or a full MailServerConfig object
 * @returns {Promise<ApiContext>} Promise resolving to an object containing the Express app and mail server instances
 */
export async function createApiApp(
    config: MailServerConfig | number = 2525,
): Promise<ApiContext> {
    // Resolve the configuration, allowing for either a port number or a full configuration object
    const resolvedConfig: MailServerConfig =
        typeof config === "number" ? { port: config } : config;

    const mailServer = new MailServer(resolvedConfig);
    const app: Express = express();

    app.use(express.json());

    app.use("/mail", createMailRoutes(mailServer));
    app.use("/test", createTestRoutes());

    app.use(
        "/docs",
        apiReference({
            content: openApiDocument,
            title: "Users API",
            pageTitle: "Users API",
        }),
    );

    return { app, mailServer };
}

/**
 * Starts the mail server with the given configuration
 * @param {MailServerConfig | number} [config=3000] - Either a port number or a full MailServerConfig object
 * @returns {Promise<void>}
 */
export async function startServer(
    config: MailServerConfig | number = 2525,
): Promise<void> {
    const apiPort = Number(process.env.API_PORT ?? 3000);
    const { app, mailServer } = await createApiApp(config);

    app.listen(apiPort, () => {
        console.log(
            `Mail server API is running at http://localhost:${apiPort}`,
        );
    });

    try {
        await mailServer.start();
    } catch (error) {
        console.error("Failed to start mail server:", error);
    }
}

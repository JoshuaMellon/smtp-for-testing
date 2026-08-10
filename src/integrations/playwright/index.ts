import { test as base, expect } from "playwright/test";
import { type Express } from "express";
import type { Server } from "node:http";

import { MailServer } from "../../mail-server/mail-server.js";
import type { MailServerConfig } from "../../types/mail-server.js";
import { createApiAppWithMailServer } from "../../api/index.js";

export type MailFixtures = {
    /** Shared SMTP mail server instance for each test. */
    mailServer: MailServer;
    /** Express API app backed by the shared mail server. */
    mailApi: Express;
    /** Localhost URL for the temporary Express API server. */
    mailApiUrl: string;
};

/**
 * Creates a Playwright test wrapper with per-test mail server and API fixtures.
 *
 * Accepts either a port number or a full MailServer configuration.
 *
 * @param configOrPort - SMTP port or configuration used to create the mail server.
 * @returns Playwright test helpers with the mail fixtures attached.
 */
export function createMailTest(configOrPort: MailServerConfig | number = 2525) {
    const test = base.extend<MailFixtures>({
        mailServer: async (_args, use) => {
            const mailServer = new MailServer(configOrPort);
            await mailServer.start();

            try {
                await use(mailServer);
            } finally {
                mailServer.clear();
                await mailServer.stop();
            }
        },
        mailApi: async ({ mailServer }, use) => {
            const app = createApiAppWithMailServer(mailServer);

            await use(app);
        },
        mailApiUrl: async ({ mailApi }, use) => {
            const server = await new Promise<Server>((resolve) => {
                const httpServer = mailApi.listen(0, "127.0.0.1", () => {
                    resolve(httpServer);
                });
            });

            const address = server.address();
            if (!address || typeof address === "string") {
                throw new Error(
                    "Failed to determine the mail API listen address",
                );
            }

            const baseUrl = `http://127.0.0.1:${address.port}`;

            try {
                await use(baseUrl);
            } finally {
                await new Promise<void>((resolve, reject) => {
                    server.close((error) => {
                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve();
                    });
                });
            }
        },
    });

    return { test, expect };
}

import { test as base, expect } from "playwright/test";
import { type Express } from "express";

import { MailServer } from "../../mail-server/mail-server.js";
import type { MailServerConfig } from "../../types/mail-server.js";
import { createApiApp } from "../../api/index.js";

export type MailFixtures = {
    mailServer: MailServer;
    mailApi: Express;
};

/**
 * Creates a Playwright test wrapper with a per-test MailServer fixture.
 *
 * Accepts either a port number or full MailServer configuration.
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
        mailApi: async (_args, use) => {
            const { app, mailServer } = await createApiApp(configOrPort);
            await mailServer.start();

            try {
                await use(app);
            } finally {
                mailServer.clear();
                await mailServer.stop();
            }
        },
    });

    return { test, expect };
}

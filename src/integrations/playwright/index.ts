import { test as base, expect } from "playwright/test";
import { MailServer } from "../../mail-server/mail-server.js";
import type { MailServerConfig } from "../../types/mail-server.js";

export type MailFixtures = {
    mailServer: MailServer;
};

/**
 * Creates a Playwright test wrapper with a per-test MailServer fixture.
 *
 * Accepts either a port number or full MailServer configuration.
 */
export function createMailTest(configOrPort: MailServerConfig | number = 2525) {
    const test = base.extend<MailFixtures>({
        mailServer: async ({}, use) => {
            const mailServer = new MailServer(configOrPort);
            await mailServer.start();

            try {
                await use(mailServer);
            } finally {
                mailServer.clear();
                await mailServer.stop();
            }
        },
    });

    return { test, expect };
}

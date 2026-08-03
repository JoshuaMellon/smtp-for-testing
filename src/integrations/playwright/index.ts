import { test as base, expect } from "playwright/test";
import { MailServer } from "../../mail-server/mail-server.js";

export type MailFixtures = {
    mailServer: MailServer;
};

export function createMailTest(port = 2525) {
    const test = base.extend<MailFixtures>({
        mailServer: async ({}, use) => {
            const mailServer = new MailServer(port);
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

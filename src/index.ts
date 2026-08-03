import { MailServer } from "./mail-server/mail-server.js";

export { MailServer };

export function createMailServer(port = 2525): MailServer {
    return new MailServer(port);
}

export { createMailTest } from "./integrations/playwright/index.js";
export type { MailFixtures } from "./integrations/playwright/index.js";

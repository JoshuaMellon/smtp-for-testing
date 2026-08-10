import { startServer } from "./api/index.js";
import { MailServer } from "./mail-server/mail-server.js";
import type { MailServerConfig } from "./types/mail-server.js";

export { MailServer };

export async function createMailServer(
    configOrPort: MailServerConfig | number = 2525,
): Promise<MailServer> {
    const mailServer = new MailServer(configOrPort);

    await mailServer.start();

    return mailServer;
}

export async function createMailServerApi(
    configOrPort: MailServerConfig | number = 2525,
): Promise<void> {
    await startServer(configOrPort);
}

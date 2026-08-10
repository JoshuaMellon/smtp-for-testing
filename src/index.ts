import { MailServer } from "./mail-server/mail-server.js";
import type { MailServerConfig } from "./types/mail-server.js";

export { MailServer };

export function createMailServer(configOrPort: MailServerConfig | number = 2525): MailServer {
    return new MailServer(configOrPort);
}

export function createMailServerApi(port = 2525) {
    // replace later with express api
}

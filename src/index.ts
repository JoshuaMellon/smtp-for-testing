import { MailServer } from "./mail-server/mail-server.js";

export { MailServer };

export function createMailServer(port = 2525): MailServer {
    return new MailServer(port);
}

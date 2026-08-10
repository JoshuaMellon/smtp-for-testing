import type { Mail } from "../types/mail.js";

type GetMailbox = (address: string) => Mail[];

export class MailAwaiter {
    constructor(private readonly getMailbox: GetMailbox) {}

    async waitForMail(address: string, timeout = 10000): Promise<Mail> {
        const start = Date.now();

        while (Date.now() - start < timeout) {
            const mailbox = this.getMailbox(address);

            if (mailbox[0]) {
                return mailbox[0];
            }

            await new Promise((r) => setTimeout(r, 250));
        }

        throw new Error("Timed out waiting for email");
    }

    async waitForVerificationEmail(
        address: string,
        timeout = 10000,
    ): Promise<Mail> {
        const mail = await this.waitForMail(address, timeout);

        if (!mail.subject?.includes("Verify")) {
            throw new Error("Wrong email received");
        }

        return mail;
    }
}

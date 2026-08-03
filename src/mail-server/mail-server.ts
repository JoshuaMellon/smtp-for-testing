import { SMTPServer } from "smtp-server";
import { simpleParser, type ParsedMail } from "mailparser";

const mailboxes = new Map<string, ParsedMail[]>();

export class MailServer {
    server: SMTPServer;

    constructor(private port = 2525) {
        this.server = new SMTPServer({
            authOptional: true,
            disabledCommands: ["STARTTLS"],

            // Upon receiving an email gather all email address, push all mail to inbox, and set the object with an address and list of mail
            onData(stream, session, callback) {
                simpleParser(stream)
                    .then((mail) => {
                        const recipients = session.envelope.rcptTo.map((r) => r.address);

                        for (const address of recipients) {
                            const existing = mailboxes.get(address) ?? [];
                            existing.push(mail);
                            mailboxes.set(address, existing);
                        }

                        callback();
                    })
                    .catch(callback);
            },
        });
    }

    async start(): Promise<void> {
        return new Promise<void>((resolve) => {
            console.log(`Server started on port: ${this.port}`);
            this.server.listen(this.port, resolve);
        });
    }
    async stop(): Promise<void> {
        return new Promise<void>((resolve) => {
            console.log(`Server closed on port: ${this.port}`);
            this.server.close(() => resolve());
        });
    }

    clear(): void {
        mailboxes.clear();
    }

    getMailbox(address: string): ParsedMail[] {
        return mailboxes.get(address) ?? [];
    }

    async waitFormail(address: string, timeout = 10000): Promise<ParsedMail> {
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

    async waitForVerificationEmail(email: string): Promise<ParsedMail> {
        const mail = await this.waitFormail(email);

        if (!mail.subject?.includes("Verify")) {
            throw new Error("Wrong email received");
        }

        return mail;
    }
}

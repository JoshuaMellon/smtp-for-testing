import { SMTPServer } from "smtp-server";
import { simpleParser, type ParsedMail } from "mailparser";
import { MailAwaiter } from "./mail-awaiter.js";

const mailboxes = new Map<string, ParsedMail[]>();

export class MailServer {
    server: SMTPServer;

    awaiter: MailAwaiter;

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

        this.awaiter = new MailAwaiter(this.getMailbox.bind(this));
    }

    public async start(): Promise<void> {
        return new Promise<void>((resolve) => {
            console.log(`Server started on port: ${this.port}`);
            this.server.listen(this.port, resolve);
        });
    }
    public async stop(): Promise<void> {
        return new Promise<void>((resolve) => {
            console.log(`Server closed on port: ${this.port}`);
            this.server.close(() => resolve());
        });
    }

    public clear(): void {
        mailboxes.clear();
    }

    public getMailbox(address: string): ParsedMail[] {
        return mailboxes.get(address) ?? [];
    }

    public waitForMail(address: string, timeout = 10000) {
        return this.awaiter.waitForMail(address, timeout);
    }

    public waitForVerificationEmail(address: string, timeout = 10000) {
        return this.awaiter.waitForVerificationEmail(address, timeout);
    }
}

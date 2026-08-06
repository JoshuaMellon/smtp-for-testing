import { SMTPServer } from "smtp-server";
import { simpleParser, type ParsedMail } from "mailparser";
import { MailAwaiter } from "./mail-awaiter.js";

import type { MailServerConfig } from "../types/mail-server.js";

export class MailServer {
    private mailboxes = new Map<string, ParsedMail[]>();

    private readonly config: MailServerConfig;
    private readonly port: number;
    private readonly timeout: number;

    public server: SMTPServer;
    public awaiter: MailAwaiter;

    constructor(configOrPort: MailServerConfig | number = 2525) {
        this.config = typeof configOrPort === "number" ? { port: configOrPort } : configOrPort;

        this.port = this.config.port ?? 2525;
        this.timeout = this.config.defaultTimeout ?? 10000;

        this.server = new SMTPServer({
            authOptional: true,
            disabledCommands: ["STARTTLS"],

            // Upon receiving an email gather all email address, push all mail to inbox, and set the object with an address and list of mail
            onData: (stream, session, callback) => {
                simpleParser(stream)
                    .then((mail) => {
                        const recipients = session.envelope.rcptTo.map((r) => r.address);

                        for (const address of recipients) {
                            const existing = this.mailboxes.get(address) ?? [];
                            existing.push(mail);
                            this.mailboxes.set(address, existing);
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

            if (this.config.clearOnStart) {
                this.clear();
            }

            this.seedMailboxes();

            this.server.listen(this.port, this.config.host, resolve);
        });
    }
    public async stop(): Promise<void> {
        return new Promise<void>((resolve) => {
            console.log(`Server closed on port: ${this.port}`);

            if (this.config.clearOnStop) {
                this.clear();
            }

            this.server.close(() => resolve());
        });
    }

    public clear(): void {
        this.mailboxes.clear();
    }

    public getMailbox(address: string): ParsedMail[] {
        return this.mailboxes.get(address) ?? [];
    }

    public waitForMail(address: string, timeout = this.timeout) {
        return this.awaiter.waitForMail(address, timeout);
    }

    public waitForVerificationEmail(address: string, timeout = this.timeout) {
        return this.awaiter.waitForVerificationEmail(address, timeout);
    }

    private seedMailboxes(): void {
        const recipients = this.config.seedRecipients ?? [];
        const domainUsers = this.config.recipientDomain && this.config.seedUsers ? this.config.seedUsers.map((u) => `${u}@${this.config.recipientDomain}`) : [];

        const allMailboxes = [...recipients, ...domainUsers];

        for (const address of allMailboxes) {
            if (!this.mailboxes.has(address)) {
                this.mailboxes.set(address, []);
            }
        }
    }
}

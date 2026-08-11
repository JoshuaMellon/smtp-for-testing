import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import { parseMail } from "./mail-parser.js";

import { MailAwaiter } from "./mail-awaiter.js";
import { UserSeeder } from "./user-seeder.js";

import type { Mail } from "../types/mail.js";
import type { MailServerConfig } from "../types/mail-server.js";

export class MailServer {
    private mailboxes = new Map<string, Mail[]>();

    private readonly config: MailServerConfig;
    private readonly port: number;
    private readonly host: string;
    private readonly timeout: number;

    public server: SMTPServer;
    public awaiter: MailAwaiter;
    private readonly userSeeder: UserSeeder;

    constructor(configOrPort: MailServerConfig | number = 2525) {
        this.config =
            typeof configOrPort === "number"
                ? { port: configOrPort }
                : configOrPort;

        this.port = this.config.port ?? 2525;
        this.host = this.config.host ?? "0.0.0.1";
        this.timeout = this.config.defaultTimeout ?? 10000;

        this.server = new SMTPServer({
            authOptional: true,
            disabledCommands: ["STARTTLS"],

            // Upon receiving an email gather all email address, push all mail to inbox, and set the object with an address and list of mail
            onData: (stream, session, callback) => {
                simpleParser(stream)
                    .then((rawMail) => {
                        const mail = parseMail(rawMail);
                        const recipients = session.envelope.rcptTo.map(
                            (r) => r.address,
                        );

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

        this.userSeeder = new UserSeeder(
            {
                ensureMailbox: (address) => this.ensureMailbox(address),
            },
            this.config,
        );
    }

    /**
     * Starts the SMTP server and prepares mailbox state.
     *
     * If enabled, existing mailbox state is cleared first and configured
     * recipient mailboxes are seeded before the server begins listening.
     * Resolves when the server has started listening.
     */
    public async start(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.config.clearOnStart) {
                this.clear();
            }

            this.seedMailboxes();

            this.server.once("error", reject);

            this.server.listen(this.port, this.host, () => {
                this.server.removeListener("error", reject);
                console.log(`Server started on port: ${this.port}`);
                resolve();
            });
        });
    }

    /**
     * Stops the SMTP server.
     *
     * If enabled, mailbox state is cleared before the server is closed.
     * Resolves when the server has fully closed.
     */
    public async stop(): Promise<void> {
        return new Promise<void>((resolve) => {
            console.log(`Server closed on port: ${this.port}`);

            if (this.config.clearOnStop) {
                this.clear();
            }

            this.server.close(() => resolve());
        });
    }

    /** Clears all in-memory mailbox state for this server instance. */
    public clear(): void {
        this.mailboxes.clear();
    }

    /**
     * Returns all parsed messages currently stored for a recipient address.
     *
     * @param address Recipient email address.
     */
    public getMailbox(address: string): Mail[] {
        return this.mailboxes.get(address) ?? [];
    }

    /**
     * Waits until at least one message is available for the provided address.
     * Uses the configured default timeout when no timeout is passed.
     *
     * @param address Recipient email address.
     * @param timeout Max wait time in milliseconds.
     */
    public waitForMail(address: string, timeout = this.timeout): Promise<Mail> {
        return this.awaiter.waitForMail(address, timeout);
    }

    /**
     * Waits for a recipient message whose subject contains "Verify".
     * Uses the configured default timeout when no timeout is passed.
     *
     * @param address Recipient email address.
     * @param timeout Max wait time in milliseconds.
     */
    public waitForVerificationEmail(
        address: string,
        timeout = this.timeout,
    ): Promise<Mail> {
        return this.awaiter.waitForVerificationEmail(address, timeout);
    }

    /**
     * Creates a mailbox entry for the provided address if one does not already exist.
     *
     * @param address Recipient email address to initialize.
     */
    public addMailbox(address: string): void {
        this.userSeeder.addMailbox(address);
    }

    /**
     * Ensures a mailbox exists in the in-memory store for the supplied address.
     *
     * @param address Recipient email address to initialize.
     */
    private ensureMailbox(address: string): void {
        if (!this.mailboxes.has(address)) {
            this.mailboxes.set(address, []);
        }
    }

    private seedMailboxes(): void {
        this.userSeeder.seedConfiguredMailboxes();
    }
}

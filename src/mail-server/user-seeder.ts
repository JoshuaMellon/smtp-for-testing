interface MailboxStore {
    ensureMailbox(address: string): void;
}
export class UserSeeder {
    constructor(
        private readonly mailboxStore: MailboxStore,
        private readonly config: {
            seedRecipients?: string[];
            seedUsers?: string[];
            recipientDomain?: string;
        },
    ) {}

    /**
     * Seeds all configured recipient mailboxes based on the server config.
     */
    seedConfiguredMailboxes(): void {
        const recipients = this.config.seedRecipients ?? [];
        const domainUsers =
            this.config.recipientDomain && this.config.seedUsers
                ? this.config.seedUsers.map(
                      (u) => `${u}@${this.config.recipientDomain}`,
                  )
                : [];

        for (const address of [...recipients, ...domainUsers]) {
            this.mailboxStore.ensureMailbox(address);
        }
    }

    /**
     * Ensures a single mailbox exists for the provided address.
     *
     * @param address Recipient email address to initialize.
     */
    addMailbox(address: string): void {
        this.mailboxStore.ensureMailbox(address);
    }
}

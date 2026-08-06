export type MailServerConfig = {
    port?: number;
    host?: string;
    defaultTimeout?: number;
    pollInterval?: number;
    clearOnStart?: boolean;
    clearOnStop?: boolean;

    seedRecipients?: string[]; // full addresses
    recipientDomain?: string; // e.g. "company.test"
    seedUsers?: string[]; // e.g. ["alice", "qa1"] -> alice@company.test
};

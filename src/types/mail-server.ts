export type MailServerConfig = {
    /** Port for the local SMTP server. Defaults to 2525. */
    port?: number;
    /** Optional host/interface to bind the SMTP server to. */
    host?: string;
    /** Default timeout (ms) used by wait helpers when not explicitly provided. */
    defaultTimeout?: number;
    /** Poll interval (ms) reserved for future wait strategy customization. */
    pollInterval?: number;
    /** Clears all mailbox state when start() is called. */
    clearOnStart?: boolean;
    /** Clears all mailbox state when stop() is called. */
    clearOnStop?: boolean;

    /** Full recipient addresses to initialize at startup. */
    seedRecipients?: string[];
    /** Domain used to expand seedUsers, for example "company.test". */
    recipientDomain?: string;
    /** Local user names expanded into addresses using recipientDomain. */
    seedUsers?: string[];
};

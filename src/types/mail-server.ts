export type MailServerConfig = {
    port?: number;
    host?: string;
    defaultTimeout?: number;
    pollInterval?: number;
    clearOnStart?: boolean;
};

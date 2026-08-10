export type Mail = {
    /** The email address of the sender. */
    from: string;
    /** The email address of the recipient. */
    to: string;
    /** The subject of the email. */
    subject: string;
    /** The body of the email. */
    text: string;
    /** The HTML body of the email, if any. */
    html?: string | boolean;
    /** The attachments of the email, if any. */
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
};

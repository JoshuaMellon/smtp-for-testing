import { expect, test, beforeEach, beforeAll } from "vitest";

import { MailServer } from "../../src/mail-server/mail-server.js";
import type { Mail } from "../../src/types/mail.js";

let mailServer: MailServer;

beforeAll(async () => {
    mailServer = new MailServer();
});

beforeEach(async () => {
    mailServer.clear();
});

test("getMailbox returns empty array when no mail exists", () => {
    const mailbox = mailServer.getMailbox("test");
    expect(mailbox).toStrictEqual([]);
});

test("clear wipes mail state", () => {
    const mail: Mail = {
        from: "sender@example.com",
        to: "test@example.com",
        subject: "Testing",
        text: "Test text",
    };

    mailServer.getMailbox("test").push(mail);

    mailServer.clear();
    expect(mailServer.getMailbox("test")).toStrictEqual([]);
});

test("constructor accepts config object without explicit port", () => {
    const configuredServer = new MailServer({
        defaultTimeout: 500,
        seedRecipients: ["unit@example.com"],
    });

    expect(configuredServer.getMailbox("unit@example.com")).toEqual([]);
});

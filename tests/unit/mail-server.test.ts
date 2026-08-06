import { expect, test, beforeEach, beforeAll } from "vitest";
import type { ParsedMail } from "mailparser";

import { MailServer } from "../../src/mail-server/mail-server.js";

let mailServer: MailServer;

beforeAll(async () => {
    mailServer = new MailServer();
});

beforeEach(async () => {
    mailServer.clear();
});

test("getMailbox returns empty array when no mail exists", () => {
    const mailbox = mailServer.getMailbox("test");
    console.log(mailbox);

    expect(mailbox).toStrictEqual([]);
});

test("clear wipes mail state", () => {
    mailServer.getMailbox("test").push({
        subject: "Testing",
        text: "Test text",
    } as ParsedMail);

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

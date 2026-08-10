import { expect, test, beforeEach, afterEach } from "vitest";

import { MailServer } from "../../src/mail-server/mail-server.js";
import { sendTestMail } from "../helpers/mail.helper.js";

let mailServer: MailServer;

beforeEach(async () => {
    mailServer = new MailServer();
    await mailServer.start();
});

afterEach(async () => {
    mailServer.clear();
    await mailServer.stop();
});

test("start and stop mail server", async () => {
    const startStopServer = new MailServer(2526);
    await expect(startStopServer.start()).resolves.toBeUndefined();
    await expect(startStopServer.stop()).resolves.toBeUndefined();
});

test("mail server can receive incoming mail", async () => {
    const recipient = "receiveMail@example.com";

    await sendTestMail(recipient);

    const received = await mailServer.waitForMail(recipient, 3000);

    expect(received.subject).toBe("Verify your account");
    expect(received.text?.toString()).toContain("hello");
    expect(mailServer.getMailbox(recipient)).toHaveLength(1);
});

test("waitForMail resolves after real mail sent", async () => {
    const recipient = "receiveMail@example.com";
    const sentMail = await sendTestMail(recipient);

    const receivedMail = await mailServer.waitForMail(recipient, 3000);

    expect(receivedMail.subject).toBe(sentMail.subject);
    expect(receivedMail.text?.toString()).toContain(sentMail.text);
});

test("waitForMail times out when no mail received", async () => {
    const recipient = "receiveMail@example.com";

    await expect(mailServer.waitForMail(recipient, 1000)).rejects.toThrow(
        "Timed out waiting for email",
    );
});

test("clear correctly removes real mail", async () => {
    const recipient = "receiveMail@example.com";
    const sentMail = await sendTestMail(recipient);

    const receivedMail = await mailServer.waitForMail(recipient, 3000);
    expect(receivedMail.subject).toBe(sentMail.subject);
    expect(receivedMail.text?.toString()).toContain(sentMail.text);

    mailServer.clear();
    expect(mailServer.getMailbox(recipient)).toEqual([]);
});

test("multiple recipients able to receive share mail", async () => {
    const recipients = ["tester1@example.com", "tester2@example.com"];
    const sentMail = await sendTestMail(recipients);

    const received = await Promise.all(
        recipients.map((recipient) => mailServer.waitForMail(recipient, 3000)),
    );

    received.forEach((mail) => {
        expect(mail.subject).toBe(sentMail.subject);
        expect(mail.text?.toString()).toContain(sentMail.text);
    });
});

test("multiple recipients able to receive unique mail", async () => {
    const recipients = ["tester1@example.com", "tester2@example.com"];

    await Promise.all(recipients.map((recipient) => sendTestMail(recipient)));

    const received = await Promise.all(
        recipients.map((recipient) => mailServer.waitForMail(recipient, 3000)),
    );

    received.forEach((mail) => {
        expect(mail.subject).toBe("Verify your account");
        expect(mail.text?.toString()).toContain("hello");
    });
});

test("waitForVerificationEmail resolves after expected mail", async () => {
    const recipient = "receiveMail@example.com";
    const sentMail = await sendTestMail(recipient);

    const receivedMail = await mailServer.waitForVerificationEmail(
        recipient,
        3000,
    );

    expect(receivedMail.subject).toBe(sentMail.subject);
    expect(receivedMail.text?.toString()).toContain(sentMail.text);
});

test("waitForVerificationEmail errors when incorrect mail is received", async () => {
    const recipient = "receiveMail@example.com";
    const sentMail = {
        from: "tester@example.com",
        to: recipient,
        subject: "Funny test",
        text: "no no",
    };

    await sendTestMail(recipient, sentMail);

    await expect(
        mailServer.waitForVerificationEmail(recipient, 1000),
    ).rejects.toThrow("Wrong email received");
});

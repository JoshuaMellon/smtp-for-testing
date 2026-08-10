import { afterEach, beforeEach, expect, test } from "vitest";
import { createTransport, type SendMailOptions } from "nodemailer";

import { MailServer } from "../../src/mail-server/mail-server.js";

const PORT = 2625;

let mailServer: MailServer;

async function sendMailToPort(
    port: number,
    address: string[] | string,
    mail?: SendMailOptions,
) {
    const transport = createTransport({
        host: "127.0.0.1",
        port,
        secure: false,
        ignoreTLS: true,
    });

    const payload: SendMailOptions = mail ?? {
        from: "tester@example.com",
        to: address,
        subject: "Verify your account",
        text: "hello",
    };

    await transport.sendMail(payload);
    return payload;
}

beforeEach(async () => {
    mailServer = new MailServer({
        port: PORT,
        seedRecipients: ["seeded@example.com"],
        seedUsers: ["alice", "qa1"],
        recipientDomain: "company.test",
    });

    await mailServer.start();
});

afterEach(async () => {
    mailServer.clear();
    await mailServer.stop();
});

test("start seeds configured full recipient addresses", () => {
    expect(mailServer.getMailbox("seeded@example.com")).toEqual([]);
});

test("start seeds configured domain user addresses", () => {
    expect(mailServer.getMailbox("alice@company.test")).toEqual([]);
    expect(mailServer.getMailbox("qa1@company.test")).toEqual([]);
});

test("seeded recipients receive incoming mail", async () => {
    await sendMailToPort(PORT, "seeded@example.com");

    const receivedMail = await mailServer.waitForMail(
        "seeded@example.com",
        3000,
    );

    expect(receivedMail.subject).toBe("Verify your account");
    expect(mailServer.getMailbox("seeded@example.com")).toHaveLength(1);
});

test("waitForMail uses configured default timeout", async () => {
    const timeoutServer = new MailServer({
        port: 2626,
        defaultTimeout: 300,
    });

    await timeoutServer.start();

    const startedAt = Date.now();
    await expect(
        timeoutServer.waitForMail("nobody@example.com"),
    ).rejects.toThrow("Timed out waiting for email");
    const elapsed = Date.now() - startedAt;

    await timeoutServer.stop();

    expect(elapsed).toBeGreaterThanOrEqual(250);
    expect(elapsed).toBeLessThan(1200);
});

test("clearOnStop removes received mail before next start", async () => {
    const clearOnStopServer = new MailServer({
        port: 2627,
        clearOnStop: true,
        seedRecipients: ["persist-check@example.com"],
    });

    await clearOnStopServer.start();
    await sendMailToPort(2627, "persist-check@example.com");
    await clearOnStopServer.waitForMail("persist-check@example.com", 3000);

    await clearOnStopServer.stop();
    await clearOnStopServer.start();

    expect(clearOnStopServer.getMailbox("persist-check@example.com")).toEqual(
        [],
    );

    await clearOnStopServer.stop();
});

test("clearOnStart resets mailbox state before reseeding", async () => {
    const clearOnStartServer = new MailServer({
        port: 2628,
        clearOnStart: true,
        seedRecipients: ["reset-check@example.com"],
    });

    await clearOnStartServer.start();
    await sendMailToPort(2628, "reset-check@example.com");
    await clearOnStartServer.waitForMail("reset-check@example.com", 3000);

    await clearOnStartServer.stop();
    await clearOnStartServer.start();

    expect(clearOnStartServer.getMailbox("reset-check@example.com")).toEqual(
        [],
    );

    await clearOnStartServer.stop();
});

test("start can reseed an existing address without duplicating mailbox state", async () => {
    const dedupeSeedServer = new MailServer({
        port: 2629,
        seedRecipients: ["alice@company.test"],
        seedUsers: ["alice"],
        recipientDomain: "company.test",
    });

    await dedupeSeedServer.start();
    await dedupeSeedServer.stop();
    await dedupeSeedServer.start();

    expect(dedupeSeedServer.getMailbox("alice@company.test")).toEqual([]);

    await dedupeSeedServer.stop();
});

import { createTransport, type SendMailOptions } from "nodemailer";

export async function sendTestMail(address: string[] | string, mail?: SendMailOptions) {
    const transport = createTransport({
        host: "127.0.0.1",
        port: 2525, // same port configured in mail-server, might be worth moving to env
        secure: false,
        ignoreTLS: true,
    });

    if (mail == undefined) {
        mail = {
            from: "tester@example.com",
            to: address,
            subject: "Verify your account",
            text: "hello",
        };
    }

    await transport.sendMail(mail);

    return mail;
}

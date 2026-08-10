import { createTransport, type SendMailOptions } from "nodemailer";

export async function sendTestMail(address: string[] | string, mail?: SendMailOptions, port = 2525) {
    const transport = createTransport({
        host: "127.0.0.1",
        port,
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

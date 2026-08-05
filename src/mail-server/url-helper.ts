import type { ParsedMail } from "mailparser";

const URL_REGEX = /https?:\/\/[^\s"'<>]+/gi;

export async function fetchUrls(mailList: ParsedMail[], subject: string, retries = 6, delayMs = 5000): Promise<string[]> {
    for (let i = 0; i < retries; i++) {
        const targetMail = mailList.find((mail) => mail.subject?.toLocaleLowerCase().includes(subject.toLowerCase()));

        if (!targetMail) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
        }

        const mailContent = targetMail.html?.toString() ?? targetMail.textAsHtml ?? targetMail.text ?? "";

        const urls = Array.from(mailContent.matchAll(URL_REGEX), (m) => m[0]);

        if (urls.length > 0) {
            return [...new Set(urls)];
        }
    }

    throw new Error(`No mail found with subject containing "${subject}" and URL body content.`);
}

export function findLongestUrl(urls: string[]): string | undefined {
    return urls.reduce<string | undefined>((longest, current) => (!longest || current.length > longest.length ? current : longest), undefined);
}

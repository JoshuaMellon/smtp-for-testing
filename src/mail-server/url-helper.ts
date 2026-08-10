import type { ParsedMail } from "mailparser";

const URL_REGEX = /https?:\/\/[^\s"'<>]+/gi;

/**
 * Finds URLs in the first message whose subject contains the provided text.
 *
 * Retries a fixed number of times to support asynchronous mail delivery.
 * Returns unique URLs only.
 *
 * @param getMailList Function returning the current parsed messages to search.
 * @param subject Case-insensitive subject fragment to match.
 * @param retries Number of polling attempts before failing - default: 6.
 * @param delayMs Delay in milliseconds between attempts - default: 5000.
 */
export async function fetchUrls(
    getMailList: () => ParsedMail[],
    subject: string,
    retries = 6,
    delayMs = 5000,
): Promise<string[]> {
    const subjectLower = subject.toLowerCase();

    for (let i = 0; i < retries; i++) {
        const mailList = getMailList();
        const targetMail = mailList.find((mail) =>
            mail.subject?.toLowerCase().includes(subjectLower),
        );

        if (!targetMail) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
        }

        const mailContent =
            targetMail.html?.toString() ??
            targetMail.textAsHtml ??
            targetMail.text ??
            "";

        const urls = Array.from(mailContent.matchAll(URL_REGEX), (m) => m[0]);

        if (urls.length > 0) {
            return [...new Set(urls)];
        }
    }

    throw new Error(
        `No mail found with subject containing "${subject}" and URL body content.`,
    );
}

/**
 * Returns the longest URL from a list.
 *
 * @param urls URL candidates.
 * @returns The longest URL, or undefined when the list is empty.
 */
export function findLongestUrl(urls: string[]): string | undefined {
    return urls.reduce<string | undefined>(
        (longest, current) =>
            !longest || current.length > longest.length ? current : longest,
        undefined,
    );
}

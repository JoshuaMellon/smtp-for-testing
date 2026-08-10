import { simpleParser, type ParsedMail } from "mailparser";

import type { Mail } from "../types/mail.js";

function addressFieldToText(
    field: ParsedMail["from"] | ParsedMail["to"],
): string {
    if (!field) return "";
    if (Array.isArray(field)) {
        return field
            .map((a) => a.text ?? "")
            .filter(Boolean)
            .join(", ");
    }
    return field.text ?? "";
}

export function parseMail(raw: ParsedMail): Mail {
    return {
        from: addressFieldToText(raw.from),
        to: addressFieldToText(raw.to),
        subject: raw.subject ?? "",
        text: raw.text ?? "",
        html: raw.html ?? undefined,
        attachments: raw.attachments?.map((a) => ({
            filename: a.filename ?? "",
            content: a.content,
            contentType: a.contentType ?? undefined,
        })),
    };
}

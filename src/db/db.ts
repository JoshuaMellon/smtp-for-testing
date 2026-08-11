import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";
import type { Mail } from "../types/mail.js";

type MailRow = {
    id: number;
    mailbox_id: number;
    from_address: string;
    to_address: string;
    subject: string;
    text_body: string;
    html_body: string | null;
    attachments_json: string | null;
    received_at: string;
};

export function createDatabase(): DatabaseType {
    const dbOptions: Database.Options = {
        readonly: false,
        fileMustExist: false,
        timeout: 5000,
        verbose: console.log,
    };

    // Create an in-memory database for testing purposes
    const db = new Database(":memory:", dbOptions);
    db.pragma("journal_mode = WAL"); // Enable Write-Ahead Logging for better concurrency

    initSchema(db);

    return db;
}

export function clearDatabase(db: DatabaseType): void {
    const clearAll = db.transaction(() => {
        db.exec("DELETE FROM messages;");
        db.exec("DELETE FROM mailboxes;");
    });

    clearAll();
}

function initSchema(db: DatabaseType): void {
    db.exec(`
        CREATE TABLE IF NOT EXISTS mailboxes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            address TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mailbox_id INTEGER NOT NULL,
            from_address TEXT NOT NULL,
            to_address TEXT NOT NULL,
            subject TEXT NOT NULL,
            text_body TEXT NOT NULL,
            html_body TEXT,
            attachments_json TEXT,
            received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (mailbox_id) REFERENCES mailboxes(id)
        );
    `);

    db.exec(
        "CREATE INDEX IF NOT EXISTS idx_mailboxes_address ON mailboxes(address);",
    );
    db.exec(
        "CREATE INDEX IF NOT EXISTS idx_messages_mailbox_id ON messages(mailbox_id);",
    );
}

export function seedDatabase(db: DatabaseType, addresses: string[]): void {
    const insertMailbox = db.prepare(
        "INSERT OR IGNORE INTO mailboxes(address) VALUES (?);",
    );

    const seedMany = db.transaction((items: string[]) => {
        for (const address of items) {
            insertMailbox.run(address);
        }
    });

    seedMany(addresses);
}

export function insertMail(
    db: DatabaseType,
    mailboxAddress: string,
    mail: Mail,
): void {
    const insertMailbox = db.prepare(
        "INSERT OR IGNORE INTO mailboxes(address) VALUES (?);",
    );
    const getMailboxId = db.prepare(
        "SELECT id FROM mailboxes WHERE address = ?;",
    );
    const insertMessage = db.prepare(`
        INSERT INTO messages(
            mailbox_id,
            from_address,
            to_address,
            subject,
            text_body,
            html_body,
            attachments_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?);
    `);

    const runInsert = db.transaction((address: string, message: Mail) => {
        insertMailbox.run(address);

        const mailbox = getMailboxId.get(address) as { id: number } | undefined;
        if (!mailbox) {
            throw new Error(`Mailbox not found for address: ${address}`);
        }

        insertMessage.run(
            mailbox.id,
            message.from,
            message.to,
            message.subject,
            message.text,
            typeof message.html === "string" ? message.html : null,
            message.attachments ? JSON.stringify(message.attachments) : null,
        );
    });

    runInsert(mailboxAddress, mail);
}

export function getMailboxMail(
    db: DatabaseType,
    mailboxAddress: string,
): Mail[] {
    const query = db.prepare(`
        SELECT
            m.id,
            m.mailbox_id,
            m.from_address,
            m.to_address,
            m.subject,
            m.text_body,
            m.html_body,
            m.attachments_json,
            m.received_at
        FROM messages m
        INNER JOIN mailboxes b ON b.id = m.mailbox_id
        WHERE b.address = ?
        ORDER BY m.id ASC;
    `);

    const rows = query.all(mailboxAddress) as MailRow[];

    return rows.map((row) => {
        const mail: Mail = {
            from: row.from_address,
            to: row.to_address,
            subject: row.subject,
            text: row.text_body,
        };

        if (row.html_body !== null) {
            mail.html = row.html_body;
        }

        if (row.attachments_json) {
            mail.attachments = JSON.parse(row.attachments_json) as NonNullable<
                Mail["attachments"]
            >;
        }

        return mail;
    });
}

export function getFirstMailboxMail(
    db: DatabaseType,
    mailboxAddress: string,
): Mail | undefined {
    const query = db.prepare(`
        SELECT
            m.from_address,
            m.to_address,
            m.subject,
            m.text_body,
            m.html_body,
            m.attachments_json
        FROM messages m
        INNER JOIN mailboxes b ON b.id = m.mailbox_id
        WHERE b.address = ?
        ORDER BY m.id ASC
        LIMIT 1;
    `);

    const row = query.get(mailboxAddress) as
        Omit<MailRow, "id" | "mailbox_id" | "received_at"> | undefined;

    if (!row) {
        return undefined;
    }

    const mail: Mail = {
        from: row.from_address,
        to: row.to_address,
        subject: row.subject,
        text: row.text_body,
    };

    if (row.html_body !== null) {
        mail.html = row.html_body;
    }

    if (row.attachments_json) {
        mail.attachments = JSON.parse(row.attachments_json) as NonNullable<
            Mail["attachments"]
        >;
    }

    return mail;
}

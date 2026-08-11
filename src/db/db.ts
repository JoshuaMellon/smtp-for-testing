import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";

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

    return db;
}

export function closeDatabase(db: DatabaseType): void {
    db.close();
}

export function seedDatabase(db: DatabaseType): void {
    // Need to seed db with pre defined address which are linked to mailboxes that contain all returned mail for that address
}

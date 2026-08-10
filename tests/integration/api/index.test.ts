import express from "express";
import { afterEach, expect, test, vi } from "vitest";

import { startServer } from "../../../src/api/index.js";
import { MailServer } from "../../../src/mail-server/mail-server.js";

afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.API_PORT;
});

test("startServer starts API listener and mail server", async () => {
    process.env.API_PORT = "3999";

    const listenSpy = vi
        .spyOn(express.application, "listen")
        .mockImplementation((_port: unknown, callback?: () => void) => {
            callback?.();
            return {} as never;
        });

    const mailStartSpy = vi
        .spyOn(MailServer.prototype, "start")
        .mockResolvedValue();

    await startServer(2525);

    expect(listenSpy).toHaveBeenCalled();
    expect(mailStartSpy).toHaveBeenCalled();
});

test("startServer logs failures when mail server start throws", async () => {
    process.env.API_PORT = "4000";

    vi.spyOn(express.application, "listen").mockImplementation(
        (_port: unknown, callback?: () => void) => {
            callback?.();
            return {} as never;
        },
    );

    const error = new Error("smtp failed");
    vi.spyOn(MailServer.prototype, "start").mockRejectedValue(error);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await startServer(2525);

    expect(errorSpy).toHaveBeenCalledWith(
        "Failed to start mail server:",
        error,
    );
});

test("startServer uses default API port when API_PORT is undefined", async () => {
    delete process.env.API_PORT;

    const listenSpy = vi
        .spyOn(express.application, "listen")
        .mockImplementation((_port: unknown, callback?: () => void) => {
            callback?.();
            return {} as never;
        });

    vi.spyOn(MailServer.prototype, "start").mockResolvedValue();

    await startServer(2525);

    expect(listenSpy).toHaveBeenCalledWith(3000, expect.any(Function));
});

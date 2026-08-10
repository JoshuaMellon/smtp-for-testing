import { Router, type Request, type Response } from "express";
import type { MailServer } from "../../mail-server/mail-server.js";

/**
 * Handles errors for mail routes and sends appropriate HTTP responses.
 * @param error - The error object thrown during route handling
 * @param res - The Express response object
 * @returns void
 */
function handleMailRouteError(error: unknown, res: Response): void {
    if (error instanceof Error) {
        if (error.message === "Timed out waiting for email") {
            res.status(400).json({ error: error.message });
            return;
        }

        if (error.message === "Wrong email received") {
            res.status(400).json({ error: error.message });
            return;
        }

        res.status(500).json({ error: error.message });
        return;
    }

    res.status(500).json({ error: "Unknown server error" });
}

/**
 * Creates and configures the Express router for mail-related endpoints.
 * @param mailServer - The mail server instance used to handle mailbox operations
 * @returns {Router} An Express Router configured with mail API routes
 */
export function createMailRoutes(mailServer: MailServer): Router {
    const router = Router();

    router.get(
        "/mailbox/:address",
        (req: Request<{ address: string }>, res: Response) => {
            try {
                const mail = mailServer.getMailbox(req.params.address);
                res.status(200).json(mail);
            } catch (error) {
                handleMailRouteError(error, res);
            }
        },
    );

    router.get(
        "/mailbox/:address/wait",
        async (req: Request<{ address: string }>, res: Response) => {
            try {
                const mail = await mailServer.waitForMail(req.params.address);
                res.status(200).json(mail.text);
            } catch (error) {
                handleMailRouteError(error, res);
            }
        },
    );

    router.get(
        "/mailbox/:address/wait-verification",
        async (req: Request<{ address: string }>, res: Response) => {
            try {
                const mail = await mailServer.waitForVerificationEmail(
                    req.params.address,
                );
                res.status(200).json(mail.text);
            } catch (error) {
                handleMailRouteError(error, res);
            }
        },
    );

    return router;
}

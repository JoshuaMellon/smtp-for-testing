import { Router, type Request, type Response } from "express";
import type { MailServer } from "../../mail-server/mail-server.js";

export function createUserRoutes(mailServer: MailServer): Router {
    const router = Router();

    router.post(
        "/seed-mailbox/:address",
        (req: Request<{ address: string }>, res: Response) => {
            try {
                mailServer.addMailbox(req.params.address);
                res.status(200).json({
                    message: `Mailbox for ${req.params.address} seeded successfully.`,
                });
            } catch (error) {
                res.status(500).json({ error: error });
            }
        },
    );

    return router;
}

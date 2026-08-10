import { Router, type Request, type Response } from "express";
import type { MailServer } from "../mail-server/mail-server.js";

export function createMailRoutes(mailServer: MailServer): Router {
    const router = Router();

    router.get("/health", (req: Request, res: Response) => {
        res.status(200).json({ status: "ok" });
    });

    router.get("/mailbox/:address", (req: Request<{ address: string }>, res: Response) => {
        const mail = mailServer.getMailbox(req.params.address);
        res.status(200).json(mail);
    });

    router.get("/mailbox/:address/wait", async (req: Request<{ address: string }>, res: Response) => {
        const mail = await mailServer.waitForMail(req.params.address);
        res.status(200).json(mail);
    });

    router.get("/mailbox/:address/wait-verification", async (req: Request<{ address: string }>, res: Response) => {
        const mail = await mailServer.waitForVerificationEmail(req.params.address);
        res.status(200).json(mail);
    });

    return router;
}

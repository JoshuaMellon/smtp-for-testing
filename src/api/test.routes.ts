import { Router, type Request, type Response } from "express";

export function createTestRoutes(port: number): Router {
    const router = Router();

    router.get("/test", (req: Request, res: Response) => {
        res.send(`Api running on port ${port}`);
    });

    return router;
}

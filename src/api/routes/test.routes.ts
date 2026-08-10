import { Router, type Request, type Response } from "express";

/**
 * Creates and configures test routes for the API.
 * @returns {Router} An Express router with test endpoints configured
 */
export function createTestRoutes(): Router {
    const router = Router();

    router.get("/", (req: Request, res: Response) => {
        res.send(`API up!`);
    });

    return router;
}

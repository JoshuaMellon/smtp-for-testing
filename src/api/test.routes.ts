import { Router, type Request, type Response } from "express";

/**
 * Creates and configures test routes for the API.
 * @param {number} port - The port number on which the API is running
 * @returns {Router} An Express router with test endpoints configured
 */
export function createTestRoutes(port: number): Router {
    const router = Router();

    router.get("/test", (req: Request, res: Response) => {
        res.send(`Api running on port ${port}`);
    });

    return router;
}

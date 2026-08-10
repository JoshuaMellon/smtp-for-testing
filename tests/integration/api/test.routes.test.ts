import type { Express } from "express";
import request from "supertest";
import { expect, test, beforeEach, afterEach } from "vitest";

import { createApiApp } from "../../../src/api/index.js";

let app: Express;

beforeEach(async () => {
    const context = await createApiApp(2525);
    app = context.app;
});

test("test returns 200 and expected response text", async () => {
    const res = await request(app).get("/test");

    expect(res.status).toBe(200);
    expect(res.text).toEqual("API up!");
});

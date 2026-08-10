import type { Express } from "express";
import request from "supertest";
import { expect, test, beforeEach } from "vitest";

import { createApiApp } from "../../../src/api/index.js";

let app: Express;

beforeEach(async () => {
    const context = await createApiApp(2525);
    app = context.app;
});

test("GET /test returns 200 and expected text.", async () => {
    const res = await request(app).get("/test");

    expect(res.status).toBe(200);
    expect(res.text).toEqual("API up!");
});

test("GET /docs returns 200 and contains Users API", async () => {
    const res = await request(app).get("/docs");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Users API");
});

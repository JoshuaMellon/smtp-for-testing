import { describe, expect, test } from "vitest";

import { generateOpenApiDocument } from "../../src/api/lib/openapi.js";

describe("generateOpenApiDocument", () => {
    test("includes the current mailbox, user, and test endpoints", () => {
        const document = generateOpenApiDocument("http://localhost:3000");

        expect(document.paths).toHaveProperty("/mailbox/{address}");
        expect(document.paths).toHaveProperty("/mailbox/{address}/wait");
        expect(document.paths).toHaveProperty(
            "/mailbox/{address}/wait-verification",
        );
        expect(document.paths).toHaveProperty("/user/seed-mailbox/{address}");
        expect(document.paths).toHaveProperty("/test/");
    });
});

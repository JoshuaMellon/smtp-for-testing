import {
    OpenApiGeneratorV3,
    OpenAPIRegistry,
    extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const TestResponseSchema = z.string().openapi({
    example: "Api running on port 3000",
});

const MailSchema = z
    .object({
        from: z.string().optional(),
        to: z.string().optional(),
        subject: z.string().nullable().optional(),
        text: z.string().nullable().optional(),
        html: z.union([z.string(), z.boolean()]).nullable().optional(),
        attachments: z
            .array(
                z.object({
                    filename: z.string().optional(),
                    content: z.union([z.string(), z.instanceof(Buffer)]),
                    contentType: z.string().optional(),
                }),
            )
            .optional(),
    })
    .openapi("Mail");

registry.registerPath({
    method: "get",
    path: "/mail/mailbox/{address}",
    tags: ["mail"],
    summary: "Get all messages in a mailbox",
    request: {
        params: z.object({
            address: z.string().openapi({
                example: "user@example.com",
            }),
        }),
    },
    responses: {
        200: {
            description: "Mailbox messages",
            content: {
                "application/json": {
                    schema: z.array(MailSchema),
                },
            },
        },
    },
});

registry.registerPath({
    method: "get",
    path: "/mail/mailbox/{address}/wait",
    tags: ["mail"],
    summary: "Wait for the first available email",
    request: {
        params: z.object({
            address: z.string().openapi({
                example: "user@example.com",
            }),
        }),
    },
    responses: {
        200: {
            description: "First received message",
            content: {
                "application/json": {
                    schema: MailSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: "get",
    path: "/mail/mailbox/{address}/wait-verification",
    tags: ["mail"],
    summary: "Wait for a verification email",
    request: {
        params: z.object({
            address: z.string().openapi({
                example: "user@example.com",
            }),
        }),
    },
    responses: {
        200: {
            description: "Verification message",
            content: {
                "application/json": {
                    schema: MailSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: "get",
    path: "/test/test",
    tags: ["test"],
    summary: "API test endpoint",
    responses: {
        200: {
            description: "Simple API status response",
            content: {
                "text/plain": {
                    schema: TestResponseSchema,
                },
            },
        },
    },
});

export function generateOpenApiDocument(baseUrl = "http://localhost:3000") {
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateDocument({
        openapi: "3.0.3",
        info: {
            title: "smtp-for-testing API",
            version: "0.1.0",
            description:
                "HTTP endpoints for interacting with the in-memory mail server.",
        },
        servers: [{ url: baseUrl }],
        tags: [{ name: "mail" }, { name: "test" }],
    });
}

export const openApiDocument = generateOpenApiDocument();

import {
    OpenApiGeneratorV3,
    OpenAPIRegistry,
    extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const TestResponseSchema = z.string().openapi({
    example: "API up!",
});

const ErrorResponseSchema = z
    .object({
        error: z.string(),
    })
    .openapi({ title: "ErrorResponse" });

const SeedMailboxResponseSchema = z
    .object({
        message: z.string(),
    })
    .openapi({ title: "SeedMailboxResponse" });

const MailSchema = z
    .object({
        from: z.string(),
        to: z.string(),
        subject: z.string().nullable().optional(),
        text: z.string().nullable().optional(),
        html: z.string().nullable().optional(),
        attachments: z
            .array(
                z.object({
                    filename: z.string().optional(),
                    content: z.string().optional(),
                    contentType: z.string().optional(),
                }),
            )
            .optional(),
    })
    .openapi({ title: "Mail" });

registry.registerPath({
    method: "get",
    path: "/mailbox/{address}",
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
    path: "/mailbox/{address}/wait",
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
    path: "/mailbox/{address}/wait-verification",
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
    method: "post",
    path: "/user/seed-mailbox/{address}",
    tags: ["user"],
    summary: "Create a mailbox for a recipient address",
    request: {
        params: z.object({
            address: z.string().openapi({
                example: "user@example.com",
            }),
        }),
    },
    responses: {
        200: {
            description: "Mailbox seeded successfully",
            content: {
                "application/json": {
                    schema: SeedMailboxResponseSchema,
                },
            },
        },
        500: {
            description: "Failed to seed mailbox",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: "get",
    path: "/test/",
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
        tags: [{ name: "mail" }, { name: "test" }, { name: "user" }],
    });
}

export const openApiDocument = generateOpenApiDocument();

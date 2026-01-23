// shared/routes.ts
import { z } from "zod";
import {
  insertNoteSchema,
  insertUserSchema,
  users,
  notes,
} from "./schema.js";

/**
 * STANDARD ERROR RESPONSES
 */
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

/**
 * API CONTRACT
 * Backend & Frontend MUST follow this
 */
export const api = {
  auth: {
    register: {
      method: "POST" as const,
      path: "/api/auth/register",
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },

    login: {
      method: "POST" as const,
      path: "/api/auth/login",
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },

    logout: {
      method: "POST" as const,
      path: "/api/auth/logout",
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },

    me: {
      method: "GET" as const,
      path: "/api/auth/me",
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },

  notes: {
    list: {
      method: "GET" as const,
      path: "/api/notes",
      responses: {
        200: z.array(z.custom<typeof notes.$inferSelect>()),
      },
    },

    create: {
      method: "POST" as const,
      path: "/api/notes",
      input: insertNoteSchema,
      responses: {
        201: z.custom<typeof notes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },

    update: {
      method: "PUT" as const,
      path: "/api/notes/:id",
      input: insertNoteSchema.partial(),
      responses: {
        200: z.custom<typeof notes.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },

    delete: {
      method: "DELETE" as const,
      path: "/api/notes/:id",
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

/**
 * Helper to build URL with params
 */
export function buildUrl(
  path: string,
  params?: Record<string, string | number>
): string {
  let url = path;

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, String(value));
    }
  }

  return url;
}

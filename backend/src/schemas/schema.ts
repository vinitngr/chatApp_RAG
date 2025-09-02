import { pgTable, serial, text, varchar, timestamp, jsonb, integer, boolean, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: uuid('id').primaryKey().notNull(),
    fullName: varchar('full_name', { length: 256 }).notNull(),
    email: varchar('email', { length: 256 }).notNull().unique(),
    password: text('password').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const persona = pgTable('persona', {
    personaId: serial('personaid').primaryKey().notNull(),
    isPublic : boolean('is_public').notNull(),
    Token : text('token'),
    personaName: varchar('persona_name', { length: 256 }).notNull().unique(),
    contentArray: jsonb('content_array').$type<Array<{ type: "text" | "image" | "video" | "pdf" | "audio" ; url: string }>>().notNull(),
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  doublePrecision,
} from "drizzle-orm/pg-core";

// Better Auth tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  // Custom fields from your existing schema
  role: text("role").default("warga").notNull(),
  governmentId: text("government_id"),
  province: text("province"),
  city: text("city"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

// Your existing application tables
export const socialProgram = pgTable("social_program", {
  id: text("id").primaryKey(),
  acronym: text("acronym").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  legalBasis: text("legal_basis").notNull(),
  ministry: text("ministry").notNull(),
  benefits: text("benefits").notNull(),
  eligibility: text("eligibility").notNull(),
  documents: text("documents").notNull(),
  contact: text("contact").notNull(),
  province: text("province"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const eligibilityRecord = pgTable(
  "eligibility_record",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    programId: text("program_id")
      .notNull()
      .references(() => socialProgram.id, { onDelete: "cascade" }),
    score: integer("score").notNull(), // 0-100 score
    status: text("status").notNull(), // "eligible", "partial", "ineligible"
    details: text("details"), // JSON string with match details
    
    // Smart search fields (NEW)
    searchQuery: text("search_query"), // Original search query (structured + unstructured)
    aiReasoning: text("ai_reasoning"), // LLM-generated explanation
    semanticScore: doublePrecision("semantic_score"), // Semantic similarity score (0-1)
    finalScore: doublePrecision("final_score"), // Combined final score (0-1)
    recommendation: text("recommendation"), // "highly_recommended", "recommended", "consider"
    searchMetadata: text("search_metadata"), // JSON string with search tier info
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("eligibility_record_userId_idx").on(table.userId),
    index("eligibility_record_programId_idx").on(table.programId),
    index("eligibility_record_userId_createdAt_idx").on(table.userId, table.createdAt),
  ]
);

export const documentTemplate = pgTable("document_template", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  template: text("template").notNull(),
  fields: text("fields").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const document = pgTable(
  "document",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    templateId: text("template_id")
      .notNull()
      .references(() => documentTemplate.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    data: text("data").notNull(),
    pdfUrl: text("pdf_url"),
    status: text("status").default("draft").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("document_userId_idx").on(table.userId),
    index("document_templateId_idx").on(table.templateId),
  ]
);

export const chatHistory = pgTable(
  "chat_history",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    messages: text("messages").notNull(),
    context: text("context"),
    priority: text("priority").default("green").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("chat_history_userId_idx").on(table.userId)]
);

export const need = pgTable(
  "need",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    location: text("location").notNull(),
    urgency: text("urgency").default("normal").notNull(),
    status: text("status").default("open").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("need_userId_idx").on(table.userId)]
);

export const offer = pgTable(
  "offer",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    location: text("location").notNull(),
    contact: text("contact").notNull(),
    validity: text("validity").notNull(),
    status: text("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("offer_userId_idx").on(table.userId)]
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    resource: text("resource").notNull(),
    details: text("details"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("audit_log_userId_idx").on(table.userId)]
);

// Relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  chatHistory: many(chatHistory),
  eligibilityRecords: many(eligibilityRecord),
  documents: many(document),
  needs: many(need),
  offers: many(offer),
  auditLogs: many(auditLog),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const socialProgramRelations = relations(socialProgram, ({ many }) => ({
  eligibilityRecords: many(eligibilityRecord),
}));

export const eligibilityRecordRelations = relations(
  eligibilityRecord,
  ({ one }) => ({
    user: one(user, {
      fields: [eligibilityRecord.userId],
      references: [user.id],
    }),
    program: one(socialProgram, {
      fields: [eligibilityRecord.programId],
      references: [socialProgram.id],
    }),
  })
);

export const documentTemplateRelations = relations(
  documentTemplate,
  ({ many }) => ({
    documents: many(document),
  })
);

export const documentRelations = relations(document, ({ one }) => ({
  user: one(user, {
    fields: [document.userId],
    references: [user.id],
  }),
  template: one(documentTemplate, {
    fields: [document.templateId],
    references: [documentTemplate.id],
  }),
}));

export const chatHistoryRelations = relations(chatHistory, ({ one }) => ({
  user: one(user, {
    fields: [chatHistory.userId],
    references: [user.id],
  }),
}));

export const needRelations = relations(need, ({ one }) => ({
  user: one(user, {
    fields: [need.userId],
    references: [user.id],
  }),
}));

export const offerRelations = relations(offer, ({ one }) => ({
  user: one(user, {
    fields: [offer.userId],
    references: [user.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(user, {
    fields: [auditLog.userId],
    references: [user.id],
  }),
}));

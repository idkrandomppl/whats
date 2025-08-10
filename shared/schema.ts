import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const timers = pgTable("timers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  webhookUrl: text("webhook_url").notNull(),
  pingEveryone: boolean("ping_everyone").notNull().default(true),
  maxPings: integer("max_pings").notNull().default(1),
  currentPings: integer("current_pings").notNull().default(0),
  customMessage: text("custom_message"),
  repeatInterval: integer("repeat_interval"), // seconds for repeating timers
  priority: text("priority").notNull().default("normal"), // low, normal, high
  status: text("status").notNull().default("active"), // active, completed, cancelled
  isAlarmTimer: boolean("is_alarm_timer").notNull().default(false),
  alarmTime: timestamp("alarm_time"),
  userTimezone: text("user_timezone").default("UTC"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timerId: varchar("timer_id").references(() => timers.id),
  type: text("type").notNull(), // created, completed, cancelled, webhook_sent
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const webhooks = pgTable("webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const timerTemplates = pgTable("timer_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  pingEveryone: boolean("ping_everyone").notNull().default(true),
  maxPings: integer("max_pings").notNull().default(1),
  customMessage: text("custom_message"),
  priority: text("priority").notNull().default("normal"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTimerSchema = createInsertSchema(timers).omit({
  id: true,
  status: true,
  createdAt: true,
  expiresAt: true,
  currentPings: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export type InsertTimer = z.infer<typeof insertTimerSchema>;
export type Timer = typeof timers.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  createdAt: true,
});

export const insertTimerTemplateSchema = createInsertSchema(timerTemplates).omit({
  id: true,
  createdAt: true,
});

export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type Webhook = typeof webhooks.$inferSelect;
export type InsertTimerTemplate = z.infer<typeof insertTimerTemplateSchema>;
export type TimerTemplate = typeof timerTemplates.$inferSelect;

export const insertBatchTimersSchema = z.object({
  timers: z.array(insertTimerSchema),
});

export type InsertBatchTimers = z.infer<typeof insertBatchTimersSchema>;

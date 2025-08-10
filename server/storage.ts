import { 
  type User, type InsertUser, 
  type Timer, type InsertTimer, 
  type Activity, type InsertActivity,
  type Webhook, type InsertWebhook,
  type TimerTemplate, type InsertTimerTemplate
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createTimer(timer: InsertTimer): Promise<Timer>;
  getTimer(id: string): Promise<Timer | undefined>;
  getActiveTimers(): Promise<Timer[]>;
  updateTimerStatus(id: string, status: string): Promise<void>;
  deleteTimer(id: string): Promise<void>;
  
  createActivity(activity: InsertActivity): Promise<Activity>;
  getRecentActivities(limit?: number): Promise<Activity[]>;
  
  // Webhook management
  createWebhook(webhook: InsertWebhook): Promise<Webhook>;
  getWebhooks(): Promise<Webhook[]>;
  getWebhook(id: string): Promise<Webhook | undefined>;
  updateWebhook(id: string, webhook: Partial<InsertWebhook>): Promise<void>;
  deleteWebhook(id: string): Promise<void>;
  
  // Timer templates
  createTimerTemplate(template: InsertTimerTemplate): Promise<TimerTemplate>;
  getTimerTemplates(): Promise<TimerTemplate[]>;
  deleteTimerTemplate(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private timers: Map<string, Timer>;
  private activities: Map<string, Activity>;
  private webhooks: Map<string, Webhook>;
  private timerTemplates: Map<string, TimerTemplate>;

  constructor() {
    this.users = new Map();
    this.timers = new Map();
    this.activities = new Map();
    this.webhooks = new Map();
    this.timerTemplates = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createTimer(insertTimer: InsertTimer): Promise<Timer> {
    const id = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + insertTimer.durationSeconds * 1000);
    
    const timer: Timer = {
      ...insertTimer,
      id,
      status: "active",
      createdAt: now,
      expiresAt,
      pingEveryone: insertTimer.pingEveryone ?? true,
      maxPings: insertTimer.maxPings ?? 1,
      currentPings: 0,
      customMessage: insertTimer.customMessage ?? null,
      repeatInterval: insertTimer.repeatInterval ?? null,
      priority: insertTimer.priority ?? "normal",
      isAlarmTimer: insertTimer.isAlarmTimer ?? false,
      alarmTime: insertTimer.alarmTime ?? null,
      userTimezone: insertTimer.userTimezone ?? null,
    };
    
    this.timers.set(id, timer);
    return timer;
  }

  async getTimer(id: string): Promise<Timer | undefined> {
    return this.timers.get(id);
  }

  async getActiveTimers(): Promise<Timer[]> {
    return Array.from(this.timers.values()).filter(
      timer => timer.status === "active"
    );
  }

  async updateTimerStatus(id: string, status: string): Promise<void> {
    const timer = this.timers.get(id);
    if (timer) {
      this.timers.set(id, { ...timer, status });
    }
  }

  async deleteTimer(id: string): Promise<void> {
    this.timers.delete(id);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      ...insertActivity,
      id,
      createdAt: new Date(),
      timerId: insertActivity.timerId ?? null,
    };
    
    this.activities.set(id, activity);
    return activity;
  }

  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Webhook management methods
  async createWebhook(insertWebhook: InsertWebhook): Promise<Webhook> {
    const id = randomUUID();
    const webhook: Webhook = {
      ...insertWebhook,
      id,
      createdAt: new Date(),
      description: insertWebhook.description ?? null,
      isActive: insertWebhook.isActive ?? true,
    };
    
    this.webhooks.set(id, webhook);
    return webhook;
  }

  async getWebhooks(): Promise<Webhook[]> {
    return Array.from(this.webhooks.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getWebhook(id: string): Promise<Webhook | undefined> {
    return this.webhooks.get(id);
  }

  async updateWebhook(id: string, updateData: Partial<InsertWebhook>): Promise<void> {
    const webhook = this.webhooks.get(id);
    if (webhook) {
      this.webhooks.set(id, { ...webhook, ...updateData });
    }
  }

  async deleteWebhook(id: string): Promise<void> {
    this.webhooks.delete(id);
  }

  // Timer template methods
  async createTimerTemplate(insertTemplate: InsertTimerTemplate): Promise<TimerTemplate> {
    const id = randomUUID();
    const template: TimerTemplate = {
      ...insertTemplate,
      id,
      createdAt: new Date(),
      pingEveryone: insertTemplate.pingEveryone ?? true,
      maxPings: insertTemplate.maxPings ?? 1,
      customMessage: insertTemplate.customMessage ?? null,
      priority: insertTemplate.priority ?? "normal",
    };
    
    this.timerTemplates.set(id, template);
    return template;
  }

  async getTimerTemplates(): Promise<TimerTemplate[]> {
    return Array.from(this.timerTemplates.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async deleteTimerTemplate(id: string): Promise<void> {
    this.timerTemplates.delete(id);
  }
}

export const storage = new MemStorage();

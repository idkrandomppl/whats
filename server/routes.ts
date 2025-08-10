import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { timerService } from "./services/timerService";
import { insertTimerSchema, insertWebhookSchema, insertTimerTemplateSchema, insertBatchTimersSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on("connection", (ws: WebSocket) => {
    console.log("Client connected to WebSocket");
    timerService.addWebSocketClient(ws);
    
    ws.on("message", async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === "get_timers") {
          const activeTimers = await storage.getActiveTimers();
          const timersWithRemaining = activeTimers.map(timer => ({
            ...timer,
            remainingMs: timerService.getRemainingTime(timer),
          }));
          
          ws.send(JSON.stringify({
            type: "timers_update",
            timers: timersWithRemaining,
          }));
        }
        
        if (data.type === "get_activities") {
          const activities = await storage.getRecentActivities();
          ws.send(JSON.stringify({
            type: "activities_update",
            activities,
          }));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
  });

  // Timer routes
  app.post("/api/timers", async (req, res) => {
    try {
      const timerData = insertTimerSchema.parse(req.body);
      const timer = await storage.createTimer(timerData);
      await timerService.startTimer(timer.id);
      res.json(timer);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.get("/api/timers", async (req, res) => {
    try {
      const activeTimers = await storage.getActiveTimers();
      const timersWithRemaining = activeTimers.map(timer => ({
        ...timer,
        remainingMs: timerService.getRemainingTime(timer),
      }));
      res.json(timersWithRemaining);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/timers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await timerService.cancelTimer(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Batch timer creation
  app.post("/api/timers/batch", async (req, res) => {
    try {
      const { timers: batchTimers } = insertBatchTimersSchema.parse(req.body);
      const createdTimers = [];
      
      for (const timerData of batchTimers) {
        const timer = await storage.createTimer(timerData);
        await timerService.startTimer(timer.id);
        createdTimers.push(timer);
      }

      // Create activity log for batch creation
      await storage.createActivity({
        type: "batch_created",
        message: `Created ${createdTimers.length} batch timers`,
        timerId: null,
      });

      res.json(createdTimers);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post("/api/webhooks/test", async (req, res) => {
    try {
      const { webhookUrl } = req.body;
      if (!webhookUrl) {
        return res.status(400).json({ error: "Webhook URL is required" });
      }
      
      const success = await timerService.testWebhook(webhookUrl);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getRecentActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Webhook routes
  app.post("/api/webhooks", async (req, res) => {
    try {
      const webhookData = insertWebhookSchema.parse(req.body);
      const webhook = await storage.createWebhook(webhookData);
      res.json(webhook);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.get("/api/webhooks", async (req, res) => {
    try {
      const webhooks = await storage.getWebhooks();
      res.json(webhooks);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/webhooks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertWebhookSchema.partial().parse(req.body);
      await storage.updateWebhook(id, updateData);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/webhooks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteWebhook(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Send custom message to webhook
  app.post("/api/webhooks/:id/send", async (req, res) => {
    try {
      const { id } = req.params;
      const { message, pingEveryone } = req.body;
      
      const webhook = await storage.getWebhook(id);
      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      const success = await timerService.sendCustomMessage(webhook.url, message, pingEveryone);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Timer template routes
  app.post("/api/templates", async (req, res) => {
    try {
      const templateData = insertTimerTemplateSchema.parse(req.body);
      const template = await storage.createTimerTemplate(templateData);
      res.json(template);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getTimerTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTimerTemplate(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Batch create multiple timers
  app.post("/api/timers/batch", async (req, res) => {
    try {
      const { timers: timerDataArray } = req.body;
      
      if (!Array.isArray(timerDataArray)) {
        return res.status(400).json({ error: "Expected array of timers" });
      }

      const createdTimers = [];
      for (const timerData of timerDataArray) {
        const validatedData = insertTimerSchema.parse(timerData);
        const timer = await storage.createTimer(validatedData);
        await timerService.startTimer(timer.id);
        createdTimers.push(timer);
      }

      res.json(createdTimers);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Initialize existing timers on server start
  timerService.initializeExistingTimers();

  return httpServer;
}

import { storage } from "../storage";
import { WebSocket } from "ws";

export class TimerService {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private wsClients: Set<WebSocket> = new Set();

  addWebSocketClient(ws: WebSocket) {
    this.wsClients.add(ws);
    ws.on("close", () => {
      this.wsClients.delete(ws);
    });
  }

  broadcast(data: any) {
    const message = JSON.stringify(data);
    this.wsClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  async startTimer(timerId: string) {
    const timer = await storage.getTimer(timerId);
    if (!timer) return;

    const timeUntilExpiry = timer.expiresAt.getTime() - Date.now();
    
    if (timeUntilExpiry <= 0) {
      await this.completeTimer(timerId);
      return;
    }

    const timeout = setTimeout(async () => {
      await this.completeTimer(timerId);
    }, timeUntilExpiry);

    this.timers.set(timerId, timeout);

    // Create activity
    await storage.createActivity({
      timerId,
      type: "created",
      message: `Timer "${timer.description}" started`,
    });

    this.broadcast({
      type: "timer_created",
      timer,
    });
  }

  async completeTimer(timerId: string) {
    const timer = await storage.getTimer(timerId);
    if (!timer) return;

    // Update timer status
    await storage.updateTimerStatus(timerId, "completed");

    // Send Discord webhook
    await this.sendDiscordWebhook(timer);

    // Create activity
    await storage.createActivity({
      timerId,
      type: "completed",
      message: `Timer "${timer.description}" completed`,
    });

    // Clean up timeout
    const timeout = this.timers.get(timerId);
    if (timeout) {
      clearTimeout(timeout);
      this.timers.delete(timerId);
    }

    this.broadcast({
      type: "timer_completed",
      timerId,
    });
  }

  async cancelTimer(timerId: string) {
    const timer = await storage.getTimer(timerId);
    if (!timer) return;

    // Update timer status
    await storage.updateTimerStatus(timerId, "cancelled");

    // Create activity
    await storage.createActivity({
      timerId,
      type: "cancelled",
      message: `Timer "${timer.description}" cancelled`,
    });

    // Clean up timeout
    const timeout = this.timers.get(timerId);
    if (timeout) {
      clearTimeout(timeout);
      this.timers.delete(timerId);
    }

    this.broadcast({
      type: "timer_cancelled",
      timerId,
    });
  }

  private async sendDiscordWebhook(timer: any) {
    try {
      const webhookPayload = {
        content: timer.pingEveryone ? "@everyone" : "",
        embeds: [
          {
            title: "⏰ Timer Expired!",
            description: `**${timer.description}**`,
            color: 0x5865f2, // Discord blue
            fields: [
              {
                name: "Duration",
                value: this.formatDuration(timer.durationSeconds),
                inline: true,
              },
              {
                name: "Started",
                value: new Date(timer.createdAt).toLocaleString(),
                inline: true,
              },
              {
                name: "Completed",
                value: new Date().toLocaleString(),
                inline: true,
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const response = await fetch(timer.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      });

      if (response.ok) {
        await storage.createActivity({
          timerId: timer.id,
          type: "webhook_sent",
          message: "Webhook sent successfully",
        });
      } else {
        throw new Error(`Webhook failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to send Discord webhook:", error);
      await storage.createActivity({
        timerId: timer.id,
        type: "webhook_failed",
        message: `Webhook failed: ${(error as Error).message}`,
      });
    }
  }

  async testWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const testPayload = {
        embeds: [
          {
            title: "🧪 Webhook Test",
            description: "This is a test message from Discord Timer",
            color: 0x00ff00, // Green
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      });

      return response.ok;
    } catch (error) {
      console.error("Webhook test failed:", error);
      return false;
    }
  }

  async sendCustomMessage(webhookUrl: string, message: string, pingEveryone: boolean = false): Promise<boolean> {
    try {
      const payload = {
        content: pingEveryone ? `@everyone\n${message}` : message,
        embeds: [
          {
            title: "📢 Custom Message",
            description: message,
            color: 0x5865f2, // Discord blue
            timestamp: new Date().toISOString(),
            footer: {
              text: "Sent via Discord Timer",
            },
          },
        ],
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (error) {
      console.error("Custom message send failed:", error);
      return false;
    }
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  async initializeExistingTimers() {
    const activeTimers = await storage.getActiveTimers();
    for (const timer of activeTimers) {
      await this.startTimer(timer.id);
    }
  }

  getRemainingTime(timer: any): number {
    return Math.max(0, timer.expiresAt.getTime() - Date.now());
  }
}

export const timerService = new TimerService();

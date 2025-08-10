import { useState } from "react";
import { TimerForm } from "@/components/timer-form";
import { AdvancedTimerForm } from "@/components/advanced-timer-form";
import { ActiveTimers } from "@/components/active-timers";
import { RecentActivity } from "@/components/recent-activity";
import { WebhookStatus } from "@/components/webhook-status";
import { WebhookManager } from "@/components/webhook-manager";
import { ThemeSelector } from "@/components/theme-selector";
import { TimezoneClock } from "@/components/timezone-clock";
import { EnhancedTimerFeatures } from "@/components/enhanced-timer-features";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWebSocket } from "@/hooks/use-websocket";

export default function Home() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [lastWebhookTest, setLastWebhookTest] = useState<Date | null>(null);
  const { isConnected } = useWebSocket();

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-discord p-2 rounded-lg">
                <i className="fas fa-clock text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Discord Timer Pro</h1>
                <p className="text-sm text-muted-foreground">Advanced webhook automation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeSelector />
              <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="timers" className="space-y-8">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="timers" className="flex items-center space-x-2">
              <i className="fas fa-clock text-sm"></i>
              <span>Timers</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center space-x-2">
              <i className="fas fa-rocket text-sm"></i>
              <span>Advanced</span>
            </TabsTrigger>
            <TabsTrigger value="quick" className="flex items-center space-x-2">
              <i className="fas fa-bolt text-sm"></i>
              <span>Quick</span>
            </TabsTrigger>
            <TabsTrigger value="timezone" className="flex items-center space-x-2">
              <i className="fas fa-globe text-sm"></i>
              <span>Clock</span>
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center space-x-2">
              <i className="fas fa-broadcast-tower text-sm"></i>
              <span>Webhooks</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center space-x-2">
              <i className="fas fa-history text-sm"></i>
              <span>Activity</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timers" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Basic Timer Form */}
              <div className="lg:col-span-1 space-y-6">
                <TimerForm 
                  webhookUrl={webhookUrl}
                  onWebhookUrlChange={setWebhookUrl}
                />
                
                <WebhookStatus 
                  webhookUrl={webhookUrl}
                  lastTest={lastWebhookTest}
                  onTest={setLastWebhookTest}
                />
              </div>
              
              {/* Right Column - Active Timers */}
              <div className="lg:col-span-2">
                <ActiveTimers />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Advanced Timer Form */}
              <div className="lg:col-span-1">
                <AdvancedTimerForm 
                  webhookUrl={webhookUrl}
                  onWebhookUrlChange={setWebhookUrl}
                />
              </div>
              
              {/* Right Column - Active Timers */}
              <div className="lg:col-span-2">
                <ActiveTimers />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quick">
            <EnhancedTimerFeatures />
          </TabsContent>

          <TabsContent value="timezone" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Timezone Clock */}
              <div className="lg:col-span-1">
                <TimezoneClock />
              </div>
              
              {/* Right Column - Active Timers */}
              <div className="lg:col-span-2">
                <ActiveTimers />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="webhooks">
            <WebhookManager />
          </TabsContent>

          <TabsContent value="activity">
            <RecentActivity />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

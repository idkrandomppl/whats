import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function EnhancedTimerFeatures() {
  const [quickTimers, setQuickTimers] = useState([
    { name: "Pomodoro Work", seconds: 1500, icon: "fas fa-brain" },
    { name: "Short Break", seconds: 300, icon: "fas fa-coffee" },
    { name: "Long Break", seconds: 900, icon: "fas fa-couch" },
    { name: "Daily Standup", seconds: 900, icon: "fas fa-users" },
    { name: "Code Review", seconds: 1800, icon: "fas fa-code" },
  ]);

  const [bulkCount, setBulkCount] = useState(5);
  const [intervalMinutes, setIntervalMinutes] = useState(15);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isCreatingBulk, setIsCreatingBulk] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createQuickTimerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/timers", data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Quick Timer Started",
        description: `${variables.description} timer is now active.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/timers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Start Timer",
        description: error.message || "Unable to create timer",
        variant: "destructive",
      });
    }
  });

  const createBulkTimersMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/timers/batch", data);
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Bulk Timers Created",
        description: `${result.length} interval timers have been started.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/timers"] });
      setIsCreatingBulk(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Bulk Timers",
        description: error.message || "Unable to create bulk timers",
        variant: "destructive",
      });
      setIsCreatingBulk(false);
    }
  });

  const handleQuickTimer = (timer: any) => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Missing Webhook URL",
        description: "Please enter a Discord webhook URL first.",
        variant: "destructive",
      });
      return;
    }

    createQuickTimerMutation.mutate({
      description: timer.name,
      durationSeconds: timer.seconds,
      webhookUrl: webhookUrl.trim(),
      pingEveryone: true,
      maxPings: 1,
      customMessage: `⏱️ ${timer.name} session completed!`,
      priority: "normal",
    });
  };

  const handleBulkTimers = () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Missing Webhook URL",
        description: "Please enter a Discord webhook URL first.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingBulk(true);
    const timers = [];
    const baseTime = intervalMinutes * 60; // Convert to seconds

    for (let i = 1; i <= bulkCount; i++) {
      timers.push({
        description: `Interval Timer #${i}`,
        durationSeconds: baseTime * i,
        webhookUrl: webhookUrl.trim(),
        pingEveryone: true,
        maxPings: 1,
        customMessage: `🔔 Interval ${i} of ${bulkCount} completed! (${intervalMinutes * i} minutes total)`,
        priority: "normal",
      });
    }

    createBulkTimersMutation.mutate({ timers });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Quick Timer Presets */}
      <Card className="gradient-bg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-bolt text-primary float-animation"></i>
            <span>Quick Timer Presets</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Discord Webhook URL</Label>
            <Input 
              type="url" 
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickTimers.map((timer, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleQuickTimer(timer)}
                disabled={createQuickTimerMutation.isPending}
                className="h-auto p-4 flex flex-col items-center space-y-2 glow-effect hover:glow-button rainbow-border"
              >
                <i className={`${timer.icon} text-lg text-primary`}></i>
                <div className="text-center">
                  <div className="font-medium">{timer.name}</div>
                  <Badge variant="secondary" className="mt-1">
                    {formatTime(timer.seconds)}
                  </Badge>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Interval Timers */}
      <Card className="gradient-bg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-layer-group text-primary sparkle-effect"></i>
            <span>Bulk Interval Timers</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create multiple timers that trigger at regular intervals. Perfect for reminders, check-ins, or progressive notifications.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Number of Timers: {bulkCount}
              </Label>
              <Slider
                value={[bulkCount]}
                onValueChange={(value) => setBulkCount(value[0])}
                max={20}
                min={2}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Will create {bulkCount} timers
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Interval: {intervalMinutes} minutes
              </Label>
              <Slider
                value={[intervalMinutes]}
                onValueChange={(value) => setIntervalMinutes(value[0])}
                max={60}
                min={5}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Timer {bulkCount} will trigger after {intervalMinutes * bulkCount} minutes
              </p>
            </div>
          </div>

          <div className="bg-accent/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Timeline Preview:</h4>
            <div className="space-y-1 text-sm">
              {Array.from({ length: Math.min(bulkCount, 5) }, (_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Badge variant="outline" className="w-16">
                    Timer {i + 1}
                  </Badge>
                  <span className="text-muted-foreground">
                    → {intervalMinutes * (i + 1)} minutes ({Math.floor(intervalMinutes * (i + 1) / 60) > 0 && `${Math.floor(intervalMinutes * (i + 1) / 60)}h `}{(intervalMinutes * (i + 1)) % 60}m)
                  </span>
                </div>
              ))}
              {bulkCount > 5 && (
                <div className="text-muted-foreground text-xs">
                  ... and {bulkCount - 5} more timers
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={handleBulkTimers}
            disabled={createBulkTimersMutation.isPending || !webhookUrl.trim()}
            className="w-full glow-button sparkle-effect"
          >
            <i className="fas fa-rocket mr-2"></i>
            {isCreatingBulk ? "Creating Timers..." : `Create ${bulkCount} Interval Timers`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

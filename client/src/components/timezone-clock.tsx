import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const TIMEZONES = [
  { value: "UTC", label: "UTC - Coordinated Universal Time" },
  { value: "America/New_York", label: "EST/EDT - Eastern Time" },
  { value: "America/Chicago", label: "CST/CDT - Central Time" },
  { value: "America/Denver", label: "MST/MDT - Mountain Time" },
  { value: "America/Los_Angeles", label: "PST/PDT - Pacific Time" },
  { value: "Europe/London", label: "GMT/BST - London" },
  { value: "Europe/Paris", label: "CET/CEST - Paris" },
  { value: "Europe/Berlin", label: "CET/CEST - Berlin" },
  { value: "Europe/Rome", label: "CET/CEST - Rome" },
  { value: "Asia/Tokyo", label: "JST - Japan" },
  { value: "Asia/Shanghai", label: "CST - China" },
  { value: "Asia/Kolkata", label: "IST - India" },
  { value: "Australia/Sydney", label: "AEST/AEDT - Sydney" },
];

export function TimezoneClock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTimezone, setSelectedTimezone] = useState("UTC");
  const [alarmTime, setAlarmTime] = useState("");
  const [alarmDescription, setAlarmDescription] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Detect user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const matchingTz = TIMEZONES.find(tz => tz.value === userTimezone);
    if (matchingTz) {
      setSelectedTimezone(userTimezone);
    }

    return () => clearInterval(timer);
  }, []);

  const createAlarmMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/timers", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Alarm Set",
        description: "Your alarm timer has been created successfully.",
      });
      setAlarmTime("");
      setAlarmDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/timers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Set Alarm",
        description: error.message || "Unable to create alarm timer",
        variant: "destructive",
      });
    }
  });

  const formatTimeInTimezone = (date: Date, timezone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  };

  const formatDateInTimezone = (date: Date, timezone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const handleSetAlarm = () => {
    if (!alarmTime || !alarmDescription.trim() || !webhookUrl.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all alarm details including webhook URL.",
        variant: "destructive",
      });
      return;
    }

    // Parse the alarm time
    const [hours, minutes] = alarmTime.split(':').map(Number);
    const alarmDate = new Date();
    
    // Convert to selected timezone
    const now = new Date();
    const currentTimeInTz = new Date(now.toLocaleString("en-US", { timeZone: selectedTimezone }));
    
    alarmDate.setHours(hours, minutes, 0, 0);
    
    // If alarm time has passed today, set it for tomorrow
    if (alarmDate <= currentTimeInTz) {
      alarmDate.setDate(alarmDate.getDate() + 1);
    }

    // Calculate duration in seconds
    const durationMs = alarmDate.getTime() - currentTimeInTz.getTime();
    const durationSeconds = Math.floor(durationMs / 1000);

    if (durationSeconds <= 0) {
      toast({
        title: "Invalid Time",
        description: "Please select a future time for the alarm.",
        variant: "destructive",
      });
      return;
    }

    createAlarmMutation.mutate({
      description: `🚨 Alarm: ${alarmDescription.trim()}`,
      durationSeconds,
      webhookUrl: webhookUrl.trim(),
      pingEveryone: true,
      maxPings: 1,
      customMessage: `⏰ Alarm Alert! ${alarmDescription.trim()}`,
      priority: "high",
      isAlarmTimer: true,
      alarmTime: alarmDate.toISOString(),
      userTimezone: selectedTimezone,
    });
  };

  const getTimezoneAbbreviation = (timezone: string) => {
    const tz = TIMEZONES.find(t => t.value === timezone);
    return tz?.label.split(' - ')[0] || timezone;
  };

  return (
    <Card className="bg-card border-border gradient-bg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <i className="fas fa-globe-americas text-primary float-animation"></i>
          <span>World Clock & Alarms</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Time Display */}
        <div className="text-center p-6 bg-accent rounded-lg glow-effect">
          <div className="text-3xl font-mono font-bold text-primary mb-2">
            {formatTimeInTimezone(currentTime, selectedTimezone)}
          </div>
          <div className="text-sm text-muted-foreground mb-1">
            {formatDateInTimezone(currentTime, selectedTimezone)}
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            {getTimezoneAbbreviation(selectedTimezone)}
          </div>
        </div>

        {/* Timezone Selector */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Select Timezone</Label>
          <Select onValueChange={setSelectedTimezone} value={selectedTimezone}>
            <SelectTrigger>
              <SelectValue placeholder="Choose your timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Alarm Creator */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4 flex items-center space-x-2">
            <i className="fas fa-bell text-primary"></i>
            <span>Set Alarm</span>
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Alarm Description</Label>
              <Input 
                type="text" 
                placeholder="e.g. Meeting with team"
                value={alarmDescription}
                onChange={(e) => setAlarmDescription(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Alarm Time</Label>
              <Input 
                type="time" 
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Time will be set in {getTimezoneAbbreviation(selectedTimezone)}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Discord Webhook URL</Label>
              <Input 
                type="url" 
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleSetAlarm}
              disabled={createAlarmMutation.isPending}
              className="w-full glow-button sparkle-effect"
            >
              <i className="fas fa-alarm-clock mr-2"></i>
              {createAlarmMutation.isPending ? "Setting Alarm..." : "Set Alarm"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

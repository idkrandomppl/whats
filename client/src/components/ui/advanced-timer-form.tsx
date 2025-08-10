import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Webhook, TimerTemplate } from "@shared/schema";

interface AdvancedTimerFormProps {
  webhookUrl: string;
  onWebhookUrlChange: (url: string) => void;
}

export function AdvancedTimerForm({ webhookUrl, onWebhookUrlChange }: AdvancedTimerFormProps) {
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [pingEveryone, setPingEveryone] = useState(true);
  const [maxPings, setMaxPings] = useState(1);
  const [customMessage, setCustomMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [timerCount, setTimerCount] = useState(1);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch saved webhooks for dropdown
  const { data: webhooks = [] } = useQuery<Webhook[]>({
    queryKey: ["/api/webhooks"],
  });

  // Fetch timer templates
  const { data: templates = [] } = useQuery<TimerTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const createTimerMutation = useMutation({
    mutationFn: async (data: any) => {
      if (timerCount === 1) {
        const response = await apiRequest("POST", "/api/timers", data);
        return response.json();
      } else {
        const timers = Array(timerCount).fill(null).map((_, index) => ({
          ...data,
          description: `${data.description} ${index + 1}`,
        }));
        const response = await apiRequest("POST", "/api/timers/batch", { timers });
        return response.json();
      }
    },
    onSuccess: (result) => {
      const count = Array.isArray(result) ? result.length : 1;
      toast({
        title: `${count} Timer${count > 1 ? 's' : ''} Created`,
        description: `Your timer${count > 1 ? 's have' : ' has'} been started successfully.`,
      });
      // Reset form
      setDescription("");
      setHours(0);
      setMinutes(0);
      setSeconds(0);
      setCustomMessage("");
      setTimerCount(1);
      // Invalidate queries to refresh timer list
      queryClient.invalidateQueries({ queryKey: ["/api/timers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create timer(s)",
        variant: "destructive",
      });
    }
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await apiRequest("POST", "/api/templates", templateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Saved",
        description: "Timer template has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    
    if (totalSeconds === 0) {
      toast({
        title: "Invalid Duration",
        description: "Please set a duration greater than 0 seconds",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Missing Description",
        description: "Please enter a description for your timer",
        variant: "destructive",
      });
      return;
    }

    if (!webhookUrl.trim()) {
      toast({
        title: "Missing Webhook URL",
        description: "Please enter a Discord webhook URL",
        variant: "destructive",
      });
      return;
    }

    if (timerCount < 1 || timerCount > 50) {
      toast({
        title: "Invalid Timer Count",
        description: "Please enter a timer count between 1 and 50",
        variant: "destructive",
      });
      return;
    }

    createTimerMutation.mutate({
      description: description.trim(),
      durationSeconds: totalSeconds,
      webhookUrl: webhookUrl.trim(),
      pingEveryone,
      maxPings,
      customMessage: customMessage.trim() || null,
      priority,
    });
  };

  const handleSaveTemplate = () => {
    if (!description.trim()) {
      toast({
        title: "Missing Description",
        description: "Please enter a description to save as template",
        variant: "destructive",
      });
      return;
    }

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds === 0) {
      toast({
        title: "Invalid Duration",
        description: "Please set a duration greater than 0 seconds",
        variant: "destructive",
      });
      return;
    }

    saveTemplateMutation.mutate({
      name: description.trim(),
      description: description.trim(),
      durationSeconds: totalSeconds,
      pingEveryone,
      maxPings,
      customMessage: customMessage.trim() || null,
      priority,
    });
  };

  const loadTemplate = (template: TimerTemplate) => {
    setDescription(template.description);
    setHours(Math.floor(template.durationSeconds / 3600));
    setMinutes(Math.floor((template.durationSeconds % 3600) / 60));
    setSeconds(template.durationSeconds % 60);
    setPingEveryone(template.pingEveryone);
    setMaxPings(template.maxPings);
    setCustomMessage(template.customMessage || "");
    setPriority(template.priority);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high": return "text-red-600";
      case "normal": return "text-blue-600";
      case "low": return "text-gray-600";
      default: return "text-blue-600";
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <i className="fas fa-rocket text-primary"></i>
            <h2 className="text-lg font-semibold">Advanced Timer</h2>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(priority)}`}>
            {priority.toUpperCase()} PRIORITY
          </div>
        </div>

        {templates.length > 0 && (
          <div className="mb-6">
            <Label className="text-sm font-medium mb-2 block">Quick Templates</Label>
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate(template)}
                  className="text-xs"
                >
                  {template.name}
                </Button>
              ))}
            </div>
            <Separator className="mt-4" />
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Timer Description</Label>
            <Input 
              type="text" 
              placeholder="e.g. Team meeting reminder"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm font-medium mb-2 block">Hours</Label>
              <Input 
                type="number" 
                min="0" 
                max="23" 
                value={hours || ""}
                onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                className="text-center"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Minutes</Label>
              <Input 
                type="number" 
                min="0" 
                max="59" 
                value={minutes || ""}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                className="text-center"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Seconds</Label>
              <Input 
                type="number" 
                min="0" 
                max="59" 
                value={seconds || ""}
                onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
                className="text-center"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium mb-2 block">Discord Webhook</Label>
            {webhooks.length > 0 ? (
              <Select onValueChange={onWebhookUrlChange} value={webhookUrl}>
                <SelectTrigger>
                  <SelectValue placeholder="Select saved webhook or enter URL" />
                </SelectTrigger>
                <SelectContent>
                  {webhooks.map((webhook) => (
                    <SelectItem key={webhook.id} value={webhook.url}>
                      {webhook.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input 
                type="url" 
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => onWebhookUrlChange(e.target.value)}
                required
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Priority Level</Label>
              <Select onValueChange={setPriority} value={priority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low Priority</SelectItem>
                  <SelectItem value="normal">🟡 Normal Priority</SelectItem>
                  <SelectItem value="high">🔴 High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">Number of Timers</Label>
              <Input 
                type="number" 
                min="1" 
                max="50" 
                value={timerCount}
                onChange={(e) => setTimerCount(parseInt(e.target.value) || 1)}
                className="text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="ping-everyone" 
                checked={pingEveryone}
                onCheckedChange={(checked) => setPingEveryone(!!checked)}
              />
              <Label htmlFor="ping-everyone" className="text-sm">
                Ping @everyone
              </Label>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">Max Pings per Timer</Label>
              <Input 
                type="number" 
                min="1" 
                max="10" 
                value={maxPings}
                onChange={(e) => setMaxPings(parseInt(e.target.value) || 1)}
                className="text-center"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Custom Message (Optional)</Label>
            <Textarea 
              placeholder="Add a custom message to include with the notification..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex space-x-2">
            <Button 
              type="submit" 
              disabled={createTimerMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <i className="fas fa-play mr-2"></i>
              {createTimerMutation.isPending ? "Creating..." : `Start ${timerCount > 1 ? `${timerCount} ` : ''}Timer${timerCount > 1 ? 's' : ''}`}
            </Button>
            
            <Button 
              type="button" 
              variant="outline"
              onClick={handleSaveTemplate}
              disabled={saveTemplateMutation.isPending}
            >
              <i className="fas fa-bookmark mr-2"></i>
              Save Template
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

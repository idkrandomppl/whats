import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TimerFormProps {
  webhookUrl: string;
  onWebhookUrlChange: (url: string) => void;
}

export function TimerForm({ webhookUrl, onWebhookUrlChange }: TimerFormProps) {
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [pingEveryone, setPingEveryone] = useState(true);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTimerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/timers", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Timer Created",
        description: "Your timer has been started successfully and webhook is ready.",
      });
      // Reset form
      setDescription("");
      setHours(0);
      setMinutes(0);
      setSeconds(0);
      // Invalidate queries to refresh timer list
      queryClient.invalidateQueries({ queryKey: ["/api/timers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create timer",
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

    createTimerMutation.mutate({
      description: description.trim(),
      durationSeconds: totalSeconds,
      webhookUrl: webhookUrl.trim(),
      pingEveryone,
    });
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <i className="fas fa-plus-circle text-blue-500"></i>
          <h2 className="text-lg font-semibold text-slate-900">Create Timer</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-2">
              Timer Description
            </Label>
            <Input 
              type="text" 
              placeholder="e.g. Team meeting reminder"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Hours</Label>
              <Input 
                type="number" 
                min="0" 
                max="23" 
                placeholder="0"
                value={hours || ""}
                onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-center"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Minutes</Label>
              <Input 
                type="number" 
                min="0" 
                max="59" 
                placeholder="0"
                value={minutes || ""}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-center"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Seconds</Label>
              <Input 
                type="number" 
                min="0" 
                max="59" 
                placeholder="0"
                value={seconds || ""}
                onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-center"
              />
            </div>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-2">
              Discord Webhook URL
            </Label>
            <Input 
              type="url" 
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookUrl}
              onChange={(e) => onWebhookUrlChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Get this from your Discord server settings</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="ping-everyone" 
              checked={pingEveryone}
              onCheckedChange={(checked) => setPingEveryone(!!checked)}
            />
            <Label htmlFor="ping-everyone" className="text-sm text-slate-700">
              Ping @everyone when timer expires
            </Label>
          </div>
          
          <Button 
            type="submit" 
            disabled={createTimerMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
          >
            <i className="fas fa-play mr-2"></i>
            {createTimerMutation.isPending ? "Creating..." : "Start Timer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WebhookStatusProps {
  webhookUrl: string;
  lastTest: Date | null;
  onTest: (date: Date) => void;
}

export function WebhookStatus({ webhookUrl, lastTest, onTest }: WebhookStatusProps) {
  const [webhookStatus, setWebhookStatus] = useState<"unknown" | "connected" | "failed">("unknown");
  const { toast } = useToast();

  const testWebhookMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/webhooks/test", {
        webhookUrl
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setWebhookStatus("connected");
        onTest(new Date());
        toast({
          title: "Webhook Test Successful",
          description: "Your Discord webhook is working correctly!",
        });
      } else {
        setWebhookStatus("failed");
        toast({
          title: "Webhook Test Failed",
          description: "Unable to send test message to Discord webhook",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      setWebhookStatus("failed");
      toast({
        title: "Webhook Test Error",
        description: error.message || "Failed to test webhook",
        variant: "destructive",
      });
    }
  });

  const handleTestWebhook = () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Missing Webhook URL",
        description: "Please enter a Discord webhook URL first",
        variant: "destructive",
      });
      return;
    }

    testWebhookMutation.mutate();
  };

  const formatLastTest = (date: Date | null): string => {
    if (!date) return "Never";
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = () => {
    switch (webhookStatus) {
      case "connected":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = () => {
    switch (webhookStatus) {
      case "connected":
        return "Connected";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  const getStatusDot = () => {
    switch (webhookStatus) {
      case "connected":
        return "bg-green-400";
      case "failed":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-200 mt-6">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <i className="fab fa-discord text-discord"></i>
          <h3 className="text-lg font-semibold text-slate-900">Webhook Status</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Connection</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDot()}`}></div>
              {getStatusText()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Last Test</span>
            <span className="text-xs text-slate-500">{formatLastTest(lastTest)}</span>
          </div>
          <Button 
            onClick={handleTestWebhook}
            disabled={testWebhookMutation.isPending || !webhookUrl.trim()}
            className="w-full text-discord border border-discord bg-transparent hover:bg-discord hover:text-white transition-colors text-sm font-medium"
            variant="outline"
          >
            <i className="fas fa-flask mr-2"></i>
            {testWebhookMutation.isPending ? "Testing..." : "Test Webhook"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

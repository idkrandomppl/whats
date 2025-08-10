import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect, useState } from "react";

interface Timer {
  id: string;
  description: string;
  durationSeconds: number;
  webhookUrl: string;
  pingEveryone: boolean;
  status: string;
  createdAt: string;
  expiresAt: string;
  remainingMs: number;
}

export function ActiveTimers() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();

  const { data: fetchedTimers, isLoading } = useQuery({
    queryKey: ["/api/timers"],
    refetchInterval: 1000, // Refresh every second for countdown
  });

  useEffect(() => {
    if (fetchedTimers && Array.isArray(fetchedTimers)) {
      setTimers(fetchedTimers);
    }
  }, [fetchedTimers]);

  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage);
      
      if (data.type === "timers_update") {
        setTimers(data.timers);
      } else if (data.type === "timer_completed") {
        queryClient.invalidateQueries({ queryKey: ["/api/timers"] });
        queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      } else if (data.type === "timer_cancelled") {
        queryClient.invalidateQueries({ queryKey: ["/api/timers"] });
        queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      }
    }
  }, [lastMessage, queryClient]);

  const cancelTimerMutation = useMutation({
    mutationFn: async (timerId: string) => {
      const response = await apiRequest("DELETE", `/api/timers/${timerId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Timer Cancelled",
        description: "Timer has been cancelled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/timers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel timer",
        variant: "destructive",
      });
    }
  });

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (timer: Timer): number => {
    const totalMs = timer.durationSeconds * 1000;
    const elapsedMs = totalMs - timer.remainingMs;
    return Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
  };

  const getTimerVariant = (timer: Timer) => {
    const remainingMs = timer.remainingMs;
    if (remainingMs < 300000) { // Less than 5 minutes
      return "warning";
    }
    return "active";
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-slate-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <i className="fas fa-stopwatch text-green-500"></i>
            <h2 className="text-lg font-semibold text-slate-900">Active Timers</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {timers?.length || 0}
            </span>
          </div>
          <button 
            className="text-slate-400 hover:text-slate-600 transition-colors"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/timers"] })}
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
        
        {timers && timers.length > 0 ? (
          <div className="space-y-4">
            {timers.map((timer) => {
              const variant = getTimerVariant(timer);
              const progress = getProgressPercentage(timer);
              
              return (
                <div 
                  key={timer.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    variant === "warning" 
                      ? "border-amber-200 bg-amber-50" 
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full animate-pulse ${
                        variant === "warning" ? "bg-amber-500" : "bg-green-500"
                      }`}></div>
                      <h3 className="font-medium text-slate-900">{timer.description}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        variant === "warning" 
                          ? "bg-amber-100 text-amber-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {variant === "warning" ? "Ending Soon" : "Active"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelTimerMutation.mutate(timer.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                        disabled={cancelTimerMutation.isPending}
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    </div>
                  </div>
                  
                  <div className={`rounded-lg p-4 mb-3 ${
                    variant === "warning" ? "bg-white" : "bg-slate-50"
                  }`}>
                    <div className="text-center">
                      <div className={`text-3xl font-mono font-bold mb-1 ${
                        variant === "warning" ? "text-amber-600" : "text-slate-900"
                      }`}>
                        {formatTime(timer.remainingMs)}
                      </div>
                      <div className="text-sm text-slate-500">Time remaining</div>
                    </div>
                    <div className="mt-3 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          variant === "warning" ? "bg-amber-500" : "bg-green-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <div className="flex items-center space-x-4">
                      <span>
                        <i className="fas fa-clock mr-1"></i>
                        Started: {formatDateTime(timer.createdAt)}
                      </span>
                      <span>
                        <i className="fas fa-flag-checkered mr-1"></i>
                        Ends: {formatDateTime(timer.expiresAt)}
                      </span>
                    </div>
                    <span className="flex items-center">
                      <i className="fab fa-discord text-discord mr-1"></i>
                      Webhook ready
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-clock text-slate-400 text-2xl"></i>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No active timers</h3>
            <p className="text-slate-500 mb-4">Create your first timer to get started with webhook notifications.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

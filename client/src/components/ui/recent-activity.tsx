import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect, useState } from "react";

interface Activity {
  id: string;
  timerId: string;
  type: string;
  message: string;
  createdAt: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const { lastMessage } = useWebSocket();

  const { data: fetchedActivities, isLoading } = useQuery({
    queryKey: ["/api/activities"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (fetchedActivities && Array.isArray(fetchedActivities)) {
      setActivities(fetchedActivities);
    }
  }, [fetchedActivities]);

  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage);
      
      if (data.type === "activities_update") {
        setActivities(data.activities);
      }
    }
  }, [lastMessage]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "created":
        return "fas fa-play text-blue-600";
      case "completed":
        return "fas fa-check text-green-600";
      case "cancelled":
        return "fas fa-times text-red-600";
      case "webhook_sent":
        return "fas fa-paper-plane text-discord";
      case "webhook_failed":
        return "fas fa-exclamation-triangle text-red-600";
      default:
        return "fas fa-info text-slate-600";
    }
  };

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case "created":
        return "bg-blue-100";
      case "completed":
        return "bg-green-100";
      case "cancelled":
        return "bg-red-100";
      case "webhook_sent":
        return "bg-purple-100";
      case "webhook_failed":
        return "bg-red-100";
      default:
        return "bg-slate-100";
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200 mt-6">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-200 mt-6">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <i className="fas fa-history text-slate-400"></i>
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
        </div>
        
        {activities && activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityBgColor(activity.type)}`}>
                  <i className={`${getActivityIcon(activity.type)} text-sm`}></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                  <p className="text-xs text-slate-500">
                    {formatTimeAgo(activity.createdAt)}
                    {activity.type === "webhook_sent" && " • Webhook sent successfully"}
                    {activity.type === "webhook_failed" && " • Webhook delivery failed"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-history text-slate-400"></i>
            </div>
            <p className="text-slate-500">No recent activity</p>
          </div>
        )}
        
        {activities && activities.length > 0 && (
          <button className="w-full mt-4 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium py-2">
            View all activity
            <i className="fas fa-chevron-right ml-1"></i>
          </button>
        )}
      </CardContent>
    </Card>
  );
}

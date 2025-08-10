import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Webhook } from "@shared/schema";

export function WebhookManager() {
  const [selectedWebhook, setSelectedWebhook] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [pingEveryone, setPingEveryone] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookDescription, setNewWebhookDescription] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: webhooks = [], isLoading } = useQuery<Webhook[]>({
    queryKey: ["/api/webhooks"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ webhookId, message, pingEveryone }: any) => {
      const response = await apiRequest("POST", `/api/webhooks/${webhookId}/send`, {
        message,
        pingEveryone,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your custom message has been sent successfully.",
      });
      setCustomMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Message",
        description: error.message || "Unable to send message via webhook",
        variant: "destructive",
      });
    }
  });

  const addWebhookMutation = useMutation({
    mutationFn: async (webhookData: any) => {
      const response = await apiRequest("POST", "/api/webhooks", webhookData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Webhook Added",
        description: "New webhook has been saved successfully.",
      });
      setNewWebhookName("");
      setNewWebhookUrl("");
      setNewWebhookDescription("");
      setShowAddDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Webhook",
        description: error.message || "Unable to save webhook",
        variant: "destructive",
      });
    }
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      const response = await apiRequest("DELETE", `/api/webhooks/${webhookId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Webhook Deleted",
        description: "Webhook has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      setSelectedWebhook("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Webhook",
        description: error.message || "Unable to delete webhook",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = () => {
    if (!selectedWebhook) {
      toast({
        title: "No Webhook Selected",
        description: "Please select a webhook to send the message to.",
        variant: "destructive",
      });
      return;
    }

    if (!customMessage.trim()) {
      toast({
        title: "Empty Message",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      webhookId: selectedWebhook,
      message: customMessage.trim(),
      pingEveryone,
    });
  };

  const handleAddWebhook = () => {
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both webhook name and URL.",
        variant: "destructive",
      });
      return;
    }

    addWebhookMutation.mutate({
      name: newWebhookName.trim(),
      url: newWebhookUrl.trim(),
      description: newWebhookDescription.trim() || null,
      isActive: true,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Webhook Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-broadcast-tower text-primary"></i>
            <span>Manage Webhooks</span>
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <i className="fas fa-plus mr-2"></i>
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Webhook</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="webhook-name">Webhook Name</Label>
                  <Input
                    id="webhook-name"
                    placeholder="e.g. Main Discord Server"
                    value={newWebhookName}
                    onChange={(e) => setNewWebhookName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="webhook-description">Description (Optional)</Label>
                  <Textarea
                    id="webhook-description"
                    placeholder="Brief description of this webhook..."
                    value={newWebhookDescription}
                    onChange={(e) => setNewWebhookDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleAddWebhook} 
                    disabled={addWebhookMutation.isPending}
                    className="flex-1"
                  >
                    {addWebhookMutation.isPending ? "Adding..." : "Add Webhook"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-broadcast-tower text-muted-foreground"></i>
              </div>
              <p className="text-muted-foreground mb-4">No webhooks configured</p>
              <Button variant="outline" onClick={() => setShowAddDialog(true)}>
                <i className="fas fa-plus mr-2"></i>
                Add Your First Webhook
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                    selectedWebhook === webhook.id ? "border-primary bg-accent" : "border-border"
                  }`}
                  onClick={() => setSelectedWebhook(webhook.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{webhook.name}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWebhookMutation.mutate(webhook.id);
                      }}
                      disabled={deleteWebhookMutation.isPending}
                      className="h-6 w-6 p-0 hover:text-destructive"
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </Button>
                  </div>
                  {webhook.description && (
                    <p className="text-xs text-muted-foreground mb-2">{webhook.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      webhook.isActive 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    }`}>
                      {webhook.isActive ? "Active" : "Inactive"}
                    </span>
                    {selectedWebhook === webhook.id && (
                      <i className="fas fa-check text-primary"></i>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Custom Message */}
      {selectedWebhook && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-paper-plane text-primary"></i>
              <span>Send Custom Message</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="custom-message">Message</Label>
              <Textarea
                id="custom-message"
                placeholder="Enter your custom message here..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Message will be sent to: {webhooks.find((w) => w.id === selectedWebhook)?.name}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="ping-everyone-custom" 
                checked={pingEveryone}
                onCheckedChange={(checked) => setPingEveryone(!!checked)}
              />
              <Label htmlFor="ping-everyone-custom" className="text-sm">
                Include @everyone ping
              </Label>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending || !customMessage.trim()}
                className="flex-1"
              >
                <i className="fas fa-paper-plane mr-2"></i>
                {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setCustomMessage("");
                  setPingEveryone(false);
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

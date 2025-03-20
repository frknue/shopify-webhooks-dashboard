import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface CreateWebhookDialogProps {
  onWebhookCreated: () => void;
}

const SHOPIFY_WEBHOOK_TOPICS = [
  "orders/create",
  "orders/updated",
  "orders/cancelled",
  "orders/fulfilled",
  "orders/paid",
  "orders/partially_fulfilled",
  "orders/edited",
  "products/create",
  "products/update",
  "products/delete",
  "variants/in_stock",
  "variants/out_of_stock",
  "customers/create",
  "customers/update",
  "customers/delete",
  "customers/enable",
  "customers/disable",
  "inventory_levels/update",
  "inventory_levels/connect",
  "inventory_levels/disconnect",
  "inventory_items/create",
  "inventory_items/update",
  "inventory_items/delete",
  "fulfillments/create",
  "fulfillments/update",
  "refunds/create",
  "collections/create",
  "collections/update",
  "collections/delete",
  "app/uninstalled",
  "app/scopes_update",
  "shop/update",
];

const WEBHOOK_FORMATS = ["json", "xml"] as const;

export function CreateWebhookDialog({
  onWebhookCreated,
}: CreateWebhookDialogProps) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [format, setFormat] =
    useState<(typeof WEBHOOK_FORMATS)[number]>("json");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address,
            format,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create webhook: ${response.statusText}`);
      }

      setOpen(false);
      onWebhookCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Webhook</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Webhook</DialogTitle>
          <DialogDescription>
            Create a new webhook to receive notifications from Shopify.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="topic" className="text-sm font-medium">
                Topic
              </label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {SHOPIFY_WEBHOOK_TOPICS.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="address" className="text-sm font-medium">
                Webhook URL
              </label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="https://your-domain.com/webhook"
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="format" className="text-sm font-medium">
                Format
              </label>
              <Select
                value={format}
                onValueChange={(value: (typeof WEBHOOK_FORMATS)[number]) =>
                  setFormat(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {WEBHOOK_FORMATS.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Webhook"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

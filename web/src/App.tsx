import { CreateWebhookDialog } from "@/components/CreateWebhookDialog";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

interface Webhook {
  id: number;
  address: string;
  topic: string;
  created_at: string;
  updated_at: string;
  format: string;
  // Add other fields as needed
}

interface PaginationLinks {
  next?: string;
  previous?: string;
}

function App() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [darkMode, setDarkMode] = useState<boolean>(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [currentPageInfo, setCurrentPageInfo] = useState<string>("");
  const [paginationLinks, setPaginationLinks] = useState<PaginationLinks>({});

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const parseLinkHeader = (header: string): PaginationLinks => {
    const links: PaginationLinks = {};
    const parts = header.split(", ");

    parts.forEach((part) => {
      const match = part.match(
        /<.*[?&]page_info=([^&>]*?)>;\s*rel="(next|previous)"/
      );
      if (match) {
        const [, pageInfo, rel] = match;
        links[rel as keyof PaginationLinks] = pageInfo;
      }
    });

    return links;
  };

  const fetchWebhooks = (pageInfo?: string) => {
    setLoading(true);
    const url = pageInfo
      ? `/api/webhooks?limit=50&page_info=${pageInfo}`
      : "/api/webhooks?limit=50";

    fetch(url)
      .then((res) => {
        // Extract and parse Link header
        const linkHeader = res.headers.get("Link");
        if (linkHeader) {
          setPaginationLinks(parseLinkHeader(linkHeader));
        } else {
          setPaginationLinks({});
        }

        if (!res.ok) {
          throw new Error(`Error fetching webhooks: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        setWebhooks(data.webhooks || []);
        setCurrentPageInfo(pageInfo || "");
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  const deleteWebhook = async (id: number) => {
    if (!confirm(`Are you sure you want to delete webhook ${id}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete webhook: ${response.statusText}`);
      }

      // Refresh the webhooks list after successful deletion
      fetchWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  return (
    <div className="container mx-auto p-8 min-h-screen bg-white dark:bg-gray-900 dark:text-white transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Shopify Webhooks Dashboard</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-full"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>

      {loading && (
        <p className="text-gray-600 dark:text-gray-400">Loading webhooks...</p>
      )}
      {error && <p className="text-destructive">{error}</p>}
      {!loading && !error && (
        <>
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => fetchWebhooks()}>
              Refresh
            </Button>
            <CreateWebhookDialog onWebhookCreated={fetchWebhooks} />
            <span className="text-sm text-muted-foreground">
              Showing {webhooks.length} entries
            </span>
          </div>

          <div className="rounded-md border dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 dark:bg-gray-800 border-b dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">Topic</th>
                  <th className="text-left py-3 px-4 font-medium">Address</th>
                  <th className="text-left py-3 px-4 font-medium">Format</th>
                  <th className="text-left py-3 px-4 font-medium">Created</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-4 px-4 text-center text-muted-foreground dark:text-gray-400"
                    >
                      No webhooks found
                    </td>
                  </tr>
                ) : (
                  webhooks.map((wh) => (
                    <tr
                      key={wh.id}
                      className="border-b dark:border-gray-700 hover:bg-muted/50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-xs">{wh.id}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-500/30">
                          {wh.topic}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs break-all">
                        {wh.address}
                      </td>
                      <td className="py-3 px-4">{wh.format}</td>
                      <td className="py-3 px-4 text-muted-foreground dark:text-gray-400">
                        {new Date(wh.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteWebhook(wh.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => fetchWebhooks(paginationLinks.previous)}
                    aria-disabled={!paginationLinks.previous}
                    className={
                      !paginationLinks.previous
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => fetchWebhooks(paginationLinks.next)}
                    aria-disabled={!paginationLinks.next}
                    className={
                      !paginationLinks.next
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}
    </div>
  );
}

export default App;

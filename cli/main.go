package main

import (
	"bytes"
	"embed"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"

	"github.com/pkg/browser"
)

//go:embed dist/*
var staticFiles embed.FS

var (
	store      string
	apiKey     string
	apiVersion = "2024-10"
)

func main() {
	// Parse command-line flags
	flag.StringVar(&store, "store", "", "Shopify store domain (e.g., mystore.myshopify.com)")
	flag.StringVar(&apiKey, "api-key", "", "Shopify API key")
	flag.Parse()

	if store == "" || apiKey == "" {
		fmt.Println("Usage: shopify-webhooks-dashboard --store <store> --api-key <api-key>")
		os.Exit(1)
	}

	// Define the port to serve the React app
	port := "3000"
	baseURL := fmt.Sprintf("http://localhost:%s", port)

	// Serve the embedded static files
	subFS, err := fs.Sub(staticFiles, "dist")
	if err != nil {
		log.Fatalf("Failed to create sub filesystem: %v", err)
	}
	http.Handle("/", http.FileServer(http.FS(subFS)))

	// API endpoint: Proxy to Shopify's webhooks API using the stored API key
	http.HandleFunc("/api/webhooks", func(w http.ResponseWriter, r *http.Request) {
		// Handle POST request for creating webhooks
		if r.Method == "POST" {
			// Read the request body
			body, err := io.ReadAll(r.Body)
			if err != nil {
				log.Printf("Error reading request body: %v", err)
				http.Error(w, "Failed to read request body", http.StatusBadRequest)
				return
			}
			defer r.Body.Close()

			// Log the incoming request body
			log.Printf("Incoming request body: %s", string(body))

			// Construct Shopify URL
			shopifyURL := fmt.Sprintf("https://%s/admin/api/%s/webhooks.json", store, apiVersion)
			log.Printf("Creating webhook: %s", shopifyURL)

			// Create new request to Shopify
			req, err := http.NewRequest("POST", shopifyURL, bytes.NewBuffer(body))
			if err != nil {
				log.Printf("Error creating request: %v", err)
				http.Error(w, "Failed to create request", http.StatusInternalServerError)
				return
			}

			// Set headers
			req.Header.Set("X-Shopify-Access-Token", apiKey)
			req.Header.Set("Content-Type", "application/json")

			// Log request headers
			log.Printf("Request headers: %+v", req.Header)

			// Send request to Shopify
			client := &http.Client{}
			resp, err := client.Do(req)
			if err != nil {
				log.Printf("Error making request to Shopify: %v", err)
				http.Error(w, "Failed to create webhook", http.StatusInternalServerError)
				return
			}
			defer resp.Body.Close()

			// Log response status and headers
			log.Printf("Shopify response status: %s", resp.Status)
			log.Printf("Shopify response headers: %+v", resp.Header)

			// Read response body
			respBody, err := io.ReadAll(resp.Body)
			if err != nil {
				log.Printf("Error reading response body: %v", err)
				http.Error(w, "Failed to read response", http.StatusInternalServerError)
				return
			}

			// Log response body
			log.Printf("Shopify response body: %s", string(respBody))

			// Forward the response to the client
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(resp.StatusCode)
			w.Write(respBody)
			return
		}

		// Handle GET request for listing webhooks
		if r.Method == "GET" {
			// Get pagination parameters from the request
			limit := r.URL.Query().Get("limit")
			pageInfo := r.URL.Query().Get("page_info")

			// Construct Shopify URL with pagination parameters
			shopifyURL := fmt.Sprintf("https://%s/admin/api/%s/webhooks.json", store, apiVersion)
			if limit != "" {
				shopifyURL += "?limit=" + limit
				if pageInfo != "" {
					shopifyURL += "&page_info=" + pageInfo
				}
			} else if pageInfo != "" {
				shopifyURL += "?page_info=" + pageInfo
			}

			log.Printf("Making request to Shopify API: %s", shopifyURL)

			req, err := http.NewRequest("GET", shopifyURL, nil)
			if err != nil {
				log.Printf("Error creating request: %v", err)
				http.Error(w, "Failed to create request", http.StatusInternalServerError)
				return
			}
			req.Header.Set("X-Shopify-Access-Token", apiKey)
			req.Header.Set("Content-Type", "application/json")

			client := &http.Client{}
			resp, err := client.Do(req)
			if err != nil {
				log.Printf("Error making request to Shopify: %v", err)
				http.Error(w, "Failed to fetch webhooks", http.StatusInternalServerError)
				return
			}
			defer resp.Body.Close()

			// Read and log the response body
			bodyBytes, err := io.ReadAll(resp.Body)
			if err != nil {
				log.Printf("Error reading response body: %v", err)
				http.Error(w, "Failed to read response", http.StatusInternalServerError)
				return
			}

			// Re-create a new reader from the bytes for forwarding to client
			responseBody := bytes.NewReader(bodyBytes)

			// Forward Link header for pagination
			if linkHeader := resp.Header.Get("Link"); linkHeader != "" {
				w.Header().Set("Link", linkHeader)
			}

			// Forward the response from Shopify to the client
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(resp.StatusCode)
			io.Copy(w, responseBody)
			return
		}

		// Handle unsupported methods
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})

	// API endpoint for DELETE requests to delete a specific webhook
	http.HandleFunc("/api/webhooks/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "DELETE" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Extract webhook ID from the URL path
		// The URL will be like /api/webhooks/4759306
		path := r.URL.Path
		// Skip the "/api/webhooks/" prefix to get the ID
		webhookID := path[len("/api/webhooks/"):]

		if webhookID == "" {
			http.Error(w, "Webhook ID is required", http.StatusBadRequest)
			return
		}

		// Construct the Shopify API URL for deleting a webhook
		shopifyURL := fmt.Sprintf("https://%s/admin/api/%s/webhooks/%s.json", store, apiVersion, webhookID)
		log.Printf("Deleting webhook: %s", shopifyURL)

		req, err := http.NewRequest("DELETE", shopifyURL, nil)
		if err != nil {
			log.Printf("Error creating delete request: %v", err)
			http.Error(w, "Failed to create delete request", http.StatusInternalServerError)
			return
		}
		req.Header.Set("X-Shopify-Access-Token", apiKey)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("Error making delete request to Shopify: %v", err)
			http.Error(w, "Failed to delete webhook", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		// Forward the response status from Shopify to the client
		w.WriteHeader(resp.StatusCode)
	})

	// Start HTTP server in a goroutine
	go func() {
		log.Printf("Serving static files at %s...\n", baseURL)
		if err := http.ListenAndServe(":"+port, nil); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Open default browser with the base URL (no sensitive info in the URL)
	log.Printf("Launching dashboard for %s...\n", store)
	if err := browser.OpenURL(baseURL); err != nil {
		log.Fatalf("Failed to open browser: %v", err)
	}

	// Keep the server running
	select {}
}

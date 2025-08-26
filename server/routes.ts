import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { profilingRequestSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/profile", async (req, res) => {
    try {
      const validatedData = profilingRequestSchema.parse(req.body);
      const result = await storage.processProfilingRequest(validatedData);
      res.json(result);
    } catch (error) {
      console.error("Profiling error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Invalid request data" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

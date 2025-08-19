/**
 * Live Server Integration Test
 * 
 * Tests integration with the actual running server on port 7401
 */

import request from "supertest";

const BASE_URL = "http://localhost:7401";

describe("Live Server Integration Tests", () => {
  describe("Server Health and Connectivity", () => {
    it("should respond to health check endpoint", async () => {
      const response = await request(BASE_URL)
        .get("/health")
        .expect(200);
      
      expect(response.body).toBeDefined();
      expect(response.body.status).toBe("OK");
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(response.body.environment).toBe("development");
    });
  });
});

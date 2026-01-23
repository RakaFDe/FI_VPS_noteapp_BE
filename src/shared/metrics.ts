import client from "prom-client";

client.collectDefaultMetrics();

export const httpCounter = new client.Counter({
  name: "finote_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "path", "status"],
});

export const register = client.register;

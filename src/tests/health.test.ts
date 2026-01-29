import request from "supertest";
import app from "../app.js";

describe("Health endpoints", () => {
  it("GET /healthz should return ok", async () => {
    const res = await request(app).get("/healthz");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

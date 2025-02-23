import "cross-fetch/polyfill";

import { createRequest, createResponse } from "node-mocks-http";
import { describe, expect, it } from "vitest";

import { HealthCheck, healthReadyHandler, nodeEnvCheck as nodeEnvironmentCheck } from "../../src";

const HealthCheckService = new HealthCheck();

HealthCheckService.addChecker("node-env", nodeEnvironmentCheck());

describe("health ready route", () => {
    it("endpoint returns health checks reports", async () => {
        expect.assertions(2);

        const callback = healthReadyHandler(HealthCheckService);

        const requestMock = createRequest();
        const responseMock = createResponse();

        await callback(requestMock, responseMock);

        // eslint-disable-next-line no-underscore-dangle
        expect(responseMock._getStatusCode()).toBe(204);
        expect(responseMock.getHeader("content-type")).toBeUndefined();
    });
});

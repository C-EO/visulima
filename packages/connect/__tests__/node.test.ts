import type { IncomingMessage, ServerResponse } from "node:http";
import {
    describe, expect, it, vi,
} from "vitest";

import { Router } from "../src";
import { createRouter, getPathname, NodeRouter } from "../src/node";

type AnyHandler = (...arguments_: any[]) => any;

const noop: AnyHandler = async () => {
    /** noop */
};

const badFunction = () => {
    // throw new Error("bad function");
};

const METHODS = ["GET", "HEAD", "PATCH", "DELETE", "POST", "PUT"];

describe("createRouter", () => {
    it("internals", () => {
        const context = new NodeRouter();

        expect(context).instanceOf(NodeRouter, "creates new `NodeRouter` instance");
        // @ts-expect-error: internal
        expect(context.router).instanceOf(Router, "~> has a `Router` instance");

        expect(context.all, "~> has `all` method").toBeTypeOf("function");

        METHODS.forEach((string_) => {
            expect(context[string_.toLowerCase()], `~> has \`${string_}\` method`).toBeTypeOf("function");
        });
    });

    it("createRouter() returns an instance", async () => {
        expect(createRouter()).instanceOf(NodeRouter);
    });

    it("add()", async () => {
        expect.assertions(2);

        const context = new NodeRouter();
        // @ts-expect-error: private property
        vi.spyOn(context.router, "add").mockImplementation((...values) => {
            expect(values, "call router.add()").toStrictEqual(["GET", "/", noop]);
        });
        // @ts-expect-error: private property
        const returned = context.add("GET", "/", noop);

        expect(returned, "returned itself").toStrictEqual(context);
    });

    it("use()", async () => {
        it("it defaults to / if base is not provided", async () => {
            const context = new NodeRouter();

            // @ts-expect-error: private field
            const useSpy = vi.spyOn(context.router, "use");

            context.use(noop);

            expect(useSpy).toStrictEqual([["/", noop]]);
        });

        it("it call this.router.use() with fn", async () => {
            const context = new NodeRouter();

            // @ts-expect-error: private field
            const useSpy = vi.spyOn(context.router, "use");

            context.use("/test", noop, noop);

            expect(useSpy).toStrictEqual([["/test", noop, noop]]);
        });

        it("it call this.router.use() with fn.router", async () => {
            const context = new NodeRouter();
            const context2 = new NodeRouter();

            // @ts-expect-error: private field
            const useSpy = vi.spyOn(context.router, "use");

            context.use("/test", context2, context2);

            // @ts-expect-error: private field
            expect(useSpy).toStrictEqual([["/test", context2.router, context2.router]]);
        });
    });

    it("clone()", () => {
        const context = new NodeRouter();
        // @ts-expect-error: private property
        context.router.routes = [noop, noop] as any[];

        expect(context.clone()).instanceOf(NodeRouter, "is a NodeRouter instance");
        expect(context, "not the same identity").not.toStrictEqual(context.clone());

        expect(
            // @ts-expect-error: private property
            context.router.routes,
            "routes are deep cloned",
        ).toStrictEqual(
            // @ts-expect-error: private property
            context.clone().router.routes,
        );
    });

    it("run() - runs req and res through fns and return last value", async () => {
        expect.assertions(7);

        const context = createRouter();
        const request = { url: "/foo/bar", method: "POST" } as IncomingMessage;
        const response = {} as ServerResponse;

        context.use("/", (reqq, ress, next) => {
            // eslint-disable-next-line sonarjs/no-duplicate-string
            expect(reqq, "passes along req").toStrictEqual(request);
            expect(ress, "passes along req").toStrictEqual(response);

            return next();
        });
        // eslint-disable-next-line sonarjs/no-duplicate-string
        context.use("/not/match", badFunction);
        context.get("/", badFunction);
        context.get("/foo/bar", badFunction);
        // eslint-disable-next-line sonarjs/no-identical-functions
        context.post("/foo/bar", async (reqq, ress, next) => {
            expect(reqq, "passes along req").toStrictEqual(request);
            expect(ress, "passes along req").toStrictEqual(response);

            return next();
        });
        context.use("/foo", (reqq, ress) => {
            expect(reqq, "passes along req").toStrictEqual(request);
            expect(ress, "passes along req").toStrictEqual(response);

            return "ok";
        });
        expect(await context.run(request, response)).toStrictEqual("ok");
    });

    it("run() - propagates error", async () => {
        const request = { url: "/", method: "GET" } as IncomingMessage;
        const serverResponse = {} as ServerResponse;
        const error = new Error("💥");

        await expect(() => createRouter()
            .use((_, __, next) => {
                next();
            })
            .use(() => {
                throw error;
            })
            .run(request, serverResponse)).rejects.toThrow(error);

        await expect(() => createRouter()
            .use((_, __, next) => next())
            .use(async () => {
                throw error;
            })
            .run(request, serverResponse)).rejects.toThrow(error);

        await expect(() => createRouter()
            .use((_, __, next) => next())
            .use(async (_, __, next) => {
                await next();
            })
        // eslint-disable-next-line compat/compat
            .use(() => Promise.reject(error))
            .run(request, serverResponse)).rejects.toThrow(error);
    });

    it("run() - returns if no fns", async () => {
        const request = { url: "/foo/bar", method: "GET" } as IncomingMessage;
        const response = {} as ServerResponse;
        const context = createRouter();

        context.get("/foo", badFunction);
        context.post("/foo/bar", badFunction);
        context.use("/bar", badFunction);

        expect(context.run(request, response)).resolves.toBeUndefined();
    });

    it("handler() - basic", async () => {
        expect(createRouter().handler(), "returns a function").toBeTypeOf("function");
    });

    it("handler() - handles incoming (sync)", async () => {
        expect.assertions(3);

        const request = { method: "GET", url: "/" } as IncomingMessage;
        const response = {} as ServerResponse;

        let index = 0;

        await createRouter()
            .use((_request, _response, next) => {
                // eslint-disable-next-line no-plusplus
                expect(++index).toStrictEqual(1);

                next();
            })
            .use((_request, _response, next) => {
                // eslint-disable-next-line no-plusplus
                expect(++index).toStrictEqual(2);

                next();
            })
            .post(badFunction)
            .get("/not/match", badFunction)
            .get(() => {
                // eslint-disable-next-line no-plusplus
                expect(++index).toStrictEqual(3);
            })
            .handler()(request, response);
    });

    it("handler() - handles incoming (async)", async () => {
        expect.assertions(3);

        const request = { method: "GET", url: "/" } as IncomingMessage;
        const response = {} as ServerResponse;

        let index = 0;

        await createRouter()
            .use(async (_request, _response, next) => {
                // eslint-disable-next-line no-plusplus
                expect(++index).toStrictEqual(1);

                await next();
            })
            .use((_request, _response, next) => {
                // eslint-disable-next-line no-plusplus
                expect(++index).toStrictEqual(2);

                return next();
            })
            .post(badFunction)
            .get("/not/match", badFunction)
            .get(async () => {
                // eslint-disable-next-line no-plusplus
                expect(++index).toStrictEqual(3);
            })
            .handler()(request, response);
    });

    it("handler() - calls onError if error thrown (sync)", async () => {
        expect.assertions(3 * 3);

        const error = new Error("💥");
        const consoleSpy = vi.spyOn(globalThis.console, "error").mockImplementation(() => {});

        const baseFunction = (_request: IncomingMessage, response: ServerResponse, next: any) => {
            response.statusCode = 200;

            return next();
        };

        let index = 0;

        const request = { method: "GET", url: "/" } as IncomingMessage;
        const response = {
            end(chunk) {
                expect(this.statusCode, "set 500 status code").toStrictEqual(500);
                // eslint-disable-next-line sonarjs/no-duplicate-string
                expect(chunk).toStrictEqual("Internal Server Error");
                expect(consoleSpy.mock.calls[index], `called console.error ${index}`).toStrictEqual([error]);

                index += 1;
            },
        } as ServerResponse;

        await createRouter()
            .use(baseFunction)
            .use(() => {
                throw error;
            })
            .get(badFunction)
            .handler()(request, response);
        await createRouter()
            .use(baseFunction)
            .use((_request, _response, next) => {
                next();
            })
            .get(() => {
                throw error;
            })
            .handler()(request, response);

        const response2 = {
            end(chunk) {
                expect(response.statusCode).toStrictEqual(500);
                expect(chunk).toStrictEqual("Internal Server Error");
                expect(consoleSpy.mock.calls[index], 'called console.error with ""').toStrictEqual([""]);
            },
        } as ServerResponse;
        await createRouter()
            .use(baseFunction)
            .get(() => {
                // non error throw
                // eslint-disable-next-line @typescript-eslint/no-throw-literal
                throw "";
            })
            .handler()(request, response2);
    });

    it("handler() - calls onError if error thrown (async)", async () => {
        expect.assertions(2 * 3);
        const error = new Error("💥");
        const consoleSpy = vi.spyOn(globalThis.console, "error").mockImplementation(() => {});

        const request = { method: "GET", url: "/" } as IncomingMessage;

        let index = 0;

        const response = {
            // eslint-disable-next-line sonarjs/no-identical-functions
            end(chunk) {
                expect(this.statusCode, "set 500 status code").toStrictEqual(500);
                expect(chunk).toStrictEqual("Internal Server Error");
                expect(consoleSpy.mock.calls[index], `called console.error ${index}`).toStrictEqual([error]);

                index += 1;
            },
        } as ServerResponse;

        // eslint-disable-next-line sonarjs/no-identical-functions
        const baseFunction = async (_request: IncomingMessage, response_: ServerResponse, next: any) => {
            // eslint-disable-next-line no-param-reassign
            response_.statusCode = 200;

            return next();
        };

        await createRouter()
            .use(baseFunction)
            .use(async () => {
                throw error;
            })
            .get(badFunction)
            .handler()(request, response);
        await createRouter()
            .use(baseFunction)
            .get(() => {
                throw error;
            })
            .handler()(request, response);
    });

    it("handler() - calls custom onError", async () => {
        expect.assertions(1);
        await createRouter({
            onError(error) {
                expect((error as Error).message).toStrictEqual("💥");
            },
        })
            .get(() => {
                throw new Error("💥");
            })
            .handler()({ method: "GET", url: "/" } as IncomingMessage, {} as ServerResponse);
    });

    it("handler() - calls onNoMatch if no fns matched", async () => {
        expect.assertions(2);

        const request = { url: "/foo/bar", method: "GET" } as IncomingMessage;
        const response = {
            end(chunk) {
                expect(this.statusCode).toStrictEqual(404);
                expect(chunk).toStrictEqual("Route GET /foo/bar not found");
            },
        } as ServerResponse;

        await createRouter().get("/foo").post("/foo/bar").handler()(request, response);
    });

    it("handler() - calls onNoMatch if only middle fns found", async () => {
        expect.assertions(2);

        const request = { url: "/foo/bar", method: "GET" } as IncomingMessage;
        const response = {
            end(chunk) {
                expect(this.statusCode).toStrictEqual(404);
                expect(chunk).toStrictEqual("Route GET /foo/bar not found");
            },
        } as ServerResponse;

        await createRouter().use("", badFunction).use("/foo", badFunction).handler()(request, response);
    });

    it("handler() - calls onNoMatch if no fns matched (HEAD)", async () => {
        expect.assertions(2);

        const request = { url: "/foo/bar", method: "HEAD" } as IncomingMessage;
        const response = {
            end(chunk) {
                expect(this.statusCode).toStrictEqual(404);
                expect(chunk).toBeUndefined();
            },
        } as ServerResponse;

        await createRouter().get("/foo").post("/foo/bar").handler()(request, response);
    });

    it("handler() - calls custom onNoMatch if not found", async () => {
        expect.assertions(1);
        await createRouter({
            onNoMatch() {
                expect(true, "onNoMatch called").toBeTruthy();
            },
        }).handler()({ url: "/foo/bar", method: "GET" } as IncomingMessage, {} as ServerResponse);
    });

    it("handler() - calls onError if custom onNoMatch throws", async () => {
        expect.assertions(2);

        await createRouter({
            onNoMatch() {
                expect(true, "onNoMatch called").toBeTruthy();
                throw new Error("💥");
            },
            onError(error) {
                expect((error as Error).message, "💥");
            },
        }).handler()({ url: "/foo/bar", method: "GET" } as IncomingMessage, {} as never);
    });

    it("prepareRequest() - attach params", async () => {
        const request = {} as IncomingMessage;

        const context2 = createRouter().get("/hello/:name");
        // @ts-expect-error: internal
        context2.prepareRequest(
            request,
            // @ts-expect-error: internal
            // eslint-disable-next-line sonarjs/no-duplicate-string
            context2.router.find("GET", "/hello/world"),
        );
        // @ts-expect-error: extra prop
        expect(request.params, { name: "world" }, "params are attached");

        const requestWithParameters = {
            params: { age: "20" },
        };
        // @ts-expect-error: internal
        context2.prepareRequest(
            requestWithParameters as unknown as IncomingMessage,
            // @ts-expect-error: internal
            context2.router.find("GET", "/hello/world"),
        );
        expect(requestWithParameters.params, "params are merged").toStrictEqual({ name: "world", age: "20" });

        const requestWithParameters2 = {
            params: { name: "sunshine" },
        };
        // @ts-expect-error: internal
        context2.prepareRequest(
            requestWithParameters2 as unknown as IncomingMessage,
            // @ts-expect-error: internal
            context2.router.find("GET", "/hello/world"),
        );
        expect(requestWithParameters2.params, "params are merged (existing takes precedence)").toStrictEqual({ name: "sunshine" });
    });

    it("getPathname() - returns pathname correctly", async () => {
        expect(getPathname("/foo/bar")).toStrictEqual("/foo/bar");
        expect(getPathname("/foo/bar?q=quz")).toStrictEqual("/foo/bar");
    });
});

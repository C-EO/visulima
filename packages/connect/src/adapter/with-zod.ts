import createHttpError from "http-errors";
import type { AnyZodObject, ZodObject } from "zod";
import { ZodError } from "zod";

import type { Nextable, NextHandler } from "../types";

// eslint-disable-next-line max-len
const withZod = <Request, Response, Handler extends Nextable<any>, Schema extends ZodObject<{ body?: AnyZodObject; headers?: AnyZodObject; query?: AnyZodObject }>>(
    schema: Schema,
    handler: Handler,
): ((request: Request, response: Response, next: NextHandler) => Promise<Response>) => async (request: Request, response: Response, next) => {
        let transformedRequest: Request = request;

        try {
            transformedRequest = (await schema.parseAsync(request)) as Request;
        } catch (error: any) {
            let { message } = error;

            // eslint-disable-next-line unicorn/consistent-destructuring
            if (error instanceof ZodError && typeof error.format === "function") {
                // eslint-disable-next-line unicorn/consistent-destructuring
                message = error.issues.map((issue) => `${issue.path.join("/")} - ${issue.message}`).join("/n");
            }

            throw createHttpError(422, message);
        }

        return handler(transformedRequest, response, next);
    };

export default withZod;

import { renderHook } from "@testing-library/react";
import { useRouter } from "next/router";
import { useFSRoute } from "nextra/hooks";
import type { Mock } from "vitest";
import {
    describe, expect, it, vi,
} from "vitest";

vi.mock("next/router", () => {
    return {
        useRouter: vi.fn(),
    };
});

function mockAndRenderHook({ asPath, locale, route }: { asPath: string; locale?: string; route?: string }) {
    (useRouter as Mock).mockReturnValue({ asPath, locale, route });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const { result } = renderHook(useFSRoute);

    return result.current;
}

describe("getFSRoute", () => {
    it("replace locale", () => {
        const withLocale = mockAndRenderHook({
            asPath: "/foo.en-US",
            locale: "en-US",
        });
        expect(withLocale).toEqual("/foo");
    });

    it("replace index", () => {
        const withIndex = mockAndRenderHook({ asPath: "/bar/index" });
        expect(withIndex).toEqual("/bar");
    });

    it("ignore query", () => {
        const withQuery = mockAndRenderHook({ asPath: "/baz?query=1" });
        expect(withQuery).toEqual("/baz");

        const withQueryLocale = mockAndRenderHook({
            asPath: "/quz.en-US?query=1",
            locale: "en-US",
        });
        expect(withQueryLocale).toEqual("/quz");

        const withIndexLocaleQuery = mockAndRenderHook({
            asPath: "/asd/index.en-US?query=1",
            locale: "en-US",
        });
        expect(withIndexLocaleQuery).toEqual("/asd");
    });

    it("should return /404", () => {
        const value = mockAndRenderHook({
            asPath: "/not-found",
            route: "/404",
        });
        expect(value).toEqual("/404");
    });

    it("should return /500", () => {
        const value = mockAndRenderHook({
            asPath: "/error",
            route: "/500",
        });
        expect(value).toEqual("/500");
    });

    it("remove trailing slash", () => {
        const value = mockAndRenderHook({ asPath: "/foo/" });
        expect(value).toEqual("/foo");
    });
});

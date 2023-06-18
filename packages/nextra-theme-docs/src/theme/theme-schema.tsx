import type { Components as MdxComponents, MergeComponents } from "@mdx-js/react/lib";
import type { NextSeoProps } from "next-seo";
import type { Item } from "nextra/normalize-pages";
import type { FC, ReactNode } from "react";
import { isValidElement } from "react";
import { z } from "zod";

import type { NavBarProperties } from "../components/navbar";
import type { TOCProperties as TOCPageContentProperties } from "../components/toc/toc-page-content";
import type { TOCProperties as TOCSidebarProperties } from "../components/toc/toc-sidebar";
import type { ActiveType } from "../types";

const isString = (value: unknown): boolean => typeof value === "string";

const isFunction = (value: unknown): boolean => typeof value === "function";

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const isReactNode = (value: unknown): boolean => isString(value) || isValidElement(value as any) || isFunction(value);

const i18nSchema = z.array(
    z
        .object({
            direction: z.enum(["ltr", "rtl"]).optional(),
            locale: z.string(),
            name: z.string(),
        })
        .strict(),
);

const reactNode = [isReactNode, { message: "Must be React.ReactNode or React.FC" }] as const;
const fc = [isFunction, { message: "Must be React.FC" }] as const;

export const themeSchema = z
    .object({
        banner: z
            .object({
                dismissible: z.boolean(),
                key: z.string(),
                content: z.custom<FC | ReactNode>(...reactNode).optional(),
            })
            .strict(),
        // eslint-disable-next-line zod/require-strict
        chat: z
            .object({
                icon: z.custom<FC | ReactNode>(...reactNode),
                link: z.string().startsWith("https://").optional(),
            })
            .optional(),
        // eslint-disable-next-line zod/require-strict
        comments: z
            .object({
                repository: z.string(),
                repositoryId: z.string(),
                categoryId: z.string(),
            })
            .optional(),
        components: z.custom<MdxComponents | MergeComponents | null | undefined>(...fc).optional(),
        darkMode: z.boolean(),
        direction: z.enum(["ltr", "rtl"]),
        docsRepositoryBase: z.string().startsWith("https://"),
        editLink: z
            .object({
                component: z
                    .custom<
                        FC<{
                            children: ReactNode;
                            className?: string;
                            filePath?: string;
                        }>
                    >(...fc)
                    .optional(),
                content: z.string().or(
                    z
                        .function()
                        .args(z.object({ locale: z.string() }).strict())
                        .returns(z.string())
                        .or(z.custom<FC<{ locale: string }> | ReactNode>(...reactNode)),
                ),
            })
            .strict(),
        faviconGlyph: z.string().optional(),
        feedback: z
            .object({
                content: z.custom<FC | ReactNode>(...reactNode).optional(),
                labels: z.string(),
                link: z
                    .function()
                    .args(
                        z
                            .object({
                                title: z.string(),
                                route: z.string(),
                                docsRepositoryBase: z.string(),
                                labels: z.string(),
                            })
                            .strict(),
                    )
                    .returns(z.string())
                    .optional(),
            })
            .strict(),
        backToTop: z
            .object({
                active: z.boolean(),
                content: z.custom<FC<{ locale: string }> | ReactNode>(...reactNode).or(
                    z
                        .function()
                        .args(z.object({ locale: z.string() }).strict())
                        .returns(z.string()),
                ),
            })
            .strict(),
        footer: z
            .object({
                component: z.custom<FC<{ menu: boolean }> | ReactNode>(...reactNode),
                copyright: z.custom<FC<{ activeType: ActiveType }> | ReactNode>(...reactNode).optional(),
            })
            .strict(),
        gitTimestamp: z.custom<FC<{ timestamp: Date; locale: string }> | ReactNode>(...reactNode),
        head: z.custom<FC | ReactNode>(...reactNode),
        // eslint-disable-next-line zod/require-strict
        hero: z
            .object({
                component: z.custom<FC | ReactNode>(...reactNode),
                height: z.string().or(z.number()),
            })
            .optional(),
        i18n: i18nSchema,
        logo: z.custom<FC | ReactNode>(...reactNode),
        logoLink: z.boolean().or(z.string()),
        main: z.custom<FC<{ children: ReactNode }>>(...fc).optional(),
        navbar: z
            .object({
                linkBack: z.custom<FC<{ locale: string }> | ReactNode>(...reactNode).optional(),
                component: z.custom<FC<NavBarProperties> | ReactNode>(...reactNode),
                extraContent: z.custom<FC | ReactNode>(...reactNode).optional(),
            })
            .strict(),
        navigation: z.boolean().or(
            z
                .object({
                    next: z.boolean(),
                    prev: z.boolean(),
                })
                .strict(),
        ),
        nextThemes: z
            .object({
                defaultTheme: z.string(),
                forcedTheme: z.string().optional(),
                storageKey: z.string(),
                attribute: z.string().optional(),
            })
            .strict(),
        notFound: z
            .object({
                content: z.custom<FC | ReactNode>(...reactNode),
                labels: z.string(),
                pages: z
                    .function()
                    .args(z.object({ locale: z.string() }).strict())
                    .returns(
                        z.array(
                            z
                                .object({
                                    url: z.string(),
                                    title: z.string(),
                                    subtitle: z.string().or(z.undefined()),
                                    icon: z.custom<FC | ReactNode>(...reactNode).or(z.undefined()),
                                })
                                .strict(),
                        ),
                    )
                    .optional(),
            })
            .strict(),
        primaryHue: z.number().or(
            z
                .object({
                    dark: z.number(),
                    light: z.number(),
                })
                .strict(),
        ),
        project: z
            .object({
                icon: z.custom<FC | ReactNode>(...reactNode),
                link: z.string().startsWith("https://").optional(),
            })
            .strict(),
        search: z
            .object({
                codeblocks: z.boolean(),
                component: z.custom<FC<{ className?: string; directories: Item[] }> | ReactNode>(...reactNode),
                emptyResult: z.custom<FC | ReactNode>(...reactNode),
                error: z.string().or(
                    z
                        .function()
                        .args(z.object({ locale: z.string() }).strict())
                        .returns(z.string()),
                ),
                loading: z.string().or(
                    z
                        .function()
                        .args(z.object({ locale: z.string() }).strict())
                        .returns(z.string()),
                ),
                // Can't be React component
                placeholder: z.string().or(
                    z
                        .function()
                        .args(z.object({ locale: z.string() }).strict())
                        .returns(z.string()),
                ),
                position: z.enum(["sidebar", "navbar"]),
            })
            .strict(),
        serverSideError: z
            .object({
                content: z.custom<FC | ReactNode>(...reactNode),
                labels: z.string(),
            })
            .strict(),
        sidebar: z
            .object({
                autoCollapse: z.boolean().optional(),
                defaultMenuCollapseLevel: z.number().min(1).int(),
                titleComponent: z.custom<FC<{ title: string; type: string; route: string }> | ReactNode>(...reactNode),
            })
            .strict(),
        tocContent: z
            .object({
                component: z.custom<FC<TOCPageContentProperties>>(...fc),
                float: z.boolean(),
                title: z.custom<FC | ReactNode>(...reactNode),
                headingComponent: z.custom<FC<{ id: string; children: string }>>(...fc).optional(),
            })
            .strict(),
        tocSidebar: z
            .object({
                title: z.string(),
                component: z.custom<FC<TOCSidebarProperties>>(...fc),
                extraContent: z.custom<FC | ReactNode>(...reactNode).optional(),
                float: z.boolean(),
                headingComponent: z.custom<FC<{ id: string; children: string }>>(...fc).optional(),
            })
            .strict(),
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        useNextSeoProps: z.custom<() => NextSeoProps | void>(isFunction),
        localSwitch: z
            .object({
                title: z.string().or(
                    z
                        .function()
                        .args(z.object({ locale: z.string() }).strict())
                        .returns(z.string()),
                ),
            })
            .strict(),
        themeSwitch: z
            .object({
                title: z.string().or(
                    z
                        .function()
                        .args(z.object({ locale: z.string() }).strict())
                        .returns(z.string()),
                ),
                light: z.string().or(
                    z
                        .function()
                        .args(z.object({ locale: z.string() }).strict())
                        .returns(z.string()),
                ),
                dark: z.string().or(
                    z
                        .function()
                        .args(z.object({ locale: z.string() }).strict())
                        .returns(z.string()),
                ),
                system: z.string().or(
                    z
                        .function()
                        .args(z.object({ locale: z.string() }).strict())
                        .returns(z.string()),
                ),
            })
            .strict(),
    })
    .strict();

export const publicThemeSchema = themeSchema.deepPartial().extend({
    // to have `locale` and `text` as required properties
    i18n: i18nSchema,
});

export type DocumentationThemeConfig = z.infer<typeof themeSchema>;
export type PartialDocumentsThemeConfig = z.infer<typeof publicThemeSchema>;

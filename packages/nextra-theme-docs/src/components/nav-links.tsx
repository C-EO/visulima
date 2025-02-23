import cn from "clsx";
import { ArrowRightIcon } from "nextra/icons";
import type { Item } from "nextra/normalize-pages";
import type { FC } from "react";

import { useConfig } from "../contexts";
import type { DocumentationThemeConfig } from "../theme/theme-schema";
import Anchor from "./anchor";

interface NavLinkProperties {
    currentIndex: number;
    flatDirectories: Item[];
    layout?: string;
}

const classes = {
    link: cn(
        // eslint-disable-next-line max-len
        "flex items-center gap-1 py-4 text-base font-medium text-gray-600 transition-colors [word-break:break-word] hover:text-primary-600 dark:text-gray-300 lg:text-lg",
    ),
    icon: cn("inline h-5 shrink-0"),
};

const NavLinks: FC<NavLinkProperties> = ({ flatDirectories, currentIndex, layout }) => {
    const config = useConfig();
    const nav = config.navigation;
    const navigation: Exclude<DocumentationThemeConfig["navigation"], boolean> = typeof nav === "boolean" ? { prev: nav, next: nav } : nav;
    const previous = navigation.prev && flatDirectories[currentIndex - 1];
    const next = navigation.next && flatDirectories[currentIndex + 1];

    if (!previous && !next) {
        return null;
    }

    return (
        <div
            className={cn(
                "flex items-center items-stretch border-t pt-8 dark:border-neutral-800",
                "contrast-more:border-neutral-400 dark:contrast-more:border-neutral-400",
                layout === "full" && "mb-8",
            )}
        >
            {previous && (
                <Anchor
                    href={previous.route}
                    title={previous.title}
                    className={cn(
                        classes.link,
                        next ? "max-w-[50%]" : "max-w-full",
                        "ltr:pr-4 rtl:pl-4",
                        "flex-grow mr-4 border border-solid dark:border-primary-100/10 transition-all hover:-translate-y-1",
                    )}
                >
                    <ArrowRightIcon className={cn(classes.icon, "ltr:rotate-180 ml-4")} />
                    <div className="flex grow flex-col items-end">
                        <span className="text-xs">Previous</span>
                        <span>{previous.title}</span>
                    </div>
                </Anchor>
            )}
            {next && (
                <Anchor
                    href={next.route}
                    title={next.title}
                    className={cn(
                        classes.link,
                        previous ? "max-w-[50%]" : "max-w-full",
                        "ltr:ml-auto ltr:pl-4 ltr:text-right rtl:mr-auto rtl:pr-4 rtl:text-left",
                        "flex-grow ml-4 border border-solid dark:border-primary-100/10 transition-all hover:-translate-y-1",
                    )}
                >
                    <div className="flex grow flex-col items-start">
                        <span className="text-xs">Next</span>
                        <span>{next.title}</span>
                    </div>
                    <ArrowRightIcon className={cn(classes.icon, "rtl:rotate-180 mr-4")} />
                </Anchor>
            )}
        </div>
    );
};

export default NavLinks;

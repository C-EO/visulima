import cn from "clsx";
import { useRouter } from "next/router";
import type { Heading } from "nextra";
import { useFSRoute } from "nextra/hooks";
import { ArrowRightIcon } from "nextra/icons";
import type { Item, MenuItem, PageItem } from "nextra/normalize-pages";
import type { FC } from "react";
import {
    createContext, memo, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import scrollIntoView from "scroll-into-view-if-needed";

import { DEFAULT_LOCALE } from "../constants";
import { useActiveAnchor, useConfig, useMenu } from "../contexts";
import { renderComponent } from "../utils";
import Anchor from "./anchor";
import Collapse from "./collapse";
import LocaleSwitch from "./locale-switch";
import ThemeSwitch from "./theme-switch";

const TreeState: Record<string, boolean> = Object.create(null) as Record<string, boolean>;

const FocusedItemContext = createContext<string | null>(null);
// eslint-disable-next-line no-spaced-func
const OnFocuseItemContext = createContext<((item: string | null) => any) | null>(null);

const classes = {
    link: cn(
        "flex px-2 py-1.5 text-sm transition-colors [word-break:break-word]",
        "cursor-pointer [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] contrast-more:border",
    ),
    inactive: cn(
        "text-gray-500 hover:bg-gray-200 hover:text-gray-700 rounded",
        "dark:text-gray-400 dark:hover:bg-primary-100/5 dark:hover:text-gray-200",
        "contrast-more:text-gray-900 contrast-more:dark:text-gray-50",
        "contrast-more:border-transparent contrast-more:hover:border-gray-900 contrast-more:dark:hover:border-gray-50",
    ),
    active: cn("font-semibold text-primary-600", "contrast-more:border-primary-500 contrast-more:dark:border-primary-500"),
    list: cn("flex flex-col gap-1"),
    border: cn(
        "relative before:absolute before:inset-y-1",
        'before:w-px before:bg-gray-300 before:content-[""] dark:before:bg-neutral-800',
        "ltr:pl-3 ltr:before:left-0 rtl:pr-3 rtl:before:right-0",
    ),
};

const FolderLevelContext = createContext(0);

type FolderProperties = {
    item: Item | MenuItem | PageItem;
    anchors: Heading[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any,sonarjs/cognitive-complexity
const FolderImpl: FC<FolderProperties> = ({ item, anchors }) => {
    const routeOriginal = useFSRoute();
    const [route] = routeOriginal.split("#");
    const active = [route, `${route}/`].includes(`${item.route}/`);
    const activeRouteInside = active || route?.startsWith(`${item.route}/`);

    const focusedRoute = useContext(FocusedItemContext);
    const focusedRouteInside = !!focusedRoute?.startsWith(`${item.route}/`);
    const level = useContext(FolderLevelContext);

    const { setMenu } = useMenu();
    const config = useConfig();
    const { theme } = item as Item;
    // eslint-disable-next-line unicorn/no-negated-condition
    const isOpen = TreeState[item.route] === undefined
        ? active
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              || activeRouteInside
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              || focusedRouteInside
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              || (theme && "collapsed" in theme ? !theme.collapsed : level < config.sidebar.defaultMenuCollapseLevel)
        : TreeState[item.route] ?? focusedRouteInside;

    const rerender = useState({})[1];

    useEffect(() => {
        const updateTreeState = () => {
            if (activeRouteInside || focusedRouteInside) {
                TreeState[item.route] = true;
            }
        };
        const updateAndPruneTreeState = () => {
            if (activeRouteInside && focusedRouteInside) {
                TreeState[item.route] = true;
            } else {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete TreeState[item.route];
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        config.sidebar.autoCollapse ? updateAndPruneTreeState() : updateTreeState();
    }, [activeRouteInside, focusedRouteInside, item.route, config.sidebar.autoCollapse]);

    if (item.type === "menu") {
        const menu = item as MenuItem;
        const routes = Object.fromEntries(menu.children.map((mRoute) => [mRoute.name, mRoute]));

        // eslint-disable-next-line no-param-reassign
        item.children = Object.entries(menu.items).map(([key, value]) => {
            return {
                ...(routes[key] ?? {
                    name: key,
                    ...("locale" in menu && { locale: menu.locale }),
                    route: `${menu.route}/${key}`,
                }),
                ...value,
            };
        });
    }

    const isLink = "withIndexPage" in item && item.withIndexPage;
    // use button when link don't have href because it impacts on SEO
    const ComponentToUse = isLink ? Anchor : "button";

    return (
        <li className={cn(active, isOpen ? "open" : "")}>
            <ComponentToUse
                href={isLink ? item.route : undefined}
                className={cn("items-center justify-between gap-2 w-full text-left", classes.link, active ? classes.active : classes.inactive)}
                onClick={(event) => {
                    const clickedToggleIcon = ["svg", "path"].includes((event.target as HTMLElement).tagName.toLowerCase());

                    if (clickedToggleIcon) {
                        event.preventDefault();
                    }

                    if (isLink) {
                        // If it's focused, we toggle it. Otherwise, always open it.
                        if (active || clickedToggleIcon) {
                            TreeState[item.route] = !isOpen;
                        } else {
                            TreeState[item.route] = true;
                            setMenu(false);
                        }

                        rerender({});

                        return;
                    }

                    if (active) {
                        return;
                    }

                    TreeState[item.route] = !isOpen;

                    rerender({});
                }}
            >
                {renderComponent(config.sidebar.titleComponent, {
                    title: item.title,
                    type: item.type,
                    route: item.route,
                })}
                <ArrowRightIcon
                    className="h-[18px] min-w-[18px] rounded-sm p-0.5 hover:bg-gray-800/5 dark:hover:bg-gray-100/5"
                    pathClassName={cn("origin-center transition-transform", isOpen ? "ltr:rotate-90 rtl:rotate-[-270deg]" : "rtl:-rotate-180")}
                />
            </ComponentToUse>
            <Collapse className="ltr:pr-0 rtl:pl-0" isOpen={isOpen}>
                {Array.isArray(item.children) ? (
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    <Menu className={cn(classes.border, "ltr:ml-1 rtl:mr-1")} directories={item.children} anchors={anchors} />
                ) : null}
            </Collapse>
        </li>
    );
};

const Folder = memo((properties: FolderProperties) => {
    const level = useContext(FolderLevelContext);

    return (
        <FolderLevelContext.Provider value={level + 1}>
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <FolderImpl {...properties} />
        </FolderLevelContext.Provider>
    );
});

const Separator: FC<{ title: string }> = ({ title }) => {
    const config = useConfig();

    return (
        <li
            className={cn(
                "[word-break:break-word]",
                title ? "mt-5 mb-2 px-2 py-1.5 text-sm font-semibold text-gray-900 first:mt-0 dark:text-gray-100" : "my-4",
            )}
        >
            {title ? (
                renderComponent(config.sidebar.titleComponent, {
                    title,
                    type: "separator",
                    route: "",
                })
            ) : (
                <hr className="mx-2 border-t border-gray-400 dark:border-primary-100/10" />
            )}
        </li>
    );
};

const File: FC<{ item: Item | PageItem; anchors: Heading[] }> = ({ item, anchors }) => {
    const route = useFSRoute();
    const onFocus = useContext(OnFocuseItemContext);

    // It is possible that the item doesn't have any route - for example an external link.
    const active = item.route && [route, `${route}/`].includes(`${item.route}/`);

    const activeAnchor = useActiveAnchor();
    const { setMenu } = useMenu();
    const config = useConfig();

    if (item.type === "separator") {
        return <Separator title={item.title} />;
    }

    return (
        <li className={cn(classes.list, { active })}>
            <Anchor
                href={(item as PageItem).href ?? item.route}
                newWindow={(item as PageItem).newWindow}
                className={cn(classes.link, active ? classes.active : classes.inactive)}
                onClick={() => {
                    setMenu(false);
                }}
                onFocus={() => {
                    onFocus?.(item.route);
                }}
                onBlur={() => {
                    onFocus?.(null);
                }}
            >
                {renderComponent(config.sidebar.titleComponent, {
                    title: item.title,
                    type: item.type,
                    route: item.route,
                })}
            </Anchor>
            {active && anchors.length > 0 && (
                <ul className={cn(classes.list, classes.border, "ltr:ml-3 rtl:mr-3")}>
                    {anchors.map(({ id, value }) => (
                        <li key={id}>
                            <a
                                href={`#${id}`}
                                className={cn(
                                    classes.link,
                                    'flex gap-2 before:opacity-25 before:content-["#"]',
                                    activeAnchor[id]?.isActive ? classes.active : classes.inactive,
                                )}
                                onClick={() => {
                                    setMenu(false);
                                }}
                            >
                                {value}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
};

const Menu: FC<{
    directories: Item[] | PageItem[];
    anchors: Heading[];
    className?: string;
    onlyCurrentDocs?: boolean;
}> = ({
    directories, anchors, className, onlyCurrentDocs,
}) => (
    <ul className={cn(classes.list, className)}>
        {directories.map((item) => {
            if (!onlyCurrentDocs || item.isUnderCurrentDocsTree) {
                if (item.type === "menu" || (item.children && (item.children.length > 0 || !item.withIndexPage))) {
                    return <Folder key={item.name} item={item} anchors={anchors} />;
                }
                return <File key={item.name} item={item} anchors={anchors} />;
            }

            return null;
        })}
    </ul>
);

interface SideBarProperties {
    documentsDirectories: PageItem[];
    flatDirectories: Item[];
    fullDirectories: Item[];
    asPopover?: boolean;
    headings?: Heading[];
    includePlaceholder: boolean;
}

const Sidebar: FC<SideBarProperties> = ({
    documentsDirectories,
    flatDirectories,
    fullDirectories,
    asPopover = false,
    headings = [],
    includePlaceholder,
    // eslint-disable-next-line sonarjs/cognitive-complexity
}) => {
    const config = useConfig();
    const { menu, setMenu } = useMenu();
    const router = useRouter();
    const anchors = useMemo(() => headings.filter((v) => v.depth === 2), [headings]);
    const [focused, setFocused] = useState<string | null>(null);

    const containerReference = useRef<HTMLDivElement>(null);
    const sidebarReference = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (menu) {
            document.body.classList.add("overflow-hidden", "lg:overflow-auto");
        } else {
            document.body.classList.remove("overflow-hidden", "lg:overflow-auto");
        }
    }, [menu]);

    useEffect(() => {
        const activeElement = containerReference.current?.querySelector("li.active");

        if (activeElement && (window.innerWidth > 767 || menu)) {
            const scroll = () => {
                scrollIntoView(activeElement, {
                    block: "center",
                    inline: "center",
                    scrollMode: "always",
                    boundary: containerReference.current,
                });
            };

            if (menu) {
                // needs for mobile since menu has transition transform
                setTimeout(scroll, 300);
            } else {
                scroll();
            }
        }
    }, [menu]);

    // Always close mobile nav when route was changed (e.g. logo click)
    useEffect(() => {
        setMenu(false);
    }, [router.asPath, setMenu]);

    const hasI18n = config.i18n.length > 0;
    const hasMenu = config.darkMode || hasI18n;

    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions,jsx-a11y/click-events-have-key-events */}
            {includePlaceholder && asPopover ? <div className="h-0 shrink-0 max-xl:hidden" /> : null}
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions,jsx-a11y/click-events-have-key-events */}
            <div
                className={cn(
                    "motion-reduce:transition-none [transition:background-color_1.5s_ease]",
                    menu ? "fixed inset-0 z-10 bg-black/80 dark:bg-black/60" : "bg-transparent",
                )}
                onClick={() => setMenu(false)}
            />
            <aside
                className={cn(
                    "nextra-sidebar-container flex flex-col",
                    "lg:bg-x-gradient-gray-200-gray-400-75 lg:dark:bg-x-gradient-dark-700-dark-800-65",
                    "lg:top-16 lg:shrink-0 motion-reduce:transform-none",
                    "transform-gpu transition-all ease-in-out",
                    "lg:w-64",
                    asPopover ? "lg:hidden" : "lg:sticky lg:self-start",
                    hasMenu && "with-menu",
                    menu ? "max-lg:[transform:translate3d(0,0,0)]" : "max-lg:[transform:translate3d(0,-100%,0)]",
                )}
                ref={containerReference}
            >
                <div className={cn("px-4 pt-4", config.search.position === "navbar" ? "md:hidden" : "")}>
                    {renderComponent(config.search.component, {
                        directories: flatDirectories,
                    })}
                </div>
                {/* eslint-disable-next-line react/jsx-no-constructed-context-values */}
                <FocusedItemContext.Provider value={focused}>
                    <OnFocuseItemContext.Provider
                        // eslint-disable-next-line react/jsx-no-constructed-context-values
                        value={(item) => {
                            setFocused(item);
                        }}
                    >
                        <div
                            className={cn(
                                "overflow-y-auto overflow-x-hidden p-4",
                                "grow md:h-[calc(100vh-var(--nextra-navbar-height)-var(--nextra-menu-height))] pr-2",
                            )}
                            ref={sidebarReference}
                        >
                            <div className="transform-gpu ease-in-out motion-reduce:transition-none">
                                <Menu
                                    className="max-md:hidden"
                                    // The sidebar menu, shows only the docs directories.
                                    directories={documentsDirectories}
                                    // When the viewport size is larger than `md`, hide the anchors in
                                    // the sidebar when `floatTOC` is enabled.
                                    anchors={config.tocSidebar.float ? [] : anchors}
                                    onlyCurrentDocs
                                />
                                <Menu
                                    className="md:hidden"
                                    // The mobile dropdown menu, shows all the directories.
                                    directories={fullDirectories}
                                    // Always show the anchor links on mobile (`md`).
                                    anchors={anchors}
                                />
                            </div>
                        </div>
                    </OnFocuseItemContext.Provider>
                </FocusedItemContext.Provider>

                {hasMenu && (
                    <div
                        className={cn(
                            "sticky bottom-0 border-t border-gray-200 dark:border-gray-800 py-4",
                            "lg:bg-x-gradient-gray-200-gray-400-75 lg:dark:bg-x-gradient-dark-700-dark-800-65",
                            "relative z-[1]", // for top box shadow
                            "flex justify-end items-center gap-2",
                            "px-6", // hide ring on focused sidebar links
                            "h-[var(--nextra-menu-height)]",
                        )}
                        data-toggle-animation="off"
                    >
                        {hasI18n && <LocaleSwitch options={config.i18n} className="ltr:mr-auto rtl:ml-auto" />}
                        <div className="grow" />
                        {config.darkMode && <ThemeSwitch locale={router.locale ?? DEFAULT_LOCALE} />}
                    </div>
                )}
            </aside>
        </>
    );
};

export default Sidebar;

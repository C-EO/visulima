import cn from "clsx";
import type { FC } from "react";

import type { Config } from "../contexts/config";
import { getGitIssueUrl, renderComponent } from "../utils";
import Anchor from "./anchor";

const linkClassName = cn(
    "text-sm lg:text-xs py-2 lg:py-0 font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
    "contrast-more:text-gray-800 contrast-more:dark:text-gray-50",
);

const MetaInfo: FC<{ config: Config; filePath: string; locale: string; route: string }> = ({
    config, filePath, locale, route,
}) => (
    <>
        {config.feedback.content ? (
            <Anchor
                className={linkClassName}
                href={
                    config.feedback.link
                        ? config.feedback.link({
                            title: config.title,
                            route,
                            docsRepositoryBase: config.docsRepositoryBase,
                            labels: config.feedback.labels,
                        })
                        : getGitIssueUrl({
                            repository: config.docsRepositoryBase,
                            title: `Feedback for “${config.title}”`,
                            labels: config.feedback.labels,
                        })
                }
                newWindow
            >
                {renderComponent(config.feedback.content, { locale })}
            </Anchor>
        ) : null}

        {renderComponent(config.editLink.component, {
            filePath,
            className: linkClassName,
            children: renderComponent(config.editLink.content, { locale }),
        })}

        {config.backToTop.active && (
            <button
                type="button"
                onClick={() => {
                    window.scrollTo({ left: 0, top: 0, behavior: "smooth" });
                }}
                className={linkClassName}
            >
                {renderComponent(config.backToTop.content, { locale })}
            </button>
        )}
    </>
);

export default MetaInfo;

import cn from "clsx";
import type {
    ComponentProps, FC, PropsWithChildren, ReactElement, ReactNode,
} from "react";
import {
    Children, cloneElement, useEffect, useState,
} from "react";

import { DetailsProvider } from "../contexts";
import Collapse from "./collapse";
import Summary from "./summary";

const findSummary = (children: ReactNode) => {
    let summary: ReactNode = null;

    const restChildren: ReactNode[] = [];

    Children.forEach(children, (child, index) => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        if (child && (child as ReactElement).type === Summary) {
            summary ||= child;
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        if (!summary && child && typeof child === "object" && (child as ReactElement).type !== Details && "props" in child && child.props) {
            const result = findSummary((child.props as PropsWithChildren).children);

            // eslint-disable-next-line prefer-destructuring
            summary = result[0];

            restChildren.push(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                cloneElement(child, {
                    ...child.props,
                    children: result[1]?.length ? result[1] : null,
                    // eslint-disable-next-line react/no-array-index-key
                    key: index,
                }),
            );
        } else {
            restChildren.push(child);
        }
    });

    return [summary, restChildren];
};

const Details: FC<
ComponentProps<"details"> & {
    variant?: "default" | "raw";
    collapseClassName?: string;
    collapseHorizontal?: boolean;
}
> = ({
    children, open = false, collapseClassName, collapseHorizontal = false, className, variant = "default", ...properties
}) => {
    const [openState, setOpen] = useState(open);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const [summary, restChildren] = findSummary(children);

    // To animate the close animation we have to delay the DOM node state here.
    const [delayedOpenState, setDelayedOpenState] = useState(openState);

    // @ts-expect-error TS7030: Not all code paths return a value
    // eslint-disable-next-line consistent-return
    useEffect(() => {
        if (!openState) {
            const timeout = setTimeout(() => setDelayedOpenState(openState), 500);

            return () => clearTimeout(timeout);
        }

        setDelayedOpenState(true);
    }, [openState]);

    return (
        <details
            className={cn(
                variant === "default"
                    ? "my-4 rounded border border-gray-200 bg-white p-2 shadow-sm first:mt-0 dark:border-neutral-800 dark:bg-neutral-900"
                    : "",
                className,
            )}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...properties}
            open={delayedOpenState}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...(openState && { "data-expanded": true })}
        >
            <DetailsProvider value={setOpen}>{summary}</DetailsProvider>
            <Collapse className={collapseClassName} isOpen={openState} horizontal={collapseHorizontal}>
                {restChildren}
            </Collapse>
        </details>
    );
};

export default Details;

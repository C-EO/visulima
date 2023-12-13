import { DefaultLoggerTypes, LoggerConfiguration, LoggerTypesConf } from "../types";

const mergeTypes = <L extends string, T extends string>(
    standard: DefaultLoggerTypes<L>,
    custom: LoggerTypesConf<T, L>,
): DefaultLoggerTypes<L> & Record<T, Partial<LoggerConfiguration<L>>> => {
    const types: DefaultLoggerTypes<L> & Record<T, Partial<LoggerConfiguration<L>>> = { ...standard } as DefaultLoggerTypes<L> &
        Record<T, Partial<LoggerConfiguration<L>>>;

    Object.keys(custom).forEach((type) => {
        types[type as T] = { ...types[type as T], ...custom[type as T] };
    });

    return types;
};

export default mergeTypes;

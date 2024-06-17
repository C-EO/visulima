/// <reference types="vitest" />
import type { UserConfig } from "vitest/config";
import { defineConfig, configDefaults, coverageConfigDefaults } from "vitest/config";

const VITEST_SEQUENCE_SEED = Date.now();

// https://vitejs.dev/config/
export const getVitestConfig = (options: UserConfig = {}) => {
    console.log("VITEST_SEQUENCE_SEED", VITEST_SEQUENCE_SEED);

    return defineConfig({
        ...options,
        test: {
            ...configDefaults,
            coverage: {
                ...coverageConfigDefaults,
                provider: "v8",
                reporter: ["clover", "cobertura", "lcov", "text"],
                include: ["src"],
                exclude: ["__fixtures__/**", "__bench__/**", "scripts/**", "src/**/types.ts", "src/module.d.ts", "src/reset.d.ts"],
            },
            environment: "node",
            reporters: process.env.CI_PREFLIGHT ? ["basic", "github-actions"] : ["basic"],
            sequence: {
                seed: VITEST_SEQUENCE_SEED,
            },
            typecheck: {
                enabled: false,
            },
            ...options.test,
            exclude: [...configDefaults.exclude, "__fixtures__/**", ...(options.test?.exclude ?? [])],
        },
    });
};

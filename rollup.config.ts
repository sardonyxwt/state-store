import pkg from "./package.json";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import visualizer from "rollup-plugin-visualizer";
import cleaner from 'rollup-plugin-cleaner';

export default {
    input: "src/index.ts",
    output: [
        {
            file: pkg.main,
            format: "cjs",
        },
        {
            file: pkg.module,
            format: "es",
        },
    ],
    plugins: [
        resolve(),
        commonjs(),
        typescript({
            tsconfig: "tsconfig.rollup.json",
            useTsconfigDeclarationDir: true,
        }),
        cleaner({
            targets: [
                './lib/'
            ]
        }),
        visualizer({
            filename: "report/stats.html",
        }),
    ],
};

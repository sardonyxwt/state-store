import pkg from './package.json';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import visualizer from 'rollup-plugin-visualizer';
import cleaner from 'rollup-plugin-cleaner';
import { terser } from 'rollup-plugin-terser';

export default {
    input: 'src/index.ts',
    output: [
        {
            file: pkg.main,
            format: 'cjs',
        },
        {
            file: pkg.module,
            format: 'es',
        },
    ],
    external: ['react', 'react-dom', 'styled-components'],
    plugins: [
        commonjs(),
        resolve(),
        typescript({
            tsconfig: 'tsconfig.rollup.json',
            typescript: require('ttypescript'),
            useTsconfigDeclarationDir: true,
        }),
        terser({
            output: {
                comments: false,
            },
        }),
        cleaner({
            targets: ['./lib/'],
        }),
        visualizer({
            filename: 'report/stats.html',
        }),
    ],
};

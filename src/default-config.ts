﻿import postcssSortMediaQueries from 'postcss-sort-media-queries';
import { BuildOptions } from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import { aliasPath } from 'esbuild-plugin-alias-path';

import { DefineConfig } from '../types/types';
import { clearFolder } from './plugins/clear-folder';
import { plugin as loggerPlugin } from './plugins/logger';
import { createCacheFolder } from './plugins/create-cache-folder';

export const defaultConfig = (props: DefineConfig): BuildOptions => {
    const { outdir, entryPoints, tsconfig, isDevelopment, aliases, aspCachePath } = props;

    return {
        outdir,
        entryPoints,
        tsconfig,
        bundle: true,
        metafile: true,
        minify: !isDevelopment,
        sourcemap: isDevelopment,
        charset: 'utf8',
        plugins: [
            clearFolder,
            createCacheFolder(aspCachePath),
            aliasPath({ alias: aliases }),
            sassPlugin({
                async transform(source) {
                    const { css } = await postcss([
                        autoprefixer,
                        postcssSortMediaQueries({ sort: 'desktop-first' })
                    ]).process(source, {
                        from: undefined
                    });
                    return css;
                },
            }),
            {
                name: 'ignore-assets',
                setup(build) {
                    build.onResolve({ filter: /\.(svg|png|jpe?g|gif|woff|woff2)$/ }, (args) => {
                        return {
                            path: args.path,
                            external: true
                        };
                    });
                },
            },
            loggerPlugin
        ],
        legalComments: isDevelopment ? 'eof' : 'none',
        drop: isDevelopment ? [] : ['console', 'debugger'],
        //-----------optimisation-----------
        assetNames: 'assets/[name]-[hash]',
        chunkNames : 'chunks/[name]-[hash]'
    };
};
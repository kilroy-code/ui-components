import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

/*
  One can import index.mjs directly, but that references a lot of material-design and lit stuff, such
  that the Web page needs to set up an import-map to tell the browser where to find all those references.
  Much easier to import bundle.mjs instead -- and with the benefit of compaction and whatever tree-shaking is possible in the code.
 */

const devMode = (process.env.NODE_ENV === 'development');
// E.g., npx rollup -c --environment NODE_ENV:development
console.log(`${ devMode ? 'development' : 'production' } mode bundle`);

function target(input, output) { // roll up input to output
  return {
    input,
    output: {
      file: output,
      format: 'es',
      inlineDynamicImports: true,
      sourcemap: devMode ? 'inline' : false
    },
    plugins: [
      nodeResolve({browser: true, preferBuiltins: false}), // Resolve package.json imports.
      json(),
      !devMode && terser({keep_classnames: true}) // minify for production.
    ]
  };
}

export default [
  target('index.mjs', 'bundle.mjs')
];


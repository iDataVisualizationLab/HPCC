import resolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs'
export default {
    input: 'src/js/parallel.js',
    // input: 'src/scripts/outliagnostics.js',
    output:{
        file:'build/js/main.min.js',
        // file:'build/js/outliagnostics.min.js',
        format: 'iife',
        sourcemap: 'inline',
    },
    plugins: [
        resolve(),
        commonJS({
            include: ['node_modules/**']
        })
    ]
};
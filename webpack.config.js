const { DefinePlugin } = require('webpack');
const { join } = require('path');

module.exports = [{
    mode: 'none',
    entry: { app: join(process.cwd(), 'src/client/index.tsx') },
    target: 'web',
    resolve: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
    module: {
        rules: [{
            loader: 'ts-loader',
            test: /\.tsx?$/,
            options: { allowTsInNodeModules: true },
        }],
    },
    output: {
        filename: '[name].js',
        path: join(process.cwd(), 'build'),
    },
    plugins: [new DefinePlugin({ 'process.env': '({})' })],
}];
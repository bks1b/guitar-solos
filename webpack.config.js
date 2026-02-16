import webpack from 'webpack';
import { join } from 'path';

export default [{
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
    plugins: [new webpack.DefinePlugin({ 'process.env': '({})' })],
}];
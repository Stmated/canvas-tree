const path = require('path');
const { merge } = require('webpack-merge');

module.exports = {
    mode: process.env.NODE_ENV,
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
};

if (process.env.NODE_ENV === 'production') {

    module.exports = merge(module.exports, {

    });
}

if (process.env.NODE_ENV === 'development') {

    module.exports = merge(module.exports, {
        devtool: "inline-source-map"
    });
}



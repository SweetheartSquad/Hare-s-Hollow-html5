const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ChunkProgressWebpackPlugin = require('chunk-progress-webpack-plugin');
const package = require('./package');

module.exports = {
	module: {
		rules: [{
			test: /\.js$/, // source
			exclude: /(node_modules|bower_components)/,
			use: {
				loader: 'babel-loader'
			}
		}, {
			test: /\.strand$/,
			use: "raw-loader"
		}, {
			test: /\.css$/, // stylesheets
			use: [
				'style-loader',
				'css-loader',
				{
					loader: 'postcss-loader',
					options: {
						postcssOptions: {
							plugins: [
								require('autoprefixer')(),
								require('postcss-clean')()
							]
						}
					}
				}
			]
		}, {
			test: /\.fnt\.(png||xml)$/, // bitmap fonts
			use: {
				loader: 'file-loader',
				options: {
					outputPath: 'assets/',
					name: '[name].[ext]'
				}
			}
		}, {
			test: /(?<!\.fnt)\.(png|jpg|gif|svg|wav|ogg|mp3|frag|vert|xml|woff)$/, // assets, excluding bitmap fonts
			use: {
				loader: 'url-loader',
				options: {
					outputPath: 'assets/',
					limit: Infinity // bytes
				}
			}
		}]
	},
	entry: {
		index: './src/index.js'
	},
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'public')
	},
	plugins: [
		new ChunkProgressWebpackPlugin(),
		new CleanWebpackPlugin(['public']), // cleans dist
		new HtmlWebpackPlugin({ // creates index.html
			title: package.description,
			meta: {
				viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no'
			},
			minify: true,
			favicon: './src/assets/icon.png'
		})
	],
};

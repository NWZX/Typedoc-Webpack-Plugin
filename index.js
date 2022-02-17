/*
 *  Typedoc Webpack Plugin
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved. 
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *   
 *  The above copyright notice and this permission notice shall be included in 
 *  all copies or substantial portions of the Software.
 *   
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

/**
 * @typedef {Object} FileStamps
 * @property {number} safeTime - The last time the file was modified (margin accuracy).
 * @property {number} [timestamp] - The last time the file was modified.
 */

const typedoc = require('typedoc');
const path = require('path');
const webpack = require('webpack');

const pluginName = 'TypedocWebpackPlugin';

/**
 * Initialize the plugin
 * @param {Partial<typedoc.TypeDocOptions>} options 
 */
function TypedocWebpackPlugin(options) {
	/**
	 * @type {number}
	 */
	this.startTime = Date.now();
	/**
	 * Previous file timestamps
	 * @type {Map<string, FileStamps>}
	 * @warning FileStamps can be "null"
	 */
	this.prevTimestamps = new Map();
	/**
	 * @type {typedoc.TypeDocOptions}
	 */
	this.typeDocOptions = options;
	/**
	 * @type {boolean}
	 */
	this.watchMode = options?.watch ? true : false;
}

/**
 * Select a path in the array of paths
 * @param {string} path 
 * @param {Map} map 
 */
const extractTimestampsEntry = (path, map) => {
	return map.get(path)?.snapshot.fileTimestamps;
}

/**
 * Remove all entry that don't have a timestamp or is not a typescript file
 * @param {Map<string, any>} map 
 * @returns 
 */
const reduceFileTimestamps = (map) => {
	map?.forEach((value, key) => {
		if (!value?.timestamp || key.indexOf('.ts') == -1) {
			map.delete(key);
		}
	});
}

/**
 * Compare new and old file timestamps
 * @param {Map} oldMap 
 * @param {Map} newMap 
 */
const compareTimestamps = (oldMap, newMap) => {
	let change = 0;
	newMap?.forEach((value, key) => {
		if (oldMap?.get(key)?.timestamp || this.startTime < value.timestamp) {
			change++;
		}
	});
	return change;
}

/**
*	@param {webpack.Compiler} compiler Webpack compiler object.
* 	@return void
*/
TypedocWebpackPlugin.prototype.apply = function (compiler) {
	/**
	 * Start the documentation generation
	 * @param {webpack.Compilation} compilation 
	 * @param {*} callback 
	 */
	const generateDoc = (compilation, callback) => {
		let webPackEntryPoint = compiler.options.entry.main.import[0];
		webPackEntryPoint = path.isAbsolute(webPackEntryPoint) ? webPackEntryPoint : path.resolve(compiler.options.context, webPackEntryPoint);
		webPackEntryPoint = path.dirname(webPackEntryPoint);
		/**
		 * Get list of files that has been changed
		 * @type {Map<string, FileStamps>} FileStamps can be "null"
		 */
		const fileInfo = compilation.fileSystemInfo._fileTimestampsOptimization._map;
		const fileTimestamps = extractTimestampsEntry(webPackEntryPoint, fileInfo);
		reduceFileTimestamps(fileTimestamps);
		const changedFiles = compareTimestamps(this.prevTimestamps, fileTimestamps);

		// If typescript files have been changed
		if (changedFiles > 0) {
			var app = new typedoc.Application();

			app.options.addReader(new typedoc.TSConfigReader()); // 1st Load TSConfig file
			app.options.addReader(new typedoc.TypeDocReader()); // 2nd Load TypeDoc file
			app.bootstrap(this.typeDocOptions); // 3rd Use webpack config options

			var project = app.convert();

			if (project) {
				if (app.options.getValue("json")) {
					console.log('Generating typedoc json');
					app.generateJson(project, app.options.getValue("json"));
				}
				else {
					console.log('Generating updated typedocs');
					app.generateDocs(project, app.options.getValue("out"));
				}
			}
		}
		else {
			console.log('No ts filed changed. Not recompling typedocs');
		}

		this.prevTimestamps = fileTimestamps;
		callback();
	};

	compiler.hooks.emit.tapAsync(pluginName, generateDoc);
};

module.exports = TypedocWebpackPlugin;

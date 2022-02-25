# Typedoc-Webpack-Plugin
This is a plugin for the Webpack build system that will run Typedoc in order to generate API documentation.

## Installation

Run the following command inside your project directory to install:
```bash
npm install https://github.com/NWZX/Typedoc-Webpack-Plugin --save-dev
```

__Note:__ Typedoc is required as peer dependency. 

To install Typedoc, run the following command inside your project directory:
```bash
npm install typedoc --save-dev
```


## Usage

To use, add a require for the module to the Webpack Configuration file, and then place into the plugin section:

```
var TypedocWebpackPlugin = require('typedoc-webpack-plugin');

...

plugins: [
	new TypedocWebpackPlugin()
]
```


The options for the plugin mirror the options that are passed to typedoc. Refer to https://typedoc.org/guides/options/ for full options. 


Here is an example of a more expanded configuration:

```
plugins: [
	new TypedocWebpackPlugin({
		"entryPoints": ["./src/index.ts", "./src/myfile2.ts"],
    	"out": "doc"
		"watch": "true" //Not implemented yet (false by default)
	})
]
```

```
plugins: [
	new TypedocWebpackPlugin({
		"entryPoints": ["./src"],
		"entryPointStrategy": "expand",
    	"out": "doc"
	})
]
```

But you can also just do like [here](https://typedoc.org/guides/installation/) and just use your tsconfig.json or a typedoc.json.
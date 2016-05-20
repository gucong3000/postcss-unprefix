[postcss](https://github.com/postcss/postcss)-unprefix
=====

[![Build Status](https://travis-ci.org/gucong3000/postcss-unprefix.svg?branch=master)](https://travis-ci.org/gucong3000/postcss-unprefix)
[![NPM version](https://img.shields.io/npm/v/postcss-unprefix.svg?style=flat-square)](https://www.npmjs.com/package/postcss-unprefix)
[![Coverage Status](https://img.shields.io/coveralls/gucong3000/postcss-unprefix.svg)](https://coveralls.io/r/gucong3000/postcss-unprefix)

Though, please use [`autoprefixer`](https://github.com/postcss/autoprefixer) as part of your build process to ensure proper browser support.

![Gif Deom](http://ww3.sinaimg.cn/bmiddle/534b48acgw1et7jyprmj3g20b40ciaes.gif)

## Installation

```bash
npm install --save postcss-unprefix
```

## Usage

```javascript
var postcss = require("postcss");
var processors = [
	require("postcss-unprefix"),
];

postcss(processors).process(myCss).css
```

#### Input

```css
.flex {
	display: -webkit-flex;
	display: -moz-flex;
	-webkit-flex: 1;
}
```

#### Output

```css
.flex {
	display: flex;
	flex: 1;
}
```

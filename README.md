postcss-clean-prefixes
======

[![Build Status](https://travis-ci.org/gucong3000/postcss-clean-prefixes/.svg?branch=master)](https://travis-ci.org/gucong3000/postcss-clean-prefixes/)

Remove pesky vendor prefixes from your source CSS files. This ensures that your prebuilt CSS is as terse and concise as possible.

Though, please use [`autoprefixer`](https://github.com/postcss/autoprefixer) as part of your build process to ensure proper browser support.

![Gif Deom](http://ww3.sinaimg.cn/bmiddle/534b48acgw1et7jyprmj3g20b40ciaes.gif)

## Installation

```bash
npm install --save postcss-clean-prefixes
```

## Usage

```javascript
var postcss = require("postcss)
var processors = [
	require("postcss-gradientfixer"),
	require("postcss-flexboxfixer"),
	require("postcss-clean-prefixes"),
	require("autoprefixer")
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

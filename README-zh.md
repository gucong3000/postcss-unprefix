[postcss](https://github.com/postcss/postcss)-[pie](http://css3pie.com/)
======

[![Build Status](https://travis-ci.org/gucong3000/h5form.svg?branch=master)](https://travis-ci.org/gucong3000/h5form)

让IE兼容最常用的几个CSS3特性

------

[English](README.md)

postcss-pie 由[PostCSS](https://github.com/postcss/postcss)与[PIE](http://css3pie.com/)驱动，让IE6-IE9兼容CSS3特性:
*   [border-radius](https://developer.mozilla.org/zh-CN/docs/Web/CSS/border-radius)
*   [box-shadow](https://developer.mozilla.org/zh-CN/docs/Web/CSS/box-shadow)
*   [border-image](https://developer.mozilla.org/zh-CN/docs/Web/CSS/border-image)
*   [CSS3 Backgrounds](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Background_and_Borders/Using_CSS_multiple_backgrounds)
*   [Gradients](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Images/Using_CSS_gradients)

## Usage

1.   [下载PIE](http://css3pie.com/download-latest)，解压所有文件到HTML文档所在服务器的某个目录， 如`/path/to/pie_files/`
1.   配置你的postcss 
    ```JavaScript
    var postcss = require('postcss');
    var pie = require('postcss-pie');

    postcss([
        pie({
            htcPath: '/path/to/pie_files/PIE.htc',
            pieLoadPath: 'http://cdn.server/path/to/js-files/',
        });
    ]);
    ```

1.   [确保正确的Content-Type](http://css3pie.com/documentation/known-issues/#content-type)

    如果IE在请求PIE.htc文件时，HTTP响应头中的Content-Type不是"text/x-component"，会造成功能失效。
    在大部分服务器默认配置下，都不会出现这个问题。如果出现此问题，如Apache，请在.htaccess 文件中添加：

    ```
    AddType text/x-component .htc
    ```

## Options

函数 pie(options) 返回一个新的PostCSS插件。参见[PostCSS API](https://github.com/postcss/postcss/blob/master/docs/api.md)中的插件使用文档。

一共有两个选项：

*   `htcPath` (string): `PIE.htc` 的所在路径，文件必须放在HTML文档所在服务器，路径必须使用`/`开头的绝对路径(不支持跨域名使用)。不使用此选项，则不会调用htc文件，此时你需要[使用JS方式激活](http://css3pie.com/documentation/pie-js/)
*   `pieLoadPath` (string): `PIE_IE9.js`和`PIE_IE678.js`所在目录的路径，必须为完整的URL路径，不使用此属性时，则自动从`PIE.htc`所在目录加载js文件。如果未声明`htcPath`属性，则此项配置无效。

## [PIE的文档](http://css3pie.com/documentation/)
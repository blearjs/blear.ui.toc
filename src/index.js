/**
 * blear.ui.toc
 * @author ydr.me
 * @create 2018年11月13日10:38:07
 * @update 2018年11月13日10:38:07
 */

'use strict';

var UI = require('blear.ui');
var selector = require('blear.core.selector');
var attribute = require('blear.core.attribute');
var modification = require('blear.core.modification');
var object = require('blear.utils.object');
var array = require('blear.utils.array');
var string = require('blear.utils.string');

var defaults = {
    /**
     * 目录容器元素
     */
    tocEl: '',

    /**
     * 内容元素
     */
    contentEl: '',

    /**
     * 列表标签名
     */
    listTagName: 'ol',

    /**
     * 列表样式名
     */
    listClassName: 'toc-list',

    /**
     * 项目样式名
     */
    itemClassName: 'toc-item'
};
var TOC = UI.extend({
    className: 'TOC',
    constructor: function (options) {
        var the = this;

        TOC.parent(the);
        the[_options] = object.assign({}, defaults, options);
        the[_initNode]();
        the[_intHeadings]();
        the[_intTree]();
        the[_generateHTML]();
    },

    /**
     * 实例销毁
     */
    destroy: function () {
        var the = this;

        the[_headingList] = the[_headingTree] = null;
        the[_tocEl].innerHTML = '';
        TOC.invoke('destroy', the);
    }
});
var sole = TOC.sole;
var proto = TOC.prototype;
var _options = sole();
var _initNode = sole();
var _tocEl = sole();
var _contentEl = sole();
var _intHeadings = sole();
var _headingList = sole();
var _intTree = sole();
var _headingTree = sole();
var _generateHTML = sole();

proto[_initNode] = function () {
    var the = this;
    var options = the[_options];

    the[_tocEl] = selector.query(options.tocEl)[0];
    the[_contentEl] = selector.query(options.contentEl)[0];
};

proto[_intHeadings] = function () {
    var the = this;
    var headingEls = selector.query('h1,h2,h3,h4,h5,h6', the[_contentEl]);

    the[_headingList] = [];

    array.each(headingEls, function (index, headingEl) {
        var currOrder = headingEl.tagName.slice(1) * 1;

        the[_headingList].push({
            el: headingEl,
            order: currOrder,
            children: []
        });
    });
};

/**
 * 生成目录树
 */
proto[_intTree] = function () {
    var the = this;
    var tree = {
        indent: 0,
        levels: [],
        children: []
    };
    var rootTree = tree;
    var build = function (start, tree, order) {
        array.each(the[_headingList], function (index, heading) {
            if (index < start) {
                return;
            }

            var headingOrder = heading.order;

            if (headingOrder < order) {
                return false;
            }

            if (headingOrder > order) {
                var prevHeading = the[_headingList][index - 1];

                if (prevHeading.order >= headingOrder) {
                    return;
                }

                build(index, prevHeading, headingOrder);
                return;
            }

            if (heading.parent) {
                return;
            }

            var children = tree.children;
            children.push(heading);
            heading.indent = tree.indent + 1;
            heading.levels = [].concat(tree.levels, [children.length]);
            heading.parent = tree === rootTree ? null : tree;
        });
    };

    if (the[_headingList].length) {
        build(0, tree, the[_headingList][0].order);
    }

    the[_headingTree] = tree.children;
};


/**
 * 生成 HTML
 * @returns {string}
 */
proto[_generateHTML] = function () {
    var the = this;
    var options = the[_options];
    var tagName = options.listTagName;
    var listClassName = options.listClassName;
    var itemClassName = options.itemClassName;
    var walk = function (children, root) {
        var firstNode = children[0];
        var indent = firstNode.indent;
        var attrs = ' class="' + listClassName + ' ' + listClassName + '_' + indent + '"';
        var outerOpen = '<' + tagName + attrs + '>';
        var outerClose = '</' + tagName + '>';
        var outerCenter = '';
        array.each(children, function (index, node) {
            var attrs = 'class="' + itemClassName + ' ' + itemClassName + '_' + indent + '"';
            var innerOpen = '<li ' + attrs + '>';
            var innerClose = '</li>';
            var headingEl = node.el;
            var text = headingEl.innerText.trim();
            var id = headingEl.id = headingEl.id || 'heading-' + node.levels.join('-');
            var innerCenter = '<a href="#' + id + '">' + text + '</a>';
            var children = node.children;

            if (children.length) {
                innerCenter += walk(children);
            }

            outerCenter += innerOpen + innerCenter + innerClose;
        });
        return outerOpen + outerCenter + outerClose;
    };

    if (the[_headingTree].length) {
        the[_tocEl].innerHTML = walk(the[_headingTree], true);
    }
};

TOC.defaults = defaults;
module.exports = TOC;

// 所有主要浏览器都支持 createElement() 方法
import { isArrayLike, isFunction, isString, typeOf } from "./common";
let elementStyle = document.createElement('div').style;
let vendor = (() => {
    let transformName = {
        webkit: 'webkitTransform',
        Moz: 'MozTransform',
        O: 'OTransform',
        ms: 'msTransform',
        standard: 'transform',
    };
    for (let key in transformName) {
        if (elementStyle[transformName[key]] !== undefined) {
            return key;
        }
    }
    return false;
})();
export const isDom = (function () {
    // HTMLElement ie8以上支持 此类库不支持ie8及以下所以意义不是很大
    return (typeof HTMLElement === 'object') ?
        function (target) {
            return target instanceof HTMLElement;
        } :
        function (target) {
            return target && typeof target === 'object' && target.nodeType === 1 && typeof target.nodeName === 'string';
        };
})();
export const addClass = (function () {
    // classList ie9以上支持
    return !!document.documentElement.classList ? function (target, className) {
        target.classList.add(...Array.isArray(className) ? className : [className]);
        return target.className;
    } : function (target, className) {
        const originClass = target.className;
        const originClassArr = originClass.split(" ");
        className = Array.isArray(className) ? className : [className];
        // [...new Set(array)] ts不支持这种格式 只能使用Array.from替代
        className = Array.from(new Set(className));
        className = className.filter(cname => !originClassArr.includes(cname));
        if (!className.length)
            return originClass;
        className = className.join(" ");
        target.className = !!originClass ? originClass + " " + className : className;
        return target.className;
    };
})();
export function removeClass(dom, className) {
    if (dom.classList) {
        dom.classList.remove(className);
    }
    else {
        dom.className = dom.className.replace(new RegExp('(^|\\s)' + className + '(\\s|$)', "gi"), "");
    }
    return dom.className;
}
/**
 * 判断是什么种类的浏览器并返回拼接前缀后的数据
 * @param style
 * @returns {*}
 */
export function prefixStyle(style) {
    if (vendor === false) {
        return false;
    }
    if (vendor === 'transform') {
        return style;
    }
    return vendor + style.charAt(0).toUpperCase() + style.substr(1);
}
/**
 * 事件代理
 * @param containerEl
 * @param eventType
 * @param targetEl
 * @param callback
 */
export function eventProxy(containerEl, eventType, targetEl, callback) {
    let containsDom;
    if (!containerEl) {
        containsDom = document.documentElement;
    }
    else if (isDom(containerEl)) {
        containsDom = containerEl;
    }
    else {
        containsDom = document.querySelector(containerEl);
    }
    function handle(e) {
        e = e || window.event;
        // TODO 通过document.querySelectorAll匹配  并且该函数被滥用的话，会有性能问题
        let targetDom = isDom(targetEl) ? [targetEl] : Array.from(document.querySelectorAll(targetEl));
        if (targetDom.includes(e.target)) {
            callback(e);
        }
    }
    // document.querySelector未查找到dom的情况
    if (containsDom === null) {
        return null;
    }
    containsDom.addEventListener(eventType, handle);
    return function () {
        containsDom.removeEventListener(eventType, handle);
    };
}
/**
 * 一次性事件
 * @param el
 * @param eventType
 * @param callback
 * @param capture 捕获还是冒泡，默认冒泡
 */
export function onceEvent(el, eventType, callback, capture = false) {
    let dom = el;
    if (typeOf(el) === "string") {
        dom = document.querySelector(el);
        if (!dom) {
            throw new Error("element not found!");
        }
    }
    else {
        dom = window;
    }
    let handler = (e) => {
        let istRemove = false;
        if (callback && isFunction(callback)) {
            // callback 返回false的时候不remove事件
            istRemove = callback(e);
        }
        // 移除的时候也要带上捕获还是冒泡
        (istRemove !== false) && dom.removeEventListener(eventType, handler, capture);
    };
    // 使用捕获优先度高，冒泡的话会在同一个事件里执行
    dom.addEventListener(eventType, handler, capture);
}
export function addDragEventListener({ el, onDown, onMove, onUp, capture = false }) {
    let dom = el;
    if (isString(el)) {
        dom = document.querySelector(el);
        if (!dom) {
            throw new Error("element not found!");
        }
    }
    else {
        dom = window;
    }
    let lastXY = { x: 0, y: 0 };
    let downXY = { x: 0, y: 0 };
    function getXY(e) {
        let xY;
        const touches = e.touches;
        if (touches && isArrayLike(touches) && touches.length) {
            const touch = touches[0];
            xY = { x: touch.screenX, y: touch.screenY };
        }
        else {
            const { screenX, screenY } = e;
            xY = { x: screenX, y: screenY };
        }
        return xY;
    }
    function move(e) {
        const moveXY = getXY(e);
        if (onMove && isFunction(onMove)) {
            onMove.call(this, e, moveXY, lastXY, downXY);
        }
        lastXY = moveXY;
    }
    function up(e) {
        const upXY = getXY(e);
        lastXY = upXY;
        if (onUp && isFunction(onUp)) {
            onUp.call(this, e, downXY, upXY);
        }
        window.removeEventListener("mousemove", move, capture);
        window.removeEventListener("mouseup", up, capture);
        window.removeEventListener("touchmove", move, capture);
        window.removeEventListener("touchend", up, capture);
        window.removeEventListener("touchcancel", up, capture);
    }
    function mousedown(event) {
        downXY = getXY(event);
        window.addEventListener("mousemove", move, capture);
        window.addEventListener("mouseup", up, capture);
    }
    function touchStart(event) {
        downXY = getXY(event);
        window.addEventListener("touchmove", move, capture);
        window.addEventListener("touchend", up, capture);
        window.addEventListener("touchcancel", up, capture);
    }
    dom.addEventListener("mousedown", mousedown, capture);
    dom.addEventListener("touchstart", touchStart, capture);
    return function () {
        window.removeEventListener("mousedown", mousedown, capture);
        window.removeEventListener("touchstart", touchStart, capture);
    };
}
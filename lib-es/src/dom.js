// 所有主要浏览器都支持 createElement() 方法
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
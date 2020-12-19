// 所有主要浏览器都支持 createElement() 方法
import {typeOf} from "./common";
import {isFunction, isString} from "./is";

let elementStyle = document.createElement('div').style;
let vendor = ((): string | false => {
    let transformName: any = {
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
export const isDom: (target: any) => target is HTMLElement = (function () {
    // HTMLElement ie8以上支持 此类库不支持ie8及以下所以意义不是很大
    return (typeof HTMLElement === 'object') ?
        function (target: any): target is HTMLElement {
            return target instanceof HTMLElement;
        } :
        function (target: any): target is HTMLElement {
            return target && typeof target === 'object' && target.nodeType === 1 && typeof target.nodeName === 'string';
        };
})();
export const addClass: (target: HTMLElement, className: string | string[]) => string = (function () {
    // classList ie9以上支持
    return !!document.documentElement.classList ? function (target: HTMLElement, className: string | string[]) {
        target.classList.add(...Array.isArray(className) ? className : [className]);
        return target.className;
    } : function (target: HTMLElement, className: string | string[]) {
        const originClass = target.className;
        const originClassArr = originClass.split(" ");
        className = Array.isArray(className) ? className : [className];
        // [...new Set(array)] ts不支持这种格式 只能使用Array.from替代
        className = Array.from(new Set(className));
        className = className.filter(cname => !originClassArr.includes(cname));
        if (!className.length) return originClass;
        className = className.join(" ");
        target.className = !!originClass ? originClass + " " + className : className;
        return target.className;
    };
})();

export function removeClass(dom: any, className: string): string {
    if (dom.classList) {
        dom.classList.remove(className);
    } else {
        dom.className = dom.className.replace(new RegExp('(^|\\s)' + className + '(\\s|$)', "gi"), "");
    }
    return dom.className;
}

/**
 * 判断是什么种类的浏览器并返回拼接前缀后的数据
 * @param style
 * @returns {*}
 */
export function prefixStyle(style: string): string | false {
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
export function eventProxy(
    containerEl: string | HTMLElement | null,
    eventType: string,
    targetEl: string | HTMLElement,
    callback: (e: Event) => void,
): null | (() => void) {
    let containsDom: HTMLElement | null;
    if (!containerEl) {
        containsDom = document.documentElement;
    } else if (isDom(containerEl)) {
        containsDom = containerEl;
    } else {
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
        (containsDom as HTMLElement).removeEventListener(eventType, handle);
    };
}

/**
 * 一次性事件
 * @param el
 * @param eventType
 * @param callback
 * @param capture 捕获还是冒泡，默认冒泡
 */
export function onceEvent(
    el: Window | HTMLElement | string | null | undefined,
    eventType: string,
    callback: (e: Event) => false | undefined,
    capture = false,
) {
    let dom: HTMLElement | Window | null = el as HTMLElement;
    if (typeOf(el) === "string") {
        dom = document.querySelector(<string>el) as HTMLElement;
        if (!dom) {
            throw new Error("element not found!");
        }
    } else {
        dom = window;
    }
    let handler = (e) => {
        let istRemove: false | undefined = false;
        if (callback && isFunction(callback)) {
            // callback 返回false的时候不remove事件
            istRemove = callback(e);
        }
        // 移除的时候也要带上捕获还是冒泡
        (istRemove !== false) && (<HTMLElement>dom).removeEventListener(eventType, handler, capture);
    };
    // 使用捕获优先度高，冒泡的话会在同一个事件里执行
    dom.addEventListener(eventType, handler, capture);
}

type xy = { x: number, y: number }

/**
 * 拖动事件 返回取消事件
 */
export function addDragEventListener({el, onDown, onMove, onUp, capture = {down: false, up: true, move: false}}: {
    el?: string | HTMLElement,
    onDown?: (e: MouseEvent | TouchEvent, currentXY: xy) => any,
    onMove?: (e: MouseEvent | TouchEvent, currentXY: xy, lastXY: xy, downXY: xy) => any,
    onUp?: (e: MouseEvent | TouchEvent, currentXY: xy, downXY: xy) => any,
    capture?: {
        down?: boolean,
        up?: boolean,
        move?: boolean
    },
}): () => void {
    let dom: HTMLElement | Window = el as HTMLElement;
    if (!isDom(el)) {
        if (isString(el)) {
            dom = document.querySelector(<string>el) as HTMLElement;
            if (!dom) {
                throw new Error("element not found!");
            }
        } else {
            dom = window;
        }
    }
    let lastXY: xy = {x: 0, y: 0};
    let downXY: xy = {x: 0, y: 0};

    // mouse获取xy
    function getXYWithMouse(e: MouseEvent): xy {
        const {screenX, screenY} = e as MouseEvent;
        const xY = {x: screenX, y: screenY};
        xY.x = ~~xY.x;
        xY.y = ~~xY.y;
        return xY;
    }

    // touch获取xy
    function getXYWithTouch(e: TouchEvent): xy {
        const touches: TouchList = e.changedTouches;
        const touch: Touch = touches[0];
        const xY = {x: touch.clientX, y: touch.clientY};
        xY.x = ~~xY.x;
        xY.y = ~~xY.y;
        return xY;
    }

    let getXY: (e: MouseEvent | TouchEvent) => xy;

    // touch与mouse通用按下事件处理
    function down(event: MouseEvent, mouseOrTouch: "mouse" | "touch") {
        getXY = mouseOrTouch === "mouse" ? getXYWithMouse : getXYWithTouch;
        downXY = getXY(event);
        lastXY = downXY;
        let backVal: any = void 0;
        if (onDown && isFunction(onDown)) {
            backVal = onDown.call(this, event, downXY, downXY);
        }
        return backVal;
    }

    // touch与mouse通用移动事件处理
    function move(e: MouseEvent | TouchEvent) {
        const moveXY = getXY(e);
        let backVal: any = void 0;
        if (onMove && isFunction(onMove)) {
            backVal = onMove.call(this, e, moveXY, lastXY, downXY);
        }
        lastXY = moveXY;
        return backVal;
    }

    // touch与mouse通用移开事件处理
    function up(e: MouseEvent | TouchEvent) {
        // console.log("up", e);
        const upXY = getXY(e);
        let backVal: any = void 0;
        lastXY = upXY;
        if (onUp && isFunction(onUp)) {
            backVal = onUp.call(this, e, upXY, downXY);
        }
        removeMoveAndUpEventListener();
        return backVal;
    }

    // 移除touch与mouse 的move与up事件
    function removeMoveAndUpEventListener() {
        window.removeEventListener("mousemove", move, capture.move);
        window.removeEventListener("mouseup", up, capture.up);
        window.removeEventListener("touchmove", move, capture.move);
        window.removeEventListener("touchend", up, capture.up);
        window.removeEventListener("touchcancel", up, capture.up);
    }

    // 移除全部事件
    function removeAllEventListener() {
        dom.removeEventListener("mousedown", mousedown, capture.down);
        dom.removeEventListener("touchstart", touchStart, capture.down);
        removeMoveAndUpEventListener();
    }

    function mousedown(event: MouseEvent) {
        const backVal = down.call(this, event, "mouse");
        window.addEventListener("mousemove", move, capture.move);
        window.addEventListener("mouseup", up, capture.up);
        return backVal;
    }

    function touchStart(event: TouchEvent) {
        const backVal = down.call(this, event, "touch");
        window.addEventListener("touchmove", move, capture.move);
        window.addEventListener("touchend", up, capture.up);
        window.addEventListener("touchcancel", up, capture.up);
        return backVal;
    }

    dom.addEventListener("mousedown", mousedown, capture.down);
    dom.addEventListener("touchstart", touchStart, capture.down);

    // 返回取消全部事件函数
    return removeAllEventListener;
}

// from => https://blog.crimx.com/2017/07/15/element-onresize/
// TODO 未测
/**
 * dom resize event
 * @param el
 * @param handler
 */
export function onElResize(el: HTMLElement, handler: () => void) {
    if (!(el instanceof HTMLElement)) {
        throw new TypeError("Parameter 1 is not instance of 'HTMLElement'.");
    }
    // https://www.w3.org/TR/html/syntax.html#writing-html-documents-elements
    if (/^(area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr|script|style|textarea|title)$/i.test(el.tagName)) {
        throw new TypeError('Unsupported tag type. Change the tag or wrap it in a supported tag(e.g. div).');
    }
    if (typeof handler !== 'function') {
        throw new TypeError("Parameter 2 is not of type 'function'.");
    }

    let lastWidth = el.offsetWidth || 1;
    let lastHeight = el.offsetHeight || 1;
    const maxWidth = 10000 * (lastWidth);
    const maxHeight = 10000 * (lastHeight);

    const expand: HTMLElement = document.createElement('div');
    expand.className = "expand";
    expand.style.cssText = 'position:absolute;top:0;bottom:0;left:0;right:0;z-index=-10000;overflow:hidden;visibility:hidden;';
    const shrink: HTMLElement = expand.cloneNode(false) as HTMLElement;
    shrink.className = "shrink";

    const expandChild: HTMLElement = document.createElement('div') as HTMLElement;
    expandChild.style.cssText = 'transition:0s;animation:none;';
    const shrinkChild: HTMLElement = expandChild.cloneNode(false) as HTMLElement;

    expandChild.style.width = maxWidth + 'px';
    expandChild.style.height = maxHeight + 'px';
    shrinkChild.style.width = '250%';
    shrinkChild.style.height = '250%';

    expand.appendChild(expandChild);
    shrink.appendChild(shrinkChild);
    el.appendChild(expand);
    el.appendChild(shrink);

    if (expand.offsetParent !== el) {
        el.style.position = 'relative';
    }

    expand.scrollTop = shrink.scrollTop = maxHeight;
    expand.scrollLeft = shrink.scrollLeft = maxWidth;

    let newWidth = 0;
    let newHeight = 0;

    function onResize() {
        if (newWidth !== lastWidth || newHeight !== lastHeight) {
            lastWidth = newWidth;
            lastHeight = newHeight;
            console.log("onResize");
            handler();
        }
    }

    function onScroll() {
        console.log("onScroll");
        newWidth = el.offsetWidth || 1;
        newHeight = el.offsetHeight || 1;
        if (newWidth !== lastWidth || newHeight !== lastHeight) {
            requestAnimationFrame(onResize);
        }
        expand.scrollTop = shrink.scrollTop = maxHeight;
        expand.scrollLeft = shrink.scrollLeft = maxWidth;
    }

    expand.addEventListener('scroll', onScroll);
    shrink.addEventListener('scroll', onScroll);
}

function getWH(el: HTMLElement | typeof window): { w: number, h: number } {
    const wh = {w: 0, h: 0};
    if (el === window) {
        wh.w = window.innerWidth;
        wh.h = window.innerHeight;
    } else {
        el = el as HTMLElement;
        wh.w = el.offsetWidth;
        wh.h = el.offsetHeight;
    }
    return wh;
}

// TODO 未完待续 参考：emergency
export function isVisible(target: HTMLElement, container: HTMLElement | typeof window = window): boolean {
    /* if (container !== window && !isVisible(container as HTMLElement, window)) {
         return false
     }*/
    const wh = getWH(container);
    const targetWh = getWH(target);

    const scrollTop = (container as HTMLElement).scrollTop;
    const top = target.offsetTop - scrollTop;
    return top >= -targetWh.h && top <= wh.h;
}


export function isScrollEnd(el: HTMLElement, direct: 'vertical' | 'horizontal' = 'vertical', offset = 10) {
    if (direct === 'vertical') {
        return el.scrollTop >= el.scrollHeight - el.clientHeight - offset;
    } else {
        return el.scrollLeft >= el.scrollWidth - el.clientWidth - offset;
    }
}

export function isScrollStart(el: HTMLElement, direct: 'vertical' | 'horizontal' = 'vertical', offset = 10) {
    if (direct === 'vertical') {
        return el.scrollTop >= offset;
    } else {
        return el.scrollLeft >= offset;
    }
}

/**
 * 基于原生canvas合成图片
 * @param {String} posterSrc       海报
 * @param {String|HTMLElement} qrCode       二维码
 * @param {number} imageHeight  图片高度（传：1000(750 * 1000) 或 1334(750 * 1334)）
 */
export function mergeImg(posterSrc, qrCode, imageHeight) {
    const imgData = {
        width: 750,
        height: 1334,
    };
    return new Promise(function (resolve, reject) {
        const parent = document.body;
        const canvas = document.createElement("canvas");
        Object.assign(canvas.style, {
            height: imgData.height + "px",
            width: imgData.width + "px",
            position: "fixed",
            left: "-10000px",
        });
        canvas.width = imgData.width;
        canvas.height = imgData.height;
        parent.appendChild(canvas);
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        const poster_image = new Image();
        poster_image.setAttribute("crossOrigin", "anonymous");
        poster_image.src = posterSrc;
        poster_image.onload = function () {
            ctx.drawImage(poster_image, 0, 0, imgData.width, imgData.height);
            let code_image;

            function onCodeLoaded() {
                ctx.drawImage(code_image, 274, 1003, 202, 202);
                const finalUrl = canvas.toDataURL("img/png");
                parent.removeChild(canvas);
                resolve(finalUrl);
            }

            if (isDom(qrCode)) {
                code_image = qrCode;
                onCodeLoaded();
            } else {
                code_image = new Image();
                code_image.setAttribute("crossOrigin", "anonymous");
                code_image.src = qrCode;
            }
            code_image.onload = onCodeLoaded;
        };
    });
}

/**
 * 手动添加img标签下载图片
 * @param url {string}
 * @returns {Promise}
 */
export function loadImg(url) {
    return new Promise(function (resolve, reject) {
        const img = new Image();
        const parent = document.body;
        img.style.display = "none";
        img.onload = function (ev) {
            parent.removeChild(img);
            resolve();
        };
        img.onabort = img.onerror = function (ev) {
            parent.removeChild(img);
            reject(ev);
        };
        img.src = url;
        parent.append(img);
    });
}

export function getLoadedImg(url) {
    return new Promise(function (resolve, reject) {
        const img = new Image();
        img.onload = function (ev) {
            resolve(img);
        };
        img.onabort = img.onerror = function (ev) {
            reject(ev);
        };
        img.src = url;
    });
}

export function isSelectElement(el: HTMLElement): el is HTMLSelectElement {
    return el.nodeName === "SELECT";
}

export function isInputElement(el: HTMLElement): el is HTMLInputElement {
    return el.nodeName === "INPUT";
}

export function isTextAreaElement(el: HTMLElement): el is HTMLTextAreaElement {
    return el.nodeName === "TEXTAREA";
}


/**
 * @param element
 * @return string
 */
function select(element: HTMLElement) {
    let selectedText;
    if (isSelectElement(element)) {
        element.focus();
        selectedText = element.value;
    } else if (isInputElement(element) || isTextAreaElement(element)) {
        const isReadOnly = element.hasAttribute("readonly");
        if (!isReadOnly) {
            element.setAttribute("readonly", "");
        }
        element.select();
        element.setSelectionRange(0, element.value.length);
        if (!isReadOnly) {
            element.removeAttribute("readonly");
        }
        selectedText = element.value;
    } else {
        if (element.hasAttribute("contenteditable")) {
            element.focus();
        }
        const selection = window.getSelection() as Selection;
        const range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
        selectedText = selection.toString();
    }
    return selectedText;
}

/**
 * 复制文字或html
 * @param target {HTMLElement | string}
 * @return {Promise}
 */
export function copy(target: HTMLElement | string) {
    let el: HTMLElement;
    const isText = typeof target === "string";
    if (isText) {
        const text = target as string;
        el = document.createElement("div");
        el.innerText = text;
        el.style.position = "fixed";
        el.style.left = "-100000px";
        document.body.appendChild(el);
    } else {
        el = target as HTMLElement;
    }
    const p = new Promise(function (resolve, reject) {
        select(el);
        let succeeded;
        try {
            succeeded = document.execCommand("copy");
        } catch (err) {
            succeeded = false;
        }
        if (succeeded) {
            resolve();
            return;
        }
        reject();
    });
    p.finally(function () {
        (window.getSelection() as Selection).removeAllRanges();
        if (isText) {
            document.body.removeChild(el);
        }
    });
    return p;
}

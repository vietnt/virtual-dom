
var LAZY = "lazy";
var NODE = "node";
var TEXT = "text";

var REPLACE_TEXT = "r-text";
var REPLACE_NODE = "r-node";
var UPDATE_ATTR = "u-attr";
var APPEND_LAST = "append-l";
var REMOVE_LAST = "remove-l";
var GO_DOWN = "go-down";
var GO_UP = "go-up";
var STYLE = "css";
var ATTR = "attr";
var EVENT = "event";


function node(tag, attrs, children) {
    return {
        type: NODE,
        tag: tag,
        attrs: attrs,
        children: children
    }
}

function lazy(args, f) {
    return {
        type: LAZY,
        args: args,        
        render: f
    }
}

function text(s) {
    return {
        type: TEXT,
        text: s
    }
}

function style(key, value) {
    return {
        type: STYLE,
        key: key,
        value: value
    }
}

function attribute(key, value) {
    return {
        type: ATTR,
        key: key,
        value: value
    }
}

function on(key, data) {
    return {
        type: EVENT,
        key: key,
        value: data
    }
}

function onFunction(key, f) {
    return {
        type: EVENT,
        key: key,
        map: [f]
    }
}

function makePatch(type, index, data) {
    return { type: type, index: index, data: data}
}

function sameArray(a, b) {    
    if (a === b) return true;

    if (!a.length || a.length !== b.length) return false;

    var same = true;
    var i = a.length;
    while (same && i--) {
        same = a[i] === b[i];
    }
    return same;
}

function attrUniqueKey(a) {
    return a.type + "__" + a.key;
}

function isEmpty(obj){
    if (obj){
        for (var x in obj) return false;
        return true;
    }
    else { return true;}
}

function diffAttrs(a, b) {
    if (a === b) {
        return null;
    }

    var oldMap = {}
    var add = null;
    for (var i = 0; i < a.length; i++) {
        var attr = a[i];
        var key = attrUniqueKey(attr);
        oldMap[key] = attr;
    }

    for (var i = 0; i < b.length; i++) {
        var attr = b[i];
        var key = attrUniqueKey(attr);
        var old = oldMap[key];

        if (old) {            
            oldMap[key] = null;
            if (old.value === attr.value) continue;
        }

        if (add === null) {
            add = [];
        }
        add.push(attr);
    }

    if (add === null && isEmpty(oldMap)) {
        return null;
    }
    else{

        var remove = null;
        for (var k in oldMap){
            var attr = oldMap[k];
            if (attr) {
                if (remove === null) remove = [];
                remove.push(attr);
            }
        }

        if (!add && !remove) return null;

        return { add: add, remove: remove}
    }
}

function diff(a, b, patches, index) {
    if (a === b)
    {
        return;
    }

    if (a.type != b.type) {
        patches.push(makePatch(REPLACE_NODE, index, b));
        return;
    }

    switch (a.type) {
        case LAZY:
            var same = a.render === b.render;
            if (a.orgRender) same = a.orgRender === b.orgRender;            
            if (same){                
                if (sameArray(a.args, b.args)){
                    b.node = a.node;
                    return;
                }
                else {
                    b.node = b.render(b.args);
                    patches.push(makePatch(REPLACE_NODE, index, b.node));
                }
            }
            return;

        case TEXT:
            if (a.text !== b.text) {
                patches.push(makePatch(REPLACE_TEXT, index, b.text));
            }
            return;

        case NODE:                        
            if (a.tag !== b.tag) {
                patches.push(makePatch(REPLACE_NODE, index, b));
                return;
            }
            else {
                var diffAs = diffAttrs(a.attrs, b.attrs);
                if (diffAs) {
                    patches.push(makePatch(UPDATE_ATTR, index, diffAs));
                }

                var go = makePatch(GO_DOWN, index);
                patches.push(go);
                var n = patches.length;

                diffChildren(a.children, b.children, patches, index);

                if (n < patches.length) {
                    patches.push(makePatch(GO_UP, 1));
                }
                else {
                    patches.pop();
                }
            }
    }
}

function mapAttr(attr, f) {
    switch (attr.type) {
        case STYLE:
            return attr;

        case ATTR:
            return attr;

        case EVENT:
            var map = null;
            if (attr.map) {
                map = attr.map.slice();
            } else {
                map = [];
            }
            map.push(f);

            return {
                type: EVENT,
                key: attr.key,
                value: attr.value,
                handler: attr.handler,
                map: map,
            }
    }
}

function map(node, f) {
    switch (node.type) {
        case TEXT:
            return node;

        case LAZY:            
            if (node.node) {
                return {
                    type: LAZY,
                    args: node.args,
                    render: node.render,
                    node: map(node.node, f)
                }
            }
            else {
                let oldRender = node.render;
                return {
                    type: LAZY,
                    args: node.args,
                    orgRender: oldRender,
                    render: function (args) { return map(oldRender(args), f);}
                }
            }

        case NODE:
            var childs = [];
            for (var i = 0; i < node.children.length; i++) {
                childs.push(map(node.children[i], f));
            }

            var attrs = [];
            for (var i = 0; i < node.attrs.length; i++) {
                attrs.push(mapAttr(node.attrs[i], f));
            }

            return {
                type: node.type,
                tag: node.tag,
                attrs: attrs,
                children: childs,
            }
            break;
    }
}

function diffChildren(ac, bc, patches, index) {
    var lengthDiff = bc.length - ac.length;
    if (lengthDiff !== 0) {
        if (lengthDiff > 0) {
            patches.push(makePatch(APPEND_LAST, index, bc.slice(ac.length)));
        }
        else {
            patches.push(makePatch(REMOVE_LAST, index, -lengthDiff));
        }
    }

    var min = Math.min(ac.length, bc.length);
    for (var i = 0; i < min; i++) {
        diff(ac[i], bc[i], patches, i);
    }
}


//keyed? maybe next time

function renderDom (node){
    switch (node.type){
        case TEXT:
            return document.createTextNode (node.text);
            
        case NODE:
            var el = document.createElement(node.tag);

            for (var i = 0; i < node.attrs.length; i++) {
                addAttribute(el, node.attrs[i]);
            }

            for (var i = 0; i < node.children.length; i++){
                var c = node.children[i];
                var domNode = renderDom(c);
                el.appendChild(domNode);
            }
            return el;

        case LAZY:
            var n = node.node || node.render (node.args);
            return renderDom(n);
    }
}

function addAttribute(node, attr){
    switch (attr.type){
        case ATTR:
            node.setAttribute(attr.key, attr.value);
            break;

        case EVENT:
            //node.setAttribute("on_" + attr.key, attr.value);
            node["on_" + attr.key] = attr;
            break;

        case STYLE:
            node.style[attr.key] = attr.value;
            break;
    }
}

function removeAttribute(node, attr){
    switch (attr.type){
        case ATTR:
            console.log("remove attr: " + attr.key);
            node.removeAttribute(attr.key);
            break;

        case EVENT:
            node.removeAttribute("on_" + attr.key);
            break;

        case STYLE:
            node.style[attr.key] = undefined;
            break;
    }
}

function applyPatch(node, patches) {
    var index = 0;
    var stack = [];

    while (index < patches.length) {
        var patch = patches[index];
        switch (patch.type) {
            case GO_DOWN:
                stack.push(node);
                node = node.childNodes[patch.index];
                break;

            case GO_UP:
                for (var i = 0; i < patch.index; i++) 
                    node = stack.pop();
                break;

            case UPDATE_ATTR:
                var update = patch.data;
                var t = node.childNodes[patch.index];

                if (update.add) {
                    for (var i = 0; i < update.add.length; i++) {
                        addAttribute(t, update.add[i]);
                    }
                }

                if (update.remove) {
                    var r = update.remove;
                    for (var i = 0; i < r.length; i++) {
                        removeAttribute(t, r[i]);
                    }
                }
                break;

            case REPLACE_TEXT:
                var text = node.childNodes[patch.index];
                text.replaceData(0, text.length, patch.data);
                break;

            case REPLACE_NODE:
                var child = node.childNodes[patch.index];
                var newNode = renderDom(patch.data);
                child.parentNode.replaceChild(newNode, child);
                break;

            case APPEND_LAST:
                var childs = patch.data;
                for (var i = 0; i < childs.length; i++) {
                    var child = childs[i];
                    var n = renderDom(child);
                    node.appendChild(n);
                }
                break;

            case REMOVE_LAST:
                var count = patch.data;
                for (var i = 0; i < count; i++) {
                    var c = node.lastChild;
                    if (c) {
                        node.removeChild(c);
                    }
                }
                break;
            }

        index++;        
    }    
}

function eventHandler(ev) {
    var evt = ev.target["on_" + ev.type];
    var t = ev.target;
    while (!evt && t) {
        t = t.parentNode;
        if (t) evt = t["on_" + ev.type];
    }

    if (evt) {
        //console.log("event: " + ev.type + " on " + id);
        var value = evt.value;

        if (!value) {            
            switch (t.type) {                
                case "checkbox":
                    value = t.checked;
                    break;

                default:
                    value = t.value;
                    break;
            }
        }

        if (evt.map) {
            for (var i = 0; i < evt.map.length; i++) {
                var f = evt.map[i];
                value = f(value);
            }
        }

        if (ev.currentTarget.vhandler) {
            ev.currentTarget.vhandler(value);
        }
    }
}

function setupEventHandlers(container, eh) {
    container.vhandler = eh;
    if (!container.___event__set) {
        container.___event__set = true;

        var events = ["click", "input", "change"];

        for (var i = 0; i < events.length; i++) {
            var ev = events[i];
            container.addEventListener(ev, eventHandler);
        }
    }
}

function fullRender(vnode, container, eh) {    
    while (container.childNodes.length > 0) {
        container.removeChild(container.firstChild);
    }
    var dom = renderDom(vnode);
    setupEventHandlers(container, eh)
    container.appendChild(dom);
}

function diffRender(onode, vnode, container, eh) {
    var patches = diffHelp(onode, vnode);

    if (patches && patches.length > 0) {
        applyPatch(container, patches, container);
        setupEventHandlers(container, eh);
    }
}

function diffHelp(a, b) {
    var patches = [];
    diff(a, b, patches, 0);
    return patches;
}

var _mod = {};
_mod.lazy = lazy;
_mod.node = node;
_mod.diff = diffHelp;
_mod.fullRender = fullRender;
_mod.text = text;
_mod.attr = attribute;
_mod.style = style;
_mod.on = on;
_mod.onF = onFunction;
_mod.map = map;
_mod.diffRender = diffRender;

window.vdom = _mod;

//export const onCardMountedSymbol = Symbol("onCardMounted"); 

let vue = require("../../../lib/vue3/vue");

export function getComponentStyle(props, defaultStyle){
    let userStyle = props.userStyle;

    let res = vue.ref({
        ...defaultStyle,
        ...userStyle,
    });

    if (res.value.width && typeof res.value.width === "string" && res.value.width.indexOf("px") < 0){
        res.value.width += "px";
    }

    if (res.value.height && typeof res.value.height === "string" && res.value.height.indexOf("px") < 0){
        res.value.height += "px";
    }

    return res;
}

export const onCardMountedSymbol = Symbol(); 
//export let onCardMountedSymbol = {};
export let obj = {};
export function trytry(){
    
}
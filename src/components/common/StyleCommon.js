let vue = require("../../../lib/vue3/vue");

export function getComponentStyle(props, defaultStyle){
    let userStyle = props.userStyle;

    return vue.ref({
        ...defaultStyle,
        ...userStyle,
    });
}
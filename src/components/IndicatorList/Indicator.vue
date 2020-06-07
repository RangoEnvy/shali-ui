<template>
  <div class="indicator" :style="componentStyle" />
</template>
<script lang="ts">
let vue = require("../../../lib/vue3/vue");
import { getComponentStyle } from "../common/StyleCommon";
import { RefObject } from "../common/interface";

export default vue.defineComponent({
  name: "Indicator",
  props: {
    left: {
      default: 0,
      type: Number
    },
    initIndicator: {
      default: () => {},
      type: Function
    },
    activeBackground: {
      default: "",
      type: String
    },
    emptyBackground: {
      default: "",
      type: String
    },
    userStyle: {
      default: {},
      type: Object,
    },
  },
  setup(props) {
    let componentStyle = vue.ref({});
    let defaultStyle = getDefaultStyle();
    componentStyle = getComponentStyle(props, defaultStyle);
    componentStyle.value.left = props.left + "px";

    componentStyle.value.width += "px";
    componentStyle.value.height += "px";

    vue.onMounted(() => {
      let initIndicator = props.initIndicator;
      console.log("indicator mounted");
      if (initIndicator && typeof initIndicator === "function") {
        initIndicator();
      }
    });

    function setSelectIndicator(isSelected) {
      console.log("props.activeBackground: " + props.activeBackground);
      console.log("props.emptyBackground: " + props.emptyBackground);
      if (isSelected) {
        /* componentStyle.value.backgroundImage = `url(${
            props.activeBackground
              ? props.activeBackground
              : "../../assets/defaultIndicatorActive.png"
          })` */
        //componentStyle.value.backgroundColor = props.activeBackground ? props.activeBackground : "black";
        componentStyle.value = {
          ...componentStyle.value,
          backgroundColor: props.activeBackground
            ? props.activeBackground
            : "black",
          bottom: "0px",
        };
      } else {
        /* componentStyle.value.backgroundImage = `url(${
            this.emptyBackground
              ? this.emptyBackground
              : "../../assets/defaultIndicatorEmpty.png"
          })` */
        //componentStyle.value.backgroundColor = props.emptyBackground ? props.emptyBackground : "grey";
        componentStyle.value = {
          ...componentStyle.value,
          backgroundColor: props.emptyBackground
            ? props.emptyBackground
            : "grey",
          bottom: "0px",
        };
      }
    }

    return {
      componentStyle,
      setSelectIndicator
    };
  }
});

function getDefaultStyle() {
  return {
    width: 16,
    height: 16,
    bottom: "0px",
    position: "absolute",
    borderRadius: "50%",
    backgroundColor: "grey"
  };
}
</script>
<style scoped>
</style>

<template>
  <div :style="componentStyle" ref="slideCard">
    <slot></slot>
  </div>
</template>

<script lang="ts">
let vue = require("../../../lib/vue3/vue");
//import { getComponentStyle } from "../common/StyleCommon";
import { RefObject } from "../common/interface";
import { onCardMountedSymbol, obj, trytry, getComponentStyle } from "../common/Common";
export default vue.defineComponent({
  name: "SlideCard",
  props: {
    width: {
      default: 750,
      type: Number
    },
    userStyle: {
      default: {},
      type: Object,
    },
  },
  setup(props, { slots }) {
    // provide(ThemeSymbol, 'dark')
    let slideCard = vue.ref(null);
    let left = vue.ref(0);
    let defaultStyle = {
      height: "200px",
      width: "750px",
      position: "absolute",
      transform: "translateX(" + left.value + "px)",
      transitionDuration: "0"
    };
    let componentStyle = getComponentStyle(props, defaultStyle);
    left.value = componentStyle.value && componentStyle.value.width ? -1 * parseInt(componentStyle.value.width) : -750;
    
    //let onCardMounted: Function = vue.inject(onCardMountedSymbol);
    console.log("slidecard get onCardMounted");
    let onCardMounted: Function = vue.inject(Symbol.for("onCardMounted"));

    vue.onMounted(() => {
      slideCard.value.setLeft = setLeft;
      slideCard.value.slide = slide;
      slideCard.value.slideToCenter = slideToCenter;
      slideCard.value.slideToSide = slideToSide;
      onCardMounted(slideCard);
    })

    function slide(offset){
      left.value += offset;

      componentStyle.value = {
        ...componentStyle.value,
        transform: "translateX(" + left.value + "px)",
        transitionDuration: "0",
      };
      console.log("slide componentStyle.transform: " + componentStyle.value.transform);
    }

    function setLeft(l) {
      left.value = parseInt(l);
      componentStyle.value = {
        ...componentStyle.value,
        transform: "translateX(" + left.value + "px)",
        transitionDuration: "0",
      };
      console.log("setLeft componentStyle.transform: " + componentStyle.value.transform);
    }

    function slideToCenter() {
      // 把卡片滑动到中间
      console.log("slideToCenter");
      left.value = 0;
      componentStyle.value = {
        ...componentStyle.value,
        transform: "translateX(" + left.value + "px)",
        transitionDuration: "0.5s",
      };
    }

    function slideToSide(direction) {
      // 把卡片滑动到两边
      if (direction > 0) {
        console.log("slideToRight");
        left.value = parseInt(componentStyle.value.width);
        componentStyle.value = {
          ...componentStyle.value,
          transform: "translateX(" + left.value + "px)",
          transitionDuration: "0.5s",
        };
      } else {
        console.log("slideToLeft");
        left.value = -1 * parseInt(componentStyle.value.width);
        componentStyle.value = {
          ...componentStyle.value,
          transform: "translateX(" + left.value + "px)",
          transitionDuration: "0.5s",
        };
      }
    }

    return {
      slideCard,
      left,
      componentStyle,
      onCardMounted,
      slide,
      setLeft,
      slideToCenter,
      slideToSide,
    };
  }
});
</script>


<style scoped>
.slideCard {
  position: absolute;
}
.slideToCenter {
  animation: slideToCenter 1s;
  -webkit-animation: slideToCenter 1s;
  /* transform: translateX(0);
  transition-duration: .6s; */
  animation-fill-mode: forwards;
}
.slideToLeft {
  animation: slideToLeft 1s;
  -webkit-animation: slideToLeft 1s;
  /* transform: translateX(-100%);
  transition-duration: .6s; */
  animation-fill-mode: forwards;
}
.slideToRight {
  animation: slideToRight 1s;
  -webkit-animation: slideToRight 1s;
  /* transform: translateX(100%);
  transition-duration: .6s; */
  animation-fill-mode: forwards;
}
@keyframes slideToCenter {
  to {
    left: 0;
    animation-fill-mode: forwards;
  }
}
@keyframes slideToLeft {
  to {
    left: -100%;
    animation-fill-mode: forwards;
  }
}
@keyframes slideToRight {
  to {
    left: 100%;
    animation-fill-mode: forwards;
  }
}
</style>

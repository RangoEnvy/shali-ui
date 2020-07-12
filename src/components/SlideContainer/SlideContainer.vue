<template>
  <div
    class="cardContainer"
    :style="componentStyle"
    :onCardMounted="onCardMounted"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <slot></slot>
    <!-- <indicator-list v-if="isIndicator"
      :width="width"
      :numOfIndicators="numOfCards"
      ref="indicator-list"
      :selectedIndex="selectedIndex"/> -->
  </div>
</template>

<script lang="ts">
let vue = require("../../../lib/vue3/vue");
import IndicatorList from "../IndicatorList/IndicatorList.vue";
//import { getComponentStyle } from "../common/StyleCommon";
import { RefObject } from "../common/interface";
import { onCardMountedSymbol, obj, trytry, getComponentStyle } from "../common/Common";
export default vue.defineComponent({
  name: "SlideCard",
  components: {
      IndicatorList,
  },
  props: {
    width: {
      default: 750,
      type: Number
    },
    userStyle: {
      default: {},
      type: Object,
    },
    isIndicator: {
        default: true,
        type: Boolean,
    }
  },
  setup(props, { slots }) {
    // provide(ThemeSymbol, 'dark')
    let left = vue.ref(0);
    let defaultStyle = {
      height: "200px",
      width: "750px",
      position: "relative",
      transform: "translateX(" + left.value + "px)",
      transitionDuration: "0"
    };
    let componentStyle = getComponentStyle(props, defaultStyle);
    left.value = componentStyle.value && componentStyle.value.width ? -1 * parseInt(componentStyle.value.width) : -750;

    let selectedIndex = vue.ref(0); // 当前显示的卡片
    let cardList = vue.ref([]);     // 卡片引用列表
    let autoInterval = vue.ref(null);   // 轮播setInterval的返回结果，用于重置轮播
    let sumOffset = vue.ref(0);     // 总移动量 大于0代表往右边移动，小于0代表往左边移动
    let lastPosition = vue.ref(0);  // 上一个点的position，用两个点相减拿到本次的滑动
    let width = vue.computed(() => {
        return props.userStyle && props.userStyle.width ? props.userStyle.width : defaultStyle.width;
    })

    let numOfCards = vue.computed(() => {
        return cardList.value.length > 0 ? cardList.value.length : -1;
    })

    function onCardUnmounted(card){
      for (let i = 0; i < cardList.value.length; ++i){
        if (cardList.value[i] === card){
          cardList.value.splice(i, 1);
        }
      }
    }

    function onCardMounted(card){
        cardList.value.push(card);
        selectedIndex.value = 0;

      cardList.value.forEach(card => {
        //console.log("forEach width: " + width.value);
        card.value.setLeft(-parseInt(width.value + ""));
      })

      cardList.value[0].value.setLeft(0);
    }

    function autoPlay(){
      if (cardList.value && cardList.value[selectedIndex.value + 1]){
        cardList.value[selectedIndex.value].slideToSide(-1);
        cardList.value[selectedIndex.value + 1].slideToCenter();
        ++selectedIndex.value;

        if (props.onIndexChange)
          props.onIndexChange(selectedIndex.value);
      }
    }

    function onTouchStart(e) {
      clearInterval(autoInterval.value);

      //console.log(selectedIndex.value);
      lastPosition.value = e.touches[0].clientX;
      sumOffset.value = 0;

      if (cardList.value[selectedIndex.value + 1]) {
        cardList.value[selectedIndex.value + 1].value.setLeft(parseInt(width.value));
      }

      if (cardList.value[selectedIndex.value - 1]) {
        cardList.value[selectedIndex.value - 1].value.setLeft(-parseInt(width.value));
      }
    }

    function onTouchMove(e) {
      if (!e.touches) return;

      let offset = e.touches[0].clientX - lastPosition.value;

      sumOffset.value += offset;
      cardList.value[selectedIndex.value].value.slide(offset);

      if (cardList.value[selectedIndex.value - 1])
        cardList.value[selectedIndex.value - 1].value.slide(offset);

      if (cardList.value[selectedIndex.value + 1])
        cardList.value[selectedIndex.value + 1].value.slide(offset);

      lastPosition.value = e.touches[0].clientX;
    }

    function onTouchEnd(e) {
      //console.log("onTouchEnd offset: " + sumOffset.value);
      if (sumOffset.value < -100 && cardList.value[selectedIndex.value + 1]) {
        // 往右边划到下一个
        //cardList[selectedIndex].slideToRight();

        cardList.value[selectedIndex.value].value.slideToSide(-1);
        cardList.value[selectedIndex.value + 1].value.slideToCenter();
        ++selectedIndex.value;

        if (props.onIndexChange){
          props.onIndexChange(selectedIndex.value);
        }
      } else if (
        sumOffset.value > 100 &&
        cardList.value[selectedIndex.value - 1]
      ) {
        //console.log("往左滑到下一个");
        // 往左边滑到下一个
        //cardList[selectedIndex].slideToLeft();
        cardList.value[selectedIndex.value].value.slideToSide(1);
        cardList.value[selectedIndex.value - 1].value.slideToCenter();
        --selectedIndex.value;

        if (props.onIndexChange){  
          props.onIndexChange(selectedIndex.value);
        }
      } else {
        //console.log("惯性回位");
        // 惯性回位
        if (cardList.value[selectedIndex.value - 1]) {
          //cardList[selectedIndex - 1].slideToLeft();
          cardList.value[selectedIndex.value - 1].value.slideToSide(-1);
        }

        if (cardList.value[selectedIndex.value + 1]) {
          //cardList[selectedIndex + 1].slideToRight();
          cardList.value[selectedIndex.value + 1].value.slideToSide(1);
        }

        cardList.value[selectedIndex.value].value.slideToCenter();
      }

      sumOffset.value = 0;
      lastPosition.value = 0;

      if (props.auto){
        autoInterval.value = setInterval(autoPlay, props.auto);
      }
    }
    
    //vue.provide(onCardMountedSymbol, onCardMounted);
    //console.log("slidecontainer set onCardMounted");
    vue.provide(Symbol.for("onCardMounted"), onCardMounted);
    vue.provide(Symbol.for("onCardUnmounted"), onCardUnmounted);

    return {
      selectedIndex,
      cardList,
      width,
      numOfCards,
      componentStyle,
      onCardMounted,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    };
  }
});
</script>


<style scoped>
.cardContainer {
  overflow-x: hidden;
  position: relative;
}
</style>

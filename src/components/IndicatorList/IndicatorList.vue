<template>
  <div>
    <indicator
      :emptyBackground="emptyBackground"
      :activeBackground="activeBackground"
      :userStyle="userStyle"
      v-for="(left, i) in indicatorsLeft"
      :key="left"
      :ref="el => {indicatorList[i] = el}"
      :left="left"
    ></indicator>
  </div>
</template>
<script lang="ts">
let vue = require("../../../lib/vue3/vue");
import { getComponentStyle } from "../common/StyleCommon";
import { RefArray, RefNumber } from "../common/interface";
//import Indicator from "./Indicator.vue";

// 写在这里，同一个组件的不同实例会share的
let indicatorsLeft : RefArray = vue.ref([]);
let indicatorList : RefArray = vue.ref([]);
let props : Object = vue.ref({});
export default vue.defineComponent({
  name: "IndicatorList",
  components: {
    //Indicator,
  },
  props: {
    width: {
      type: Number,
      default: 750
    },
    numOfIndicators: {
      type: Number,
      default: 0
    },
    selectedIndex: {
      type: Number,
      default: 0
    },
    activeBackground: {
      type: String,
      default: ""
    },
    emptyBackground: {
      type: String,
      default: ""
    },
    indicatorWidth: {
      type: Number,
      default: 16,
    },
    indicatorHeight: {
      type: Number,
      default: 16,
    }
  },
  setup(props, {context, slots}) {
    indicatorsLeft = vue.ref([]);
    indicatorList = vue.ref([]);
    let userStyle : any = props.userStyle || {};

    let indicatorWidth : any = vue.computed(() => {
      return userStyle && userStyle.width ? userStyle.width : 16;
    });

		let numOfIndicators : any = vue.ref(props.numOfIndicators);
    vue.watch(numOfIndicators, (newVal, oldVal) => {
      indicatorsLeft = vue.ref([]);
      indicatorList = vue.ref([]);
      let start : any = (props.width - (newVal * 2 - 1) * indicatorWidth.value) / 2;
      for (let i = 0; i < newVal; ++i) {
        indicatorsLeft.value.push(start + i * 2 * indicatorWidth.value);
      }
    });

		let selectedIndex = vue.ref(props.selectedIndex);
    vue.watch(selectedIndex, (newVal, oldVal) => {
      console.log(`props selectedIndex change: newVal:${newVal}, oldVal: ${oldVal}`);
      for (let i = 0; i < indicatorsLeft.value.length; ++i) {
        if (i === newVal && indicatorList.value[i]) {
          indicatorList.value[i].setSelectIndicator(true);
        } else if (i !== newVal && indicatorList.value[i]) {
          indicatorList.value[i].setSelectIndicator(false);
        }
      }
    });

    vue.watchEffect(() => {
      let newVal = props.selectedIndex;
        for (let i = 0; i < indicatorsLeft.value.length; ++i) {
        if (i === newVal && indicatorList.value[i]) {
          indicatorList.value[i].setSelectIndicator(true);
        } else if (i !== newVal && indicatorList.value[i]) {
          indicatorList.value[i].setSelectIndicator(false);
        }
      }
    })

		initIndicator(props);
		
		vue.onMounted(() => {
			if (indicatorList.value[selectedIndex]){
        indicatorList.value[selectedIndex].setSelectIndicator(true);
			}

			initIndicator(props);
		})

    return {
      indicatorsLeft,
      indicatorList,
      userStyle,
    };
  },
});

function initIndicator(props) {
  if (indicatorList && indicatorList.value && indicatorList.value.length > 0)
    indicatorList.value[0].setSelectIndicator(true);

  indicatorsLeft.value.length = 0;
  let start =
    (props.width - (props.numOfIndicators * 2 - 1) * props.indicatorWidth) / 2;
  for (let i = 0; i < props.numOfIndicators; ++i) {
    indicatorsLeft.value.push(start + i * 2 * props.indicatorWidth);
  }
}
</script>

<style scoped>
</style>
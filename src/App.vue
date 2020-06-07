<template>
    <div>
        <!-- <h1>Hello Vue 3!</h1>
        <button @click="inc">Clicked {{ count }} times.</button> -->
        <!-- <slide-card :width="count"></slide-card> -->
        <!-- <p>{{cold.a.b.c}}</p> -->
        <button @click="add">rangocold</button>
        <!-- <div style="height: 32px;width: 100%;background-color: purple;position: relative;">
            <indicator-list :numOfIndicators="3" :selectedIndex="jiajia"></indicator-list>
        </div> -->

        <!-- <slide-card>
            <indicator-list :ref="happy" :numOfIndicators="3" :selectedIndex="jiajia"></indicator-list>
        </slide-card> -->

        <slide-container>
            <slide-card v-for="num in arr" :key="num">
                <div style="height: 100%;width: 100%;background-color: red;">
                    {{num}}
                </div>
            </slide-card>
        </slide-container>
    </div>
</template>

<script lang="ts">
    let vue = require("../lib/vue3/vue");
    import IndicatorList from "./components/IndicatorList/IndicatorList.vue";
    import SlideCard from "./components/SlideCard/SlideCard.vue";
    import SlideContainer from "./components/SlideContainer/SlideContainer.vue";
    export default vue.defineComponent({
        components: {
            SlideCard,
            IndicatorList,
            SlideContainer,
        },
        setup() {
            let arr = vue.ref([1, 2, 3]);
            let happy = vue.ref(null);
            let obj = {
                a: {
                    b: {
                        c: 1,
                    }
                }
            }
            const cold = vue.ref(obj)
            let jiajia = vue.ref(0);

            const add = () => {
                ++jiajia.value;
                console.log("jiajia: " + jiajia.value);
            }

            const rango = () => {
                cold.value.a.b = {
                    c: Math.random(),
                }
            }

            const inc = () => {
                //count.value++
            }

            return {
                cold,
                inc,
                rango,
                obj,
                jiajia,
                add,
                happy,
                arr,
            }
        },
    });
</script>

<style scoped>
    h1 {
        font-family: Arial, Helvetica, sans-serif;
    }
</style>
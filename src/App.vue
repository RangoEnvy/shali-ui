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
            
        </slide-card> -->
        <input v-model="numOfSlideCard">

        <indicator-list :ref="happy" :numOfIndicators="numOfIndicators" :selectedIndex="jiajia"></indicator-list>

        <slide-container :width="width" :userStyle="userStyle">
            <slide-card v-for="num in arr" :key="num" :userStyle="userStyle">
                <div style="height: 100%;width: 100%;background-color: red;border: black 1px solid;">
                    {{num}}
                </div>
            </slide-card>
        </slide-container>
    </div>
</template>

<script lang="ts">
    let vue = require("../lib/vue3/vue");
    //import IndicatorList from "./components/IndicatorList/IndicatorList.vue";
    import SlideCard from "./components/SlideCard/SlideCard.vue";
    import SlideContainer from "./components/SlideContainer/SlideContainer.vue";
    export default vue.defineComponent({
        components: {
            SlideCard,
            //IndicatorList,
            SlideContainer,
        },
        setup() {
            let numOfSlideCard = vue.ref(3);
            let width = vue.ref(document.documentElement.clientWidth);
            let userStyle = vue.ref({
                width: document.documentElement.clientWidth + 'px',
            });
            let arr = vue.ref([1, 2, 3]);

            vue.watch(numOfSlideCard,
            (num, prevNum) => {
                
                if (!num)
                    return;

                num = parseInt(num);

                if (num > arr.value.length){
                    for (let i = arr.value.length + 1; i <= num; ++i){
                        arr.value.push(i);
                    }
                }else if (num < arr.value.length){
                    arr.value.length = num;
                }
            });

            let numOfIndicators = vue.ref(3);
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
                width, 
                userStyle,
                numOfSlideCard,
                cold,
                inc,
                rango,
                obj,
                jiajia,
                add,
                happy,
                arr,
                numOfIndicators,
            }
        },
    });
</script>

<style scoped>
    body{
        margin: 0;
    }
    h1 {
        font-family: Arial, Helvetica, sans-serif;
    }
</style>
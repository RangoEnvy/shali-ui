<template>
    <div>
        <h1>Hello Vue 3!</h1>
        <button @click="inc">Clicked {{ count }} times.</button>
    </div>
</template>

<script lang="ts">
    import { defineComponent, ref } from '../lib/vue3/vue.global';
    export default defineComponent({
        setup() {
            const count = ref(0)
            const inc = () => {
                count.value++
            }

            return {
                count,
                inc
            }
        }
    });
</script>

<style scoped>
    h1 {
        font-family: Arial, Helvetica, sans-serif;
    }
</style>
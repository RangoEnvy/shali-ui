import { defineComponent } from './lib/vue3/vue.global.js';
declare module '*.vue' {
    const Component: ReturnType<typeof defineComponent>;
    export default Component;
}

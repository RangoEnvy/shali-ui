import { createApp } from '../lib/vue3/vue.global'	// 这里用的是vue3自己编译的包
import App from './App.vue'
createApp(App).mount('#app')

/* createApp(App)
    .use(router)
    .mount('#app') */

// 这里单纯是做输出
import vConsole from "vconsole";
let vconsole = new vConsole();
console.log("hello shali");





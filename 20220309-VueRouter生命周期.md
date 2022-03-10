# 20220309-vue-router 生命周期

导航行为被触发，此时导航未被确认。
在失活的组件里调用离开守卫 beforeRouteLeave。
调用全局的 beforeEach 守卫。
在重用的组件里调用 beforeRouteUpdate 守卫 (2.2+)。
在路由配置里调用 beforeEnter。
解析异步路由组件（如果有）。
在被激活的组件里调用 beforeRouteEnter。
调用全局的 beforeResolve 守卫 (2.5+)，标示解析阶段完成。
导航被确认。
调用全局的 afterEach 钩子。
非重用组件，开始组件实例的生命周期

beforeCreate&created
beforeMount&mounted
触发 DOM 更新。
用创建好的实例调用 beforeRouteEnter 守卫中传给 next 的回调函数。
导航完成

[https://github.com/vuejs/vue-router/blob/v3.0.0/src/history/base.js#L115](https://github.com/vuejs/vue-router/blob/v3.0.0/src/history/base.js#L115)

```C++
const queue: Array<?NavigationGuard> = [].concat(
  // in-component leave guards
  extractLeaveGuards(deactivated),
  // global before hooks
  this.router.beforeHooks,
  // in-component update hooks
  extractUpdateHooks(updated),
  // in-config enter guards
  activated.map(m => m.beforeEnter),
  // async components
  resolveAsyncComponents(activated)
)

runQueue(queue, iterator, () => {
  const postEnterCbs = []
  const isValid = () => this.current === route
  // wait until async components are resolved before
  // extracting in-component enter guards
  const enterGuards = extractEnterGuards(activated, postEnterCbs, isValid)
  const queue = enterGuards.concat(this.router.resolveHooks)
  runQueue(queue, iterator, () => {
    if (this.pending !== route) {
      return abort()
    }
    this.pending = null
    onComplete(route)
    if (this.router.app) {
      this.router.app.$nextTick(() => {
        postEnterCbs.forEach(cb => { cb() })
      })
    }
  })
})
```

## 参考

1.[Vue2.0生命周期（组件钩子函数与路由守卫）](https://segmentfault.com/a/1190000013956945)
# 20220222-Vue computed原理

Vue 源码版本 2.6.10。

失业期间目前面试 7 家，出现 3 次，其中有 2 次是问 computed 和 watch 在使用场景上的区别，1 次是问源码，出现概率就算 15% 吧。

本文示例代码如下：

```html
<div id="app">
  {{ fullString }}
</div>
```

```C++
const vm = new Vue({
  el: '#app',
  data: {
    first: 'first',
    second: 'second'
  },
  computed: {
    fullString () {
      return `${this.first}-${this.second}`
    }
  }
})

setTimeout(_ => {
  vm.first = 'abc'
}, 5000)
```

从 [initComputed](https://github.com/vuejs/vue/blob/e90cc60c4718a69e2c919275a999b7370141f3bf/src/core/instance/state.js#L169) 开始：

```C++
function initComputed (vm: Component, computed: Object) {
  // _computedWatchers 存储所有和 computed 相关的 watcher
  const watchers = vm._computedWatchers = Object.create(null)
  for (const key in computed) {
    const userDef = computed[key]
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    // 创建 watcher
    watchers[key] = new Watcher(
      vm,
      getter || noop,
      noop,
      computedWatcherOptions // { lazy: true }
    )
    if (!(key in vm)) {
      // vm 上添加 name 为 fullString 的 getter
      defineComputed(vm, key, userDef)
    }
  }
}
```

initComputed 做了两件事：

- new Watcher：创建 lazy watcher
- defineComputed：vm 上添加 name 为 fullString 的 getter

## 创建 lazy watcher

watcher 构造函数[源码如下](https://github.com/vuejs/vue/blob/e90cc60c4718a69e2c919275a999b7370141f3bf/src/core/observer/watcher.js#L26)：

```C++
export default class Watcher {
  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    // 本文示例
    // expOrFn: fullString () { 
    //  return `${this.first}-${this.second}`  
    // }
    // options: { lazy: true }
    if (options) {
      this.lazy = !!options.lazy
    }
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
    }
    // lazy 为 true，不会立即触发依赖收集
    this.value = this.lazy
      ? undefined
      : this.get()
  }
}
```

expOrFn 是一个函数，所以 this.getter 是示例代码中的 fullString 方法。构造函数的重点在于 options: { lazy: true }，创建了一个 lazy watcher。lazy watcher 的懒惰体现在两点：

- 构造函数中的懒惰：this.value = this.lazy ? undefined : this.get()，因 lazy 为 true，不会像普通 watcher 一样，立即调用 get
- watcher 更新时的懒惰：dep.notify 通知 watcher 更新时，它懒，它不更新，[源码如下](https://github.com/vuejs/vue/blob/e90cc60c4718a69e2c919275a999b7370141f3bf/src/core/observer/watcher.js#L164)：

```C++
update () {
  // 让它更新，它偏不更新，它懒
  if (this.lazy) {
    // 计算属性是基于它们的响应式依赖进行缓存的
    // dirty: true，表示缓存失效，
    this.dirty = true
  } else if (this.sync) {
    this.run()
  } else {
    queueWatcher(this)
  }
}
```

## vm 上添加 name 为 fullString 的 getter

[defineComputed](https://github.com/vuejs/vue/blob/e90cc60c4718a69e2c919275a999b7370141f3bf/src/core/instance/state.js#L210) 源码如下：

```C++
export function defineComputed (
  target: any,
  key: string,
  userDef: Object | Function
) {
  // 本文示例
  // target: vm
  // key: fullString
  // userDef: fullString () { 
  //  return `${this.first}-${this.second}`  
  // }
  const shouldCache = !isServerRendering()
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : createGetterInvoker(userDef)
    sharedPropertyDefinition.set = noop
  } 
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
```

defineComputed 在 vm 上定义了 name 为 fullString 的 getter。getter 取决于 [createComputedGetter](https://github.com/vuejs/vue/blob/e90cc60c4718a69e2c919275a999b7370141f3bf/src/core/instance/state.js#L241) 的返回结果，源码如下：

```C++
function createComputedGetter (key) {
  return function computedGetter () {
    // 后面会贴的
  }
}
```

## 渲染函数触发依赖收集

从 [mountComponent](https://github.com/vuejs/vue/blob/e90cc60c4718a69e2c919275a999b7370141f3bf/src/core/instance/lifecycle.js#L197) 开始，创建一个和渲染函数关联的 watcher，源码如下：

```C++
updateComponent = () => {
  vm._update(vm._render(), hydrating)
}

new Watcher(vm, updateComponent, noop, {
  before () {
    if (vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'beforeUpdate')
    }
  }
}, true /* isRenderWatcher */)
```

此时 Dep.target 是和渲染函数相关联的 watcher。

updateComponent 最终会调用 vm 的渲染函数，换言之，会读取 vm.fullString，前面为 vm 定义的 getter 会被调用。

```C++
function createComputedGetter (key) {
  return function computedGetter () {
    // 本文示例 key: fullString
    // _computedWatchers: initComputed 函数里写，这里读
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      // 如果缓存失效，重新计算
      if (watcher.dirty) {
        watcher.evaluate()
      }
      // 依赖收集，这里收集的是渲染函数的 watcher
      if (Dep.target) {
        watcher.depend()
      }
      // 返回 vm.fullString 的结果
      return watcher.value
    }
  }
}
```

watcher.dirty 为 true，表示缓存失效，需要重新计算 watcher 的 值，[watcher.evaluate](https://github.com/vuejs/vue/blob/e90cc60c4718a69e2c919275a999b7370141f3bf/src/core/observer/watcher.js#L210) 源码如下：

```C++
evaluate () {
  this.value = this.get()
  // 重新计算后，缓存有效，dirty 为 false
  this.dirty = false
}

get () {
  pushTarget(this)
  let value
  const vm = this.vm
  try {
    // 本文示例 getter fullString () { 
    //  return `${this.first}-${this.second}`  
    // }
    value = this.getter.call(vm, vm)
  } finally {
    popTarget()
    this.cleanupDeps()
  }
  return value
}
```

进入 get 方法后，pushTarget 会改变 Dep.target，此时 Dep.target 是和 computed 属性 fullString 相关联的 watcher。this.getter 是前端定义的 fullString 方法，它会读取 vm.first 和 vm.second，触发两次依赖收集，收集到的是和 computed 属性 fullString 相关联的 watcher。get 方法调用完成后 watch 的值是 'first-second'，dirty 为 false，缓存生效，Dep.target 的值恢复到和渲染函数相关联的 watcher。

[pushTarget](https://github.com/vuejs/vue/blob/e90cc60c4718a69e2c919275a999b7370141f3bf/src/core/observer/dep.js#L58) 和 [popTarget](https://github.com/vuejs/vue/blob/e90cc60c4718a69e2c919275a999b7370141f3bf/src/core/observer/dep.js#L63) 源码如下，可以理解为一个栈，Dep.target 保存的是栈顶的 watcher。

```C++
const targetStack = []

export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
```

fullString 的 getter 还没完成，代码走到了这里，此时 Dep.target 的值恢复到和渲染函数相关联的 watcher，又开始依赖收集，这里收集的是和渲染函数相关联的 watcher。

```C++
function createComputedGetter (key) {
  return function computedGetter () {
    // 执行过的代码删除
    // 从这里开始
    if (Dep.target) {
      watcher.depend()
    }
    // 返回 vm.fullString 的结果
    return watcher.value
  }
}
```

依赖收集完成，如下图：

![computedWatcher](https://raw.githubusercontent.com/xudale/interview/master/assets/computedWatcher.jpeg)


## 运行时

```C++
setTimeout(_ => {
  vm.first = 'abc'
}, 5000)
```

和运行时有关的源码前端都看过了，this.first = 'abc'，间接调用了两个 watcher，第一个 watcher 与 computed 属性有关，执行的代码是：

```C++
update () {
  // lazy 为 true
  if (this.lazy) {
    // 计算属性是基于它们的响应式依赖进行缓存的
    // dirty: true，表示缓存失效，
    this.dirty = true
    // 走到这里返回
  } else if (this.sync) {
    this.run()
  } else {
    queueWatcher(this)
  }
}
```

第二个 watcher 和渲染函数有关，渲染函数会读取 vm.fullString，fullString 的 getter 会被调用，执行的代码是：

```C++
function createComputedGetter (key) {
  return function computedGetter () {
    // 本文示例 key: fullString
    // _computedWatchers: initComputed 函数里写，这里读
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      // 如果缓存失效，重新计算
      if (watcher.dirty) {
        watcher.evaluate()
      }
      // 依赖收集，这里收集的是渲染函数的 watcher
      if (Dep.target) {
        watcher.depend()
      }
      // 返回 vm.fullString 的结果
      return watcher.value
    }
  }
}
```

## 参考

1.[Vue.js 技术揭秘](https://ustbhuangyi.github.io/vue-analysis/)

2.[Vue.js 中文文档](https://cn.vuejs.org/v2/guide/)










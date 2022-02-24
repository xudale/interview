# 20220224-Vue provide/inject 源码分析

失业期间目前面试 7 家，出现 3 次，出现概率 42.86%。

在 2022 年以前，我从来遇到过这道面试题，今年遇到过 3 次。因为 provide/inject 稍微有点冷门，我又确实没用过，所以每次我都回答不知道。为了吃饭，下次我一定要回答知道。

```C++
const count = 3

while(count--) {
  面试官：用过 provide/inject 吗？
  我：没用过	
}
```

本文示例代码：

```html
<div id="app">
  <son></son>
</div>
```

```C++
let Son = Vue.extend({
  template: '<h2>{{ fromParent }}</h2>',
  inject: {
    fromParent: {
      default: 'default'
    },
  }
})
new Vue({
  el: '#app',
  provide: {
    fromParent: '这个字段来自父组件',
  },
  components: {
    Son
  }
})
```

从 [Vue.prototype.init](https://github.com/vuejs/vue/blob/v2.6.10/src/core/instance/init.js#L16) 开始，源码如下：

```C++
Vue.prototype._init = function (options?: Object) {
  callHook(vm, 'beforeCreate')
  // 初始化 inject
  initInjections(vm)
  initState(vm)
  // 初始化 provide
  initProvide(vm) 
  callHook(vm, 'created')
  if (vm.$options.el) {
    vm.$mount(vm.$options.el)
  }
}
```

按照时间顺序，依次是父组件 initProvide，子组件 initInjections，子组件对象添加注入的属性


## 父组件 initProvide

父组件调用 [Vue.prototype.init](https://github.com/vuejs/vue/blob/v2.6.10/src/core/instance/init.js#L16)，因为父组件没有与 inject 相关的属性，所以调用 initInjections 直接返回，[initProvide](https://github.com/vuejs/vue/blob/e90cc60c4718a69e2c919275a999b7370141f3bf/src/core/instance/inject.js#L7) 源码如下：

```C++
export function initProvide (vm: Component) {
  const provide = vm.$options.provide
  if (provide) {
    // 获取父组件的 provide，存储在父组件对象的 _provided 字段
    // 本文示例 vm._provided: { fromParent: '这个字段来自父组件' }
    vm._provided = typeof provide === 'function'
      ? provide.call(vm)
      : provide
  }
}
```

initProvide 获取构造函数参数的 provide 属性，存储在父组件对象的 \_provided 字段上。

## 子组件 initInjections

子组件也调用 [Vue.prototype.init](https://github.com/vuejs/vue/blob/v2.6.10/src/core/instance/init.js#L16)，因为子组件没有与 provide 相关的属性，所以调用 initProvide 直接返回，[initInjections](https://github.com/vuejs/vue/blob/e90cc60c4718a69e2c919275a999b7370141f3bf/src/core/instance/inject.js#L16) 源码如下：

```C++
export function initInjections (vm: Component) {
  // 获取 inject 
  const result = resolveInject(vm.$options.inject, vm)
  if (result) {
    toggleObserving(false)
    Object.keys(result).forEach(key => {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
            `overwritten whenever the provided component re-renders. ` +
            `injection being mutated: "${key}"`,
            vm
          )
        })
      } else {
        defineReactive(vm, key, result[key])
      }
    })
    toggleObserving(true)
  }
}
```

initInjections 调用 [resolveInject](https://github.com/vuejs/vue/blob/e90cc60c4718a69e2c919275a999b7370141f3bf/src/core/instance/inject.js#L39) 获取 inject，源码如下：

```C++
export function resolveInject (inject: any, vm: Component): ?Object {
  // 本文示例 
  // inject: {
  //  fromParent: {
  //    from: 'fromParent',
  //    default: 'default'
  //  }
  // }
  if (inject) {
    const result = Object.create(null)
    const keys = hasSymbol
      ? Reflect.ownKeys(inject)
      : Object.keys(inject)
    // 遍历所有的 inject 中所有的 key
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      // 本文示例 provideKey: 'fromParent'
      const provideKey = inject[key].from
      let source = vm
      // 类似 js 原型链的查找逻辑，在父组件上查找其 _provided 是否拥有 fromParent 属性
      while (source) {
        if (source._provided && hasOwn(source._provided, provideKey)) {
          result[key] = source._provided[provideKey]
          break
        }
        // 找不到，继续向上级父组件查找
        source = source.$parent
      }
    }
    // 本文示例 result: { fromParent: '这个字段来自父组件' }
    return result
  }
}
```

resolveInject 的功能是获取子组件的 inject，核心逻辑是查找父组件的 \_provided 是否包含 key 为 fromParent 的属性，如果没有，继续向上一级父组件查找。

我猜测 initInjections 后面有 s 是因为子组件的 inject，可以来源于多个父组件的 \_provided。

## 子组件对象添加注入的属性

还是之前的代码。

```C++
export function initInjections (vm: Component) {
  // 获取 inject 
  const result = resolveInject(vm.$options.inject, vm)
  if (result) {
    toggleObserving(false)
    Object.keys(result).forEach(key => {
      if (process.env.NODE_ENV !== 'production') {
        // 在子组件上定义 fromParent，并且给 fromParent 定义 setter，修改就报错
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
            `overwritten whenever the provided component re-renders. ` +
            `injection being mutated: "${key}"`,
            vm
          )
        })
      } else {
        defineReactive(vm, key, result[key])
      }
    })
    toggleObserving(true)
  }
}
```

遍历 resolveInject 返回的对象，每一个 key 都调用 defineReactive，从此子组件 vm.fromParent 有了 getter 和 setter。

## 总结

![provideInject](https://raw.githubusercontent.com/xudale/interview/master/assets/provideInject.jpeg)




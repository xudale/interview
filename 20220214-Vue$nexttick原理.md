# 20220214-Vue $nexttick 原理

Vue 源码版本 2.6.10。

失业期间目前面试 7 家，出现 3 次，出现概率 42.85%。

## [源码](https://github.com/vuejs/vue/blob/v2.6.10/src/core/util/next-tick.js)

```C++
export let isUsingMicroTask = false

// 任务队列
const callbacks = []
let pending = false

// 执行 callbacks 中所有任务
function flushCallbacks () {
  pending = false
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}

let timerFunc

// 现在是 2022 年，凭概率讲，进入 if 分支
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    // In problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // Fallback to setImmediate.
  // Techinically it leverages the (macro) task queue,
  // but it is still a better choice than setTimeout.
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // Fallback to setTimeout.
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}

export function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  // 向 callbacks 中插入任务
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  if (!pending) {
    pending = true
    timerFunc()
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}

```

源码很简单，记录几个变量的含义：

- callbacks：任务队列
- nextTick：向 callbacks 插入一个任务
- flushCallbacks：执行 callbacks 中全部任务
- timerFunc：将 flushCallbacks 插入 microtask 队列

现在是 2022 年，Promise 已得到浏览器全面支持，nextTick 的本质是向任务队列插入一个任务，这个任务可以理解为微任务。


## 西二旗某大厂面试题

下面代码，连续改变 3 次 message 后，问调用了几次渲染函数？

```html
<div id="app">
  {{ message }}
</div>
```

```C++
const vm = new Vue({
  el: '#app',
  data: {
    message: 'inited'
  }
})

setTimeout(_ => {
  vm.message = 'changed 1'
  vm.message = 'changed 2'
  vm.message = 'changed 3'
}, 5000)
```

改变 3 次 vm.message 后，渲染函数异步执行，调用了 1 次渲染函数。

vm.message = 'changed 1' 时，[defineReactive](https://github.com/vuejs/vue/blob/v2.6.10/src/core/observer/index.js#L135) 中的 dep.notify 通知 Watcher 更新，[源码如下](https://github.com/vuejs/vue/blob/v2.6.10/src/core/observer/watcher.js#L164)：

```C++
update () {
  /* istanbul ignore else */
  if (this.lazy) {
    this.dirty = true
  } else if (this.sync) {
    this.run()
  } else {
    // 走这里
    queueWatcher(this)
  }
}
```

queueWatcher，向队列里加入当前的 Watcher 对象，[源码如下](https://github.com/vuejs/vue/blob/v2.6.10/src/core/observer/scheduler.js#L164)：

```C++
/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
export function queueWatcher (watcher: Watcher) {
  // 每个 Watcher 对象，都有唯一的 id
  const id = watcher.id
  // has 是 id 的集合，表示 id 有没有插入过
  // 第一次改变 vm.message 前，has[id] 是 null
  // 第二/三次改变 vm.message 前，has[id] 是 true
  if (has[id] == null) {
    has[id] = true
    if (!flushing) {
      // 这里
      queue.push(watcher)
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    // queue the flush
    if (!waiting) {
      waiting = true
      // 又见 nextTick
      nextTick(flushSchedulerQueue)
    }
  }
}
```

queueWatcher 函数取 Watcher 对象的 id，判断 has 对象是否有这个 id，如果没有，has[id] = true，并 queue.push(watcher) 将 watcher 插入 queue。flushSchedulerQueue 的功能是执行 queue 是所有的 Watcher 对象。最后 nextTick(flushSchedulerQueue)，在下一个 microtask，执行 queue 中所有 Watcher(包括渲染函数)，更新界面。

scheduler.js 中的代码与 next-tick.js 中的代码逻辑相似度达 50。盘点下 scheduler.js 中的几个变量：

- queue：Watcher 队列
- queueWatcher：向 queue 插入一个 Watcher
- flushSchedulerQueue：执行 queue 中全部 Watcher

三次改变 vm.message 的值，意味调用了 3 次 queueWatcher(this)。但只有第一次的调用，向 queue 中插入了 Watcher，另外两次调用，被 if (has[id] == null) 拦掉了。所以 queue 中只有 1 个 Watcher 对象，渲染函数只执行 1 次。

本文示例渲染函数如下：

```C++
(function anonymous() {
  with(this) {
    return _c('div',{
      attrs: {
        "id":"app"
      }
    },
    [_v("\n\t  "+_s(message)+"\n\t")])
  }
})
```

## 参考

1.[Vue.js 技术揭秘](https://ustbhuangyi.github.io/vue-analysis/)

2.[Vue.js 中文文档](https://cn.vuejs.org/v2/guide/)










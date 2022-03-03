# 20220225-Vue keep-alive 原理

本文示例代码：

```html
<div id="app">
  <keep-alive>
    <son1 v-if="toggle"></son1>
    <son2 v-else></son2>
  </keep-alive>
</div>
```

```C++
let Son1 = Vue.extend({
  template: '<input type="text" v-model="son1">',
  data() {
    return {
      son1: 'son1'  
    }
  }
})
let Son2 = Vue.extend({
  template: '<input type="text" v-model="son2">',
  data() {
    return {
      son2: 'son2'  
    }
  }
})
const vm = new Vue({
  el: '#app',
  components: {
    Son1,
    Son2
  },
  data: {
    toggle: true
  }
})
```

面试中从来没见过面试官问 include 和 exclude，所以就不贴相关代码了。假定 keep-alive 已经缓存了所有子组件。 

## render 阶段

keep-alive 组件有自定义 [render](https://github.com/vuejs/vue/blob/e90cc60c4718a69e2c919275a999b7370141f3bf/src/core/components/keep-alive.js#L83) 函数，源码如下：

假定 keep-alive 已经缓存了所有子组件。

```C++
render () {
  const slot = this.$slots.default
  // 获取第一个子组件
  const vnode: VNode = getFirstComponentChild(slot)
  const componentOptions: ?VNodeComponentOptions = vnode && vnode.componentOptions
  if (componentOptions) {
    // check pattern
    const name: ?string = getComponentName(componentOptions)
    const { include, exclude } = this
    // 如果不该被缓存，直接返回子组件 vnode
    if (
      // not included
      (include && (!name || !matches(include, name))) ||
      // excluded
      (exclude && name && matches(exclude, name))
    ) {
      return vnode
    }
    // cache 是缓存对象
    const { cache, keys } = this
    const key: ?string = vnode.key == null
      // same constructor may get registered as different local components
      // so cid alone is not enough (#3269)
      ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
      : vnode.key
    // 判断是否在缓存中
    if (cache[key]) {
      // 将缓存中的 componentInstance 赋值给 vnode.componentInstance
      // vnode.componentInstance 是 Vue 的实例
      vnode.componentInstance = cache[key].componentInstance
      // make current key freshest
      remove(keys, key)
      keys.push(key)
    } else {
      cache[key] = vnode
      keys.push(key)
      // prune oldest entry
      if (this.max && keys.length > parseInt(this.max)) {
        pruneCacheEntry(cache, keys[0], keys, this._vnode)
      }
    }
    // 这个属性后面会用到
    vnode.data.keepAlive = true
  }
  // 返回子组件的 vnode
  return vnode || (slot && slot[0])
}
```

render 的逻辑是根据 include 和 exclude 两个参数判断子组件是否应该被缓存。如果不该被缓存，返回子组件的 vnode，注意 keep-alive 组件不会产生真实的 dom 结点，所以会返回子组件的 vnode；如果组件应该被缓存，把缓存中的 componentInstance 赋值给 vnode，返回 vnode。说到底 cache 变量缓存的是组件实例 componentInstance。

## patch 阶段的 

在 patch 阶段，调用 [createComponent](https://github.com/vuejs/vue/blob/e90cc60c4718a69e2c919275a999b7370141f3bf/src/core/vdom/patch.js#L210)，源码如下：

假定 keep-alive 已经缓存了所有子组件。

```C++
function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
  let i = vnode.data
  if (isDef(i)) {
    const isReactivated = isDef(vnode.componentInstance) && i.keepAlive
    if (isDef(i = i.hook) && isDef(i = i.init)) {
      i(vnode, false /* hydrating */)
    }
    if (isDef(vnode.componentInstance)) {
      // componentInstance 是从缓存中取的，进入这个分支
      initComponent(vnode, insertedVnodeQueue)
      insert(parentElm, vnode.elm, refElm)
      if (isTrue(isReactivated)) {
        reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm)
      }
      return true
    }
  }
}

function initComponent (vnode, insertedVnodeQueue) {
  // 将缓存中的 dom 对象赋值给 vnode.elm
  vnode.elm = vnode.componentInstance.$el
}

function insert (parent, elm, ref) {
  nodeOps.appendChild(parent, elm)
}

function appendChild (node: Node, child: Node) {
  // 直接操作 dom
  node.appendChild(child)
}
```

vnode.componentInstance 是从缓存中取的，为真值。initComponent 会 vnode.elm = vnode.componentInstance.$el，将缓存中的 dom 节点赋值给 elm。insert 会调用浏览器 dom API，将 vnode.elm 插入 dom。

## 总结

keep-alive 核心原理就两句话：

- render 阶段将缓存中的组件实例 componentInstance，赋值给子组件的 vnode，返回
- patch 阶段将缓存中的子组件 dom 节点：vnode.componentInstance.$el，插入 dom

## 参考

1.[彻底揭秘keep-alive原理](https://juejin.cn/post/6844903837770203144)






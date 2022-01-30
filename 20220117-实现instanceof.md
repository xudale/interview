# 20220117-实现 instanceof

```JavaScript
// 1.typeof 记少不记多，特殊的就两个：typeof null == 'object'; typeof console.log == 'function'
// 2.非对象调用 instanceof 返回 false，Object.getPrototypeOf(1) 是返回原型的
function myInstanceof(child, parent) {
	if (['object', 'function'].includes(typeof child)) {
		while(child) {
			child = Object.getPrototypeOf(child)
			if (child == parent.prototype) {
				return true
			}
		}	
	}
	return false
}
```

自定义某个类上的 instanceof。

```JavaScript
class Test {
	static [Symbol.hasInstance](x) {
		return true
	}
}
```

看完第二段代码，再看第一段代码，就有问题了。

```JavaScript
myInstanceof(1, Test) // false
1 instanceof Test // true
```

英文网站上没搜到答案，如果写成这样就失去这道面试题的意义了。

```JavaScript
function myInstanceof(child, parent) {
	return parent[Symbol.hasInstance](child)
}
```






















# 20220127-实现 Object.assign

Object.assign() 方法用于将所有可枚举属性的值从一个或多个源对象分配到目标对象。它将返回目标对象。

## 答案

```JavaScript
Object.assign = function(target, ...sources) {
	if (target == null) {
		throw new Error('cant convert null or undefined to object')
	}
	for (let source of sources) {
		if (source == null) {
			continue
		}
		const descriptors =  Object.keys(source).reduce((descriptors, key) => {
			descriptors[key] = Object.getOwnPropertyDescriptor(source, key)
			return descriptors
		}, {})

		Object.getOwnPropertySymbols(source).reduce((descriptors, key) => {
			const descriptor = Object.getOwnPropertyDescriptor(source, key)
			if (descriptor.enumerable) {
				descriptors[key] = descriptor
			}
			return descriptors
		}, descriptors)

		Object.defineProperties(target, descriptors)
	}
	return target
}
```

测试

```JavaScript
const o1 = { a: 1 };
const o2 = { [Symbol('foo')]: 2 };
Object.defineProperty(o2, Symbol('x'), {
	enumerable: false,
	value: '33'
})
const o3 = {}
const o4 = null

const obj = Object.assign(o3, o1, o2, o4);
console.log(obj);
```

如果用 Reflect.ownKeys 代码量会减少。

```JavaScript
Object.assign = function(target, ...sources) {
	if (target == null) {
		throw new Error("cannot convert null or undefined to object")
	}
	sources.forEach(source => {
		if (source == null) {
			return
		}
		const descriptors = Reflect.ownKeys(source).reduce((descriptors, key) => {
			const descriptor = Object.getOwnPropertyDescriptor(source, key)
			if (descriptor.enumerable) {
				descriptors[key] = descriptor
			}
			return descriptors
		}, {})
		Object.defineProperties(target, descriptors)
	})
	return target
}
```

面试时，我写的答案是这样的，第一次腾讯会议共享屏幕，还不太习惯。

```JavaScript
Object.assign = function(target, ...args) {
	for (let i = 0; i < args.length; i++) {
		const cur = args[i]
		Object.keys(cur).forEach(key => {
			target[key] = cur[key]
		})
	}
	return target
}
```


写这篇主要是为了用几个 api，Object.getOwnPropertyDescriptor、Object.getOwnPropertySymbols、Object.defineProperties。

## 参考 

1.[Object.assign()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)




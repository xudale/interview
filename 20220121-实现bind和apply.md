# 20220121-实现bind和apply

```JavaScript
Function.prototype.call = function(thisArg, ...args) {
	thisArg = thisArg || window
	thisArg.fn = this
	// 使用...的优势是 args 肯定是数组，至少也是空数组
	const result = thisArg.fn(...args)
	delete thisArg.fn
	return result
}
```

```JavaScript
Function.prototype.apply = function(thisArg, args) {
	// args 可能传了，也可能没传，需要判断
	if (args !== undefined && !Array.isArray(args)) {
		throw('args must be array')
	}
	thisArg = thisArg || window
	thisArg.fn = this
	const result = args ? thisArg.fn(...args) : thisArg.fn()
	delete thisArg.fn
	return result
}
```

网上常见答案是用 eval 实现 thisArg.fn。

```JavaScript
Function.prototype.apply = function(thisArg, args) {
	if (args !== undefined && !Array.isArray(args)) {
		throw('args must be array')
	}
	thisArg = thisArg || window
	thisArg.fn = this
	let result
	if (args) {
		args = args.map((item, i) => `args[${i}]`)
		// 此时 args 是 ['args[0]', 'args[1]', 'args[2]']
		// `thisArg.fn(${args})` 是 thisArg.fn(args[0],args[1],args[2])
		const result = eval(`thisArg.fn(${args})`)

	} else {
		result = thisArg.fn()
	}
	delete thisArg.fn
	return result
}
```

## 参考

1.[js 实现call和apply方法，超详细思路分析](https://www.cnblogs.com/echolun/p/12144344.html)






























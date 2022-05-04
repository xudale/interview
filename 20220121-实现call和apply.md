# 20220121-实现 bind 和 apply

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
  if (args != null && !Array.isArray(args)) {
    throw('args must be array')
  }
  thisArg = thisArg || window
  const fnSymbol = Symbol('fn')
  thisArg[fnSymbol] = this
  let result 
  if (args) {
    const args1 = args.map((item, i) => `args[${i}]`)
    // 此时 args 是 ['args[0]', 'args[1]', 'args[2]']
    // `thisArg[fnSymbol](${args1})` 是 thisArg[fnSymbol](args[0],args[1],args[2])
    result = eval(`thisArg[fnSymbol](${args1})`)
  } else {
    result = thisArg[fnSymbol]()
  }
  delete thisArg[fnSymbol]
  return result
}
```

## 参考

1.[js 实现call和apply方法，超详细思路分析](https://www.cnblogs.com/echolun/p/12144344.html)

2.[Implement your own — call(), apply() and bind() method in JavaScript](https://medium.com/@ankur_anand/implement-your-own-call-apply-and-bind-method-in-javascript-42cc85dba1b)






























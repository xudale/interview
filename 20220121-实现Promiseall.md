# 20220121-实现Promise.all

在业务代码中 Promise.all 我用过 1-2 次，写完之后觉得可读性较差，后来通过 async 函数里面连续使用多个 await 重构了。在这场面试之前，从来没手写过 Promise.all，MDN 文档也没看过。能写出来个大概，我还是比较满意的。我在面试时手写的 Promise.all 不足之处有：

- 只考虑 all 参数为数组的情况，事实上 all 接收的参数是可迭代对象，包括数组、字符串和 Set 等
- 没有考虑可迭代对象为空的情况，比如空数组，应同步改变 promise 的状态

```JavaScript
Promise.all = function(iterable) {
	if (iterable != null && typeof iterable[Symbol.iterator] == 'function') {
		const promiseList = [...iterable]
		return new Promise((resolve, reject) => {
			if (promiseList.length) {
				const resultList = new Array(promiseList.length)
				let count = 0
				promiseList.forEach((promise, i) => {
					Promise.resolve(promise).then(result => {
						resultList[i] = result
						if (++count == promiseList.length) {
							resolve(resultList)
						}
					}, reason => {
						reject(reason)
					})
				})	
			} else {
				resolve([])
			}	
		})
	} else {
		throw `${iterable} is not iterable`	
	}
}
```

Promise.all 当且仅当传入的可迭代对象为空时为同步：

```JavaScript
var p = Promise.all([]); // will be immediately resolved
var p2 = Promise.all([1337, "hi"]); // non-promise values will be ignored, but the evaluation will be done asynchronously
console.log(p);
console.log(p2)
setTimeout(function(){
    console.log('the stack is now empty');
    console.log(p2);
});

// logs
// Promise { <state>: "fulfilled", <value>: Array[0] }
// Promise { <state>: "pending" }
// the stack is now empty
// Promise { <state>: "fulfilled", <value>: Array[2] }
```

适用于 iterable 对象：

```JavaScript
const iterableObj = {
	localArray: [1, Promise.resolve(2)],
	[Symbol.iterator]() {
		let start = 0
		return {
			next: _ => {
				if (this.localArray.length == start) {
					return {
						done: true
					}
				} else {
					return {
						done: false,
						value: this.localArray[start++]
					}	
				}
				
			}
		}
	}
}

const p = Promise.all(iterableObj)

p.then(values => {
	console.log(values)
})
// logs
// [1, 2]
```

```JavaScript

Promise.all('abc').then(char => {
	console.log(char)
})
.catch(_ => {
	console.log('fail')
})
// logs
// ['a', 'b', 'c']
```

网上众多实现里面，大多没有考虑参数是 iterable。为了加深记忆，下面贴一段 V8 源码：

```C++
transitioning macro PerformPromiseAll<F1: type, F2: type>(
    implicit context: Context)(
    // iter 参数，是个 iterable 对象
    nativeContext: NativeContext, iter: iterator::IteratorRecord,
    constructor: Constructor, capability: PromiseCapability,
    promiseResolveFunction: JSAny, createResolveElementFunctor: F1,
    createRejectElementFunctor: F2): JSAny labels
Reject(Object) {}
```

```JavaScript
const obj = {
	0: 1,
	1: 2,
	length: 2
}

Promise.all(obj).then(char => {
	console.log(char)
})
// 类数组不是 iterable，要报错
```

## 参考

1.[Promise.all()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
2.[致全网那些所谓的手写Promise.all](https://zhuanlan.zhihu.com/p/362648760)






























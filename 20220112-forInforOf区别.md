# 20220112-for in/for of 区别

我没答上来，大脑一片空白。用倒是会用，但说不出来。

## 问题

for in 和 for of 有什么区别？

## 答案

for in 遍历属性，for of 遍历值。区别如下：

```JavaScript
Object.prototype.objCustom = function() {};
Array.prototype.arrCustom = function() {};

const iterable = [3, 5, 7];
iterable.foo = 'hello';

for (const i in iterable) {
  console.log(i); // logs "0", "1", "2", "foo", "arrCustom", "objCustom"
}

for (const i in iterable) {
  if (iterable.hasOwnProperty(i)) {
    console.log(i); // logs "0", "1", "2", "foo"
  }
}

for (const i of iterable) {
  console.log(i); // logs 3, 5, 7
}
```

for of 遍历对象会报错。

```JavaScript
const iterable = {};

for (const value of iterable) {
  console.log(value);
} // Uncaught TypeError: iterable is not iterable
```

实现 Symbol.iterator 方法，并且 Symbol.iterator 的返回值符合 iterator protocol，则对象变为可迭代对象。for of 不报错。

```JavaScript
const iterable = {
	i: 3,
	[Symbol.iterator] () {
		return {
			next: _ => {
				if (this.i < 10) {
					return {
						done: false,
						value: this.i++
					}
				} else {
					return {
						done: true
					}
				}
			}
		}
	}
};

for (const value of iterable) {
  console.log(value);
} // 打印 3、4、5、6、7、8、9
```

## 总结

for in 遍历 key，for of 的结果取决于迭代器，二者没什么联系。

## 参考

1.[for...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of)

2.[Iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol)

















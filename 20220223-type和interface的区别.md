# 20220223-type和interface的区别

失业期间遇到的唯一一道和 typescript 的题目。这是一道背诵题，笼统的说，interface 声明类型，type 给类型起别名，类似 C/C++ 的 typedef。type 和 interface 的主要区别在于 type 可以给类型取别名。

## 问题

typescript 中 type 和 interface 有哪些区别？

## 答案

type 可以声明基本类型别名、联合类型、元祖等类型。

```C++
type AppName = string
type AppType = string
type AppSize = number
```

```C++
type AppName = string | undefined
type AppType = 'mobile' | 'web' | 'desktop'
type AppSize = number | bigint
```

```C++
type Developer = {
  devName: string
}
type Tester = {
  testerName: string
}
type Employee = Developer & Tester
```

```C++
type App = [name: string, type: 'mobile' | 'web' | 'desktop']
```

```C++
const three = 3;
type B = typeof three;
```

interface 可以声明合并。

```C++
interface App {
  name: string
}
interface App {
  type: 'mobile' | 'web' | 'desktop'
}
// TypeScript will automatically merge both App declarations into one
const app: App = {
  name: 'facebook',
  type: 'mobile'
}
```

interface 可以继承。

```C++
interface Developer {
  devName: string
}
interface Tester {
  testerName: string
}
interface Employee extends Developer, Tester {}
```
## 总结

大的区别就两点：

- type 类似 C/C++ typedef 的功能，interface 没有
- interface 可以声明合并

## 参考



1.[Interfaces vs Types in TypeScript](https://itnext.io/interfaces-vs-types-in-typescript-cf5758211910)

2.[type vs interface in TypeScript](https://dev.to/saadsharfuddin/type-vs-interface-in-typescript-35i6)
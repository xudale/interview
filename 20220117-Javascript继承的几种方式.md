# 20220117-Javascript继承的几种方式

我比较讨厌这个问题，原因是 C++/Java 实现继承的方式只有一种，Javascript 有 N 种(N > 5)。而且这 N 种实现继承的方式里，最常用最实用的是和 C++/Java 相似的那种继承。其它的继承方式，尤其是在 ES6 class 关键词出现后，几乎用不上。工作中用的是巧克力(class)，面试时却问屎的味道(借用构造函数继承、原型式继承等)，忆屎思甜。

全文参考红宝书第三版 6.3 节。

## 原型链继承

```JavaScript
function Parent() {
  // 缺点：share 被所有 son1/son2/son3 共享了
  this.share = [1, 2, 3];
}
Parent.prototype.Say = function(){
  console.log(this.share);
}
function Son(){};
Son.prototype = new Parent();
son1 = new Son();
son1.Say();
```

## 借用构造函数继承

```JavaScript
function Parent(name){
  this.name = name;
}
function Son(name){
  Parent.call(this, name);
}
// 缺点：只继承的属性，没继承到方法
son1 = new Son('son1');
console.log(son1.name);// son1
son2 = new Son('son2');
console.log(son2.name);// son2
```

## 组合继承

结合前两者，双截棍 + 龙拳 = 霍元甲。

```JavaScript
function Parent(name){
  this.name = name;
}
Parent.prototype.Say = function(){
  console.log(this.name);
}
function Son(name){
  // 借用构造函数
  Parent.call(this,name);
}
// 原型链继承，这里调用了 Parent，其实可以优化
Son.prototype = new Parent();
son1 = new Son('son1');
son2 = new Son('son2');

console.log(son1.Say()); // son1
console.log(son2.Say()); // son2
```

## 原型式继承

```JavaScript
const person = {
  name: false,
};

// person 是 me 的原型
const me = Object.create(person);
```

## 寄生组合式继承

```JavaScript
function Parent(name){
  this.name = name;
}
Parent.prototype.Say = function(){
  console.log(this.name);
}
function Son(name){
  Parent.call(this,name);
}
// 以下两行体现寄生组合式继承与组合式继承的区别
// Parent.prototype 相当于寄生在原型链上了
Son.prototype = Object.create(Parent.prototype);
Son.prototype.constructor = Son

son1 = new Son('son1');
son2 = new Son('son2');

console.log(son1.Say()); // son1
console.log(son2.Say()); // son2
```

## ES6 继承

```JavaScript
class Parent {
    constructor(name) {
        this.name = name
    }
    Say() {
        console.log(this.name);
    }
}

// extends 相当于原型链继承
class Son extends Parent {
    constructor(name) {
        // 相当于借用构造函数继承
        super(name)
    }
    Speak() {
        console.log(this.name);
    }
}

const son = new Son('son');
```

## 各种继承的关键代码

```JavaScript
Son.prototype = new Parent(); // 原型链继承
Parent.call(this, name); // 借用构造函数继承
const me = Object.create(person); // 原型式继承
Son.prototype = Object.create(Parent.prototype); // 寄生组合式继承
```

ES6 的 extends 被编译成寄生组合式继承。C++/Java 继承的最终效果至少相当于 JavaScript 的组合式继承。






















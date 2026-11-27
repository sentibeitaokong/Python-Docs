---
outline: [2, 3]
---

# 继承与多态 (Inheritance and Polymorphism)

继承让子类复用父类的行为，只改写有差异的部分；多态让调用方只依赖共同接口，不关心具体类型。两者配合时，真正决定行为的是 **MRO** 和 **super()**，而不是“父类”这个模糊说法。

> [!TIP] 相关阅读
> 类的创建与 `self` 见 [类与实例](/pythonBasics/oop/classesAndInstances)；抽象接口与结构化类型见 [抽象基类与协议](/pythonBasics/oop/abcAndProtocols)；运算符重写见 [魔术方法](/pythonBasics/oop/magicMethods)。

## 1. 继承的基本形态

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return f'{self.name} 发出声音'


class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)
        self.breed = breed

    def speak(self):
        return f'{super().speak()}：汪汪'


print(Dog('旺财', '柴犬').speak())  # 旺财 发出声音：汪汪
print(isinstance(Dog('旺财', '柴犬'), Animal))  # True
```

子类自动拥有父类的属性和方法；在子类里重新定义同名方法叫**方法重写**（override）。`Dog.speak` 先调用 `super().speak()`，再追加自己的内容，这是**扩展而非替换**。完全不调用父类实现不是禁止，但调用方如果依赖父类行为，就可能被破坏。

## 2. MRO 与 C3 线性化

Python 支持多继承，属性查找顺序由**方法解析顺序**（Method Resolution Order，MRO）决定。MRO 是一个线性列表，由 C3 算法合并父类顺序，保证三点：子类在父类之前、多个父类按声明顺序、每个类只出现一次。

```python
class A:
    pass


class B(A):
    def who(self):
        return 'B'


class C(A):
    pass


class D(B, C):
    pass


print([cls.__name__ for cls in D.__mro__])
# ['D', 'B', 'C', 'A', 'object']
print(D().who())  # B
```

`D().who()` 找到 `B` 的实现，因为 `B` 在 MRO 中排在 `C` 前面。`D.__mro__` 是元组，`D.mro()` 返回同样的列表。

当父类顺序无法同时满足局部优先级和单调性时，类的创建会直接失败，抛出 `TypeError: Cannot create a consistent MRO`。这不是运行时才炸，而是执行 `class` 语句时就报错；遇到它先检查继承顺序是否自相矛盾。

## 3. super() 的正确用法

`super()` 返回一个代理，属性查找从**当前类在 MRO 中的下一个类**开始，不是简单地“找父类”。

```python
class Animal:
    def __init__(self, name):
        self.name = name
        self.energy = 100


class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)
        self.breed = breed


d = Dog('旺财', '柴犬')
print(d.name, d.energy, d.breed)  # 旺财 100 柴犬
```

`super(Dog, self).__init__(name)` 是显式写法，效果相同，但类名改名时要同步修改。直接写 `Animal.__init__(self, name)` 看起来也能跑，却会跳过 MRO 中的兄弟类，菱形继承下可能重复或漏调用——这正是 `super()` 存在的意义。

零参数的 `super()` 依赖编译器为方法生成的 `__class__` 闭包，只能在类体内的方法中使用。在 `classmethod` 里它同样有效，代理会绑定到 `cls`。

### 3.1 协作式多继承

多继承中的每个类只处理自己的参数，剩下的 `**kwargs` 继续往上传，让整条 MRO 链都跑一遍：

```python
class LoggerMixin:
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        print(f'[LOG] 创建 {type(self).__name__}')


class TimestampMixin:
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.created = '2026-01-01'


class User(LoggerMixin, TimestampMixin):
    def __init__(self, name):
        super().__init__()
        self.name = name


u = User('Ada')  # 先设置 created，再由 LoggerMixin 打印 [LOG] 创建 User
```

`User` 的 MRO 是 `User → LoggerMixin → TimestampMixin → object`。`User` 调 `super()`，进 `LoggerMixin`；它再调 `super()`，进 `TimestampMixin`；最后到 `object`，然后逐层返回。每个类都只出现一次。

链条末端是 `object.__init__`，它不接受多余参数。所以最外层要确保传下去的关键字参数已经被某个类消费掉，否则会得到 `TypeError`。

## 4. 多态、鸭子类型与类型检查

多态指调用方只依赖 `speak()` 这个接口，不关心对象具体是什么类。把 `Dog` 和任意实现了 `speak()` 的对象放进同一个列表逐个调用，循环里不需要任何类型判断。鸭子类型更进一步：不看类型，只看对象有没有需要的方法，不需要继承任何基类。

[width(19,26,55)]

| 方式         | 依赖                 | 检查时机                      |
| :----------- | :------------------- | :---------------------------- |
| 继承重写     | 共同基类             | 运行时，靠方法查找            |
| 鸭子类型     | 方法名和签名         | 运行时，出错才知道            |
| ABC/Protocol | 显式接口或结构化协议 | ABC 运行时，Protocol 静态检查 |

内置的 `isinstance`、`issubclass` 用来做运行时判断：

```python
print(isinstance(d, Animal))    # True
print(issubclass(Dog, Animal))  # True
print(isinstance(True, int))    # True，bool 是 int 的子类
```

`collections.abc` 等抽象基类支持**虚拟子类注册**：调用 `Sequence.register(MyRange)` 之后，`isinstance(MyRange(), Sequence)` 为 `True`，即使 `MyRange` 没有继承 `Sequence`。注册只影响 `isinstance`/`issubclass`，不会改变 MRO，也不会带来 `index`、`count` 这些 mixin 方法。细节见 [抽象基类与协议](/pythonBasics/oop/abcAndProtocols)。

## 5. 多继承、mixin 与类钩子

### 5.1 mixin 模式

mixin 是只提供一小块能力、通常不单独实例化的类，习惯以 `Mixin` 结尾。它适合放日志、序列化、权限检查这类横切功能，不应该和主类争抢同一个属性。

好的 mixin 通常没有自己的 `__init__`，或者只写协作式 `__init__(**kwargs)` 并调用 `super()`。如果 mixin 需要保存状态，优先用组合，而不是继续往继承链上堆。

### 5.2 菱形继承与 super 协作链

```python
class A:
    def ping(self):
        return ['A']


class B(A):
    def ping(self):
        return ['B'] + super().ping()


class C(A):
    def ping(self):
        return ['C'] + super().ping()


class D(B, C):
    def ping(self):
        return ['D'] + super().ping()


print(D().ping())  # ['D', 'B', 'C', 'A']
```

这条链上 `A.ping` 只执行一次。如果每个类都写 `A.ping(self)`，在菱形结构里 `A` 会被调用两次，状态可能被重复修改。`super()` 的意义不是“调用父类”，而是“继续走 MRO”。

### 5.3 `__init_subclass__` 与类注册表

`__init_subclass__` 是隐式的类方法，在子类创建完成后自动调用。在基类里写 `Plugin.registry[cls.__name__] = cls`，所有子类一创建就会自动登记，不需要手写装饰器：

```python
class Plugin:
    registry = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        Plugin.registry[cls.__name__] = cls


class JsonPlugin(Plugin):
    pass


class CsvPlugin(Plugin):
    pass


print(list(Plugin.registry))  # ['JsonPlugin', 'CsvPlugin']
```

它比元类轻量，能拿到子类对象，但拿不到类体内部的细节。需要改命名空间、拦截属性定义时，才轮到元类。

## 6. 组合优于继承

继承表达 **is-a**（是一种），组合表达 **has-a**（拥有一个）。多数“想复用代码”的场景其实是 has-a：

```python
class Engine:
    def start(self):
        return '引擎启动'


class Car:
    def __init__(self):
        self.engine = Engine()

    def start(self):
        return f'汽车：{self.engine.start()}'


print(Car().start())  # 汽车：引擎启动
```

[width(16,42,42)]

| 判断     | 用继承                     | 用组合                       |
| :------- | :------------------------- | :--------------------------- |
| 关系     | 子类确实是父类的一种       | 一个对象拥有另一个对象       |
| 复用目标 | 复用接口和默认实现         | 只复用实现，不想暴露全部接口 |
| 变化方式 | 父类稳定，子类只改少量行为 | 部件可替换、可独立测试       |
| 代价     | 父类改动影响所有子类       | 需要多写转发代码             |

经典反例是 `class Stack(list)`：继承把 `append`、`insert`、`sort` 全部暴露给使用者，栈“只能从一端进出”的约束形同虚设。用组合包一个内部列表，只暴露 `push`、`pop`、`peek`，语义才受控。

判断标准很简单：如果你说不清“子类是一种父类”，或者子类只需要父类的一两个方法，就用组合。

## 7. 常见陷阱

### 7.1 菱形继承

多个父类共享同一个祖先时，不用 `super()` 而直接写 `A.method(self)`，祖先方法会被重复执行。统一走协作式 `super()` 链，是避免这类问题的基本要求。

### 7.2 忘记调用父类初始化

子类一旦定义 `__init__`，就覆盖了父类的版本。如果父类还负责设置 `energy`、`created_at` 之类的状态，漏掉 `super().__init__(...)` 后这些属性根本不存在，错误会延迟到第一次使用时才以 `AttributeError` 出现。除非你明确要完全接管，否则第一件事就是调用父类初始化。

### 7.3 用继承表达 is-a 失误

`Stack(list)`、`class User(dict)` 都属于“为了复用几个方法，继承了不合适的接口”。继承会把父类的全部公开行为带给子类，包括你不希望使用者调用的部分。

### 7.4 重写破坏里氏替换

子类对象应该能在不破坏程序正确性的前提下替换父类对象，这叫里氏替换原则（LSP）。数学上“正方形是矩形”，但行为契约未必成立：

```python
class Rectangle:
    def __init__(self, width, height):
        self.width, self.height = width, height

    def set_width(self, width): self.width = width
    def set_height(self, height): self.height = height
    def area(self): return self.width * self.height


class Square(Rectangle):
    def set_width(self, width): self.width = self.height = width
    def set_height(self, height): self.width = self.height = height


def grow(rect: Rectangle):
    rect.set_width(4)
    rect.set_height(5)
    return rect.area()


print(grow(Rectangle(1, 1)))  # 20
print(grow(Square(1)))        # 25，违反调用方预期
```

调用方按“宽高可以独立设置”的契约使用 `Rectangle`，`Square` 破坏了这个前提。这类场景应该让两者都实现一个 `Shape` 接口，或者用组合，而不是让 `Square` 继承 `Rectangle`。

## 8. 小结

[width(18,82)]

| 关键点  | 说明                                                         |
| :------ | :----------------------------------------------------------- |
| 继承    | 复用父类行为，子类只改写差异；优先扩展，不要整体替换         |
| MRO     | C3 线性化决定属性查找顺序，冲突的继承顺序在定义类时就报错    |
| super() | 沿 MRO 找下一个实现，多继承协作的关键，不等于“父类”          |
| 多态    | 调用方依赖接口；鸭子类型、ABC、Protocol 是三种不同强度的约束 |
| mixin   | 小块可复用能力，保持无状态或协作式初始化                     |
| 组合    | 说不清 is-a 时优先组合；继承会暴露父类的全部接口             |

**一句话理解**：继承是“沿 MRO 往下找”，多态是“只管接口不管类型”；拿不准就组合，别为了少写几行代码把不合适的接口继承进来。

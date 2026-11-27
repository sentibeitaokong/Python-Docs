---
outline: [2, 3]
---

# 属性管理与描述符 (Properties and Descriptors)

`@property` 把一个方法伪装成属性，让赋值、读取、删除都能经过自定义逻辑；描述符则是更底层的机制，`property`、函数、`classmethod` 全都建立在它之上。理解描述符，才能解释“为什么这个属性有时被实例字典遮住，有时又不会”。

> [!TIP] 相关阅读
> 类属性与实例属性的基础见 [类与实例](/pythonBasics/oop/classesAndInstances)；`__getattr__` 等钩子见 [魔术方法](/pythonBasics/oop/magicMethods)；`@classmethod` 与装饰器的通用写法见 [装饰器](/pythonBasics/functions/decorators)。

## 1. @property 的 getter、setter 与 deleter

最直接的用法是把字段改成受控属性：外部仍然写 `c.radius`，但读取和赋值都会经过方法。

```python
class Circle:
    def __init__(self, radius):
        self.radius = radius  # 会触发 setter

    @property
    def radius(self):
        """半径，必须非负。"""
        return self._radius

    @radius.setter
    def radius(self, value):
        if value < 0:
            raise ValueError('半径不能为负')
        self._radius = value

    @radius.deleter
    def radius(self):
        del self._radius


c = Circle(2)
print(c.radius)  # 2
c.radius = 3
print(c.radius)  # 3
del c.radius
# print(c.radius)  # AttributeError: 'Circle' object has no attribute '_radius'
```

`@property` 把 `radius` 变成一个 `property` 对象，`@radius.setter` 和 `@radius.deleter` 基于它派生出新的 property。三个函数共用同一个名字，但内部用 `_radius` 存真实数据，避免和属性名冲突。

只写 getter、不写 setter 就是只读属性：读取正常，赋值直接抛 `AttributeError`（提示 property 没有 setter）。只读视图适合暴露内部状态，同时禁止外部修改。

## 2. 计算属性与校验

property 不要求底层一定有一个字段。每次访问都重新计算的值也可以做成属性：

```python
import math


class Circle:
    def __init__(self, radius):
        self.radius = radius

    @property
    def area(self):
        return math.pi * self.radius ** 2


print(round(Circle(1).area(), 2))  # 3.14
```

计算属性每次访问都会执行，适合开销小的派生值。如果计算很贵且结果稳定，用下一节的 `cached_property`，或者手动缓存。

校验放在 setter 里，所有赋值路径都会经过它。注意 `bool` 是 `int` 的子类，`isinstance(True, int)` 为 `True`，做数字校验时要单独排除。`__init__` 里写 `self.price = price` 会立刻触发 setter；如果 setter 依赖另一个尚未初始化的属性，就要调整赋值顺序。

## 3. property、cached_property、classmethod、staticmethod

[width(25,14,21,40)]

| 装饰器             | 首个参数 | 结果存放        | 典型场景                           |
| :----------------- | :------- | :-------------- | :--------------------------------- |
| `@property`        | `self`   | 每次计算        | 校验、计算属性、只读视图           |
| `@cached_property` | `self`   | 实例 `__dict__` | 开销大、结果稳定的计算属性         |
| `@classmethod`     | `cls`    | 不涉及实例      | 替代构造器、访问类状态             |
| `@staticmethod`    | 无       | 不涉及实例      | 与类相关、但不需要 self/cls 的工具 |

`cached_property` 第一次访问后把结果写进实例字典，之后实例字典直接命中，不再调用描述符：

```python
from functools import cached_property


class Report:
    def __init__(self, rows):
        self.rows = rows

    @cached_property
    def total(self):
        print('只计算一次')
        return sum(self.rows)


r = Report([1, 2, 3])
print(r.total)  # 只计算一次，然后 6
print(r.total)  # 6
```

它要求实例有 `__dict__`；使用 `__slots__` 且没有字典时不能用。Python 3.12 起去掉了内部锁，多线程同时首次访问可能重复计算。

`classmethod` 和 `staticmethod` 的区别在于绑定：

```python
class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    @classmethod
    def from_fahrenheit(cls, fahrenheit):
        return cls((fahrenheit - 32) * 5 / 9)

    @staticmethod
    def is_freezing(celsius):
        return celsius <= 0


t = Temperature.from_fahrenheit(212)
print(round(t.celsius, 1))            # 100.0
print(Temperature.is_freezing(-1))    # True
```

`classmethod` 的 `cls` 让子类调用时返回子类；`staticmethod` 只是放在类命名空间里的普通函数，既没有 `self` 也没有 `cls`。

## 4. 描述符协议与查找优先级

描述符是定义了 `__get__`、`__set__`、`__delete__` 之一的类。它的实例作为**另一个类的类属性**时，属性访问会被拦截：

[width(20,18,62)]

| 方法           | 调用时机     | 签名                        |
| :------------- | :----------- | :-------------------------- |
| `__get__`      | 读取属性     | `(self, obj, objtype=None)` |
| `__set__`      | 赋值         | `(self, obj, value)`        |
| `__delete__`   | `del obj.x`  | `(self, obj)`               |
| `__set_name__` | 所属类创建时 | `(self, owner, name)`       |

`__get__` 的 `obj` 为 `None` 表示通过类访问（`Config.debug`），此时通常返回描述符自身；`objtype` 是所属类。

[width(18,33,49)]

| 类型         | 定义                         | 例子                                                   |
| :----------- | :--------------------------- | :----------------------------------------------------- |
| 数据描述符   | 有 `__set__` 或 `__delete__` | `property`、自定义校验字段                             |
| 非数据描述符 | 只有 `__get__`               | 函数、`classmethod`、`staticmethod`、`cached_property` |

属性查找的优先级（简化）：

[width(24,76)]

| 优先级 | 来源                                |
| :----- | :---------------------------------- |
| 1      | 类 MRO 上的数据描述符               |
| 2      | 实例 `__dict__`                     |
| 3      | 类 MRO 上的非数据描述符或普通类属性 |
| 4      | `__getattr__`                       |
| 5      | 抛出 `AttributeError`               |

这解释了为什么给实例字典塞一个和 property 同名的键，也遮不住 property：property 是数据描述符，优先级高于实例字典；而函数是非数据描述符，所以实例属性可以遮蔽方法。

::: details 为什么只读 property 也是数据描述符？
`property` 内部始终定义了 `__set__`；没有 setter 时调用它会抛 `AttributeError`，而不是让赋值落到实例字典。因此只读 property 仍然优先于 `c.__dict__['x']`。
:::

## 5. 用描述符实现可复用校验

多个字段需要同一种校验时，把规则写进描述符，比在每个 property 里复制代码更干净。`__set_name__` 会在类创建时自动告诉描述符自己叫什么：

```python
class Positive:
    def __set_name__(self, owner, name):
        self.public_name = name
        self.private_name = '_' + name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.private_name)

    def __set__(self, obj, value):
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f'{self.public_name} 必须是数字')
        if value <= 0:
            raise ValueError(f'{self.public_name} 必须为正数')
        setattr(obj, self.private_name, value)


class Product:
    price = Positive()
    stock = Positive()

    def __init__(self, price, stock):
        self.price = price
        self.stock = stock


p = Product(9.9, 10)
print(p.price)  # 9.9
```

`__get__` 里 `obj is None` 时返回自身，所以 `Product.price` 能拿到描述符，方便内省。`setattr(obj, '_price', ...)` 的私有名没有同名描述符，不会递归。`isinstance(value, bool)` 要单独排除，因为 `bool` 是 `int` 的子类。

## 6. `__getattr__`、`__getattribute__`、`__setattr__` 的边界

[width(25,18,23,34)]

| 方法               | 调用范围         | 典型用途                 | 风险                          |
| :----------------- | :--------------- | :----------------------- | :---------------------------- |
| `__getattribute__` | 所有属性读取     | 统一拦截、审计           | 极易递归，拖慢所有访问        |
| `__getattr__`      | 仅常规查找失败后 | 代理、懒加载、兼容旧属性 | 拼错的属性名被吞掉            |
| `__setattr__`      | 所有属性赋值     | 校验、只读对象、日志     | 忘记调用 `super()` 会无限递归 |
| `__delattr__`      | 所有 `del`       | 受控删除                 | 同上                          |

```python
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __getattr__(self, name):
        if name in ('z', 'w'):
            return 0
        raise AttributeError(f'{type(self).__name__!r} 没有属性 {name!r}')


p = Point(1, 2)
print(p.z)  # 0
# p.nope    # AttributeError
```

`__getattr__` 只在常规查找（包括数据描述符、实例字典、非数据描述符、类属性）全部失败后触发。在它内部再用 `getattr(self, name)` 取同一个名字会无限递归；需要绕过时用 `object.__getattribute__(self, name)`。

`__setattr__` 拦截**所有**赋值，包括 `self.x = ...`。实现里必须调用 `super().__setattr__(name, value)` 或 `object.__setattr__(self, name, value)`，否则赋值会再次进入自己，直到 `RecursionError`。

## 7. 常见模式与陷阱

### 7.1 懒加载属性

懒加载属性的做法是用 `_pixels = None` 记录缓存，getter 第一次访问时计算并写回。简单场景直接用 `cached_property` 更短；需要手动失效、刷新缓存时，手写 property 更灵活。只读属性、类型校验、ORM 字段都是同一套思路：把存储细节藏在 `_name` 或描述符里，对外只暴露受控接口。ORM 的 `Field` 描述符通常在 `__set_name__` 里记录列名，在 `__get__`/`__set__` 里做类型转换。

### 7.2 property 与实例属性同名

> [!WARNING]
> getter 里写 `return self.value` 会访问同一个 property，造成无限递归；真实字段必须换成 `_value`。setter 里写 `self.value = value` 同样会递归。

### 7.3 `__init__` 里触发 setter

如果 `__init__` 先给 `email` 赋值，而 setter 里用到了尚未赋值的 `name`，第一次赋值就会 `AttributeError`。把有依赖的字段放到前面，或者让 setter 不依赖未初始化状态。

### 7.4 描述符放到实例上不生效

描述符只有在**类**上才会被属性查找机制调用。`c.x = Positive()` 只是给实例塞了一个普通属性，不会拦截后续读写。

### 7.5 绕过 property 的写法

直接操作 `self.__dict__[name] = value` 会跳过 `__setattr__`，也跳过 property 的 setter。除非在写框架底层，否则不要这样做。

## 8. 小结

[width(20,80)]

| 关键点      | 说明                                                             |
| :---------- | :--------------------------------------------------------------- |
| `@property` | 把方法变成受控属性，getter/setter/deleter 分别处理读、写、删     |
| 计算属性    | 每次访问重新计算；结果稳定且昂贵时用 `cached_property`           |
| 绑定差异    | `classmethod` 收 `cls`，`staticmethod` 不收，property 收 `self`  |
| 描述符      | 定义了 `__get__`/`__set__`/`__delete__` 的类属性，可复用校验逻辑 |
| 查找优先级  | 数据描述符 > 实例字典 > 非数据描述符/类属性 > `__getattr__`      |
| 钩子边界    | `__getattr__` 只处理找不到；`__getattribute__` 拦截所有读取      |

**一句话理解**：property 是“单字段的受控入口”，描述符是“把同一套入口批量复用到多个字段”；记住数据描述符高于实例字典，就能解释绝大多数属性怪现象。

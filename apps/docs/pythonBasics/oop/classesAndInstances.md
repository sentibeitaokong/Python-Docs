---
outline: [2, 3]
---

# 类与实例 (Classes and Instances)

类（class）定义“这一类对象长什么样、能做什么”，实例（instance）是按定义创建出来的具体对象。把类对象、`self`、属性查找和构造流程理清楚，后面的继承和魔术方法才不会变成死记硬背。

> [!TIP] 相关阅读
> 类之间复用代码的机制见 [继承与多态](/pythonBasics/oop/inheritance)；让实例支持 `len()`、`+`、`with` 等语法见 [魔术方法](/pythonBasics/oop/magicMethods)；把属性访问改成受控接口见 [属性管理与描述符](/pythonBasics/oop/propertiesAndDescriptors)。

## 1. 类也是对象

`class` 语句会执行类体、创建类对象，并把它绑定到一个名字上。类本身是 `type` 的实例，因此也可以被赋值、传递，甚至在没有 `class` 语句的情况下动态创建。

### 1.1 类是 type 的实例

```python
class Person:
    """一个最简单的类。"""

    species = 'human'


p = Person()
print(type(p))          # <class '__main__.Person'>
print(type(Person))     # <class 'type'>
print(Person.__bases__)  # (<class 'object'>,)
```

`p` 是 `Person` 的实例，`Person` 是 `type` 的实例，`type` 又是自己的实例。所有类最终都继承自 `object`，它是唯一没有父类的类。

### 1.2 `__new__` 与 `__init__` 的分工

`Person()` 的真正入口是 `type.__call__`：先调用 `Person.__new__(Person, ...)` 创建实例；如果返回值是 `Person` 的实例，再调用 `Person.__init__(实例, ...)`，最后返回实例。

[width(14,43,43)]

| 维度     | `__new__`                          | `__init__`             |
| :------- | :--------------------------------- | :--------------------- |
| 职责     | 创建并返回实例                     | 初始化已经创建好的实例 |
| 首个参数 | `cls`（隐式静态方法）              | `self`                 |
| 返回值   | 必须返回实例                       | 必须返回 `None`        |
| 常见用途 | 继承不可变类型、单例、控制对象创建 | 设置属性、校验参数     |
| 重写频率 | 很少                               | 几乎每个类都会写       |

绝大多数类只写 `__init__`。需要控制“对象怎么被创建”时才重写 `__new__`，典型场景是继承不可变类型：

```python
class PositiveInt(int):
    def __new__(cls, value):
        if value <= 0:
            raise ValueError(f'必须是正数，收到 {value}')
        return super().__new__(cls, value)


print(PositiveInt(3))  # 3
# PositiveInt(-1)      # ValueError: 必须是正数，收到 -1
```

> [!NOTE]
> `__new__` 的第一个参数是 `cls`，定义时自动视为静态方法。`__init__` 的返回值则被强制要求为 `None`。

### 1.3 用 type() 动态创建类

`type(name, bases, namespace)` 可以在运行时造类，第三个参数就是类命名空间：

```python
def greet(self):
    return f'你好，{self.name}'


Point = type('Point', (), {'x': 0, 'greet': greet})
p = Point()
p.name = '原点'
print(Point.__name__, p.greet())  # Point 你好，原点
```

ORM、序列化框架和插件系统经常这样在运行时拼装类。

## 2. self 到底是什么

`self` 不是关键字，只是实例方法第一个参数的约定名。访问 `p.method` 时，函数通过描述符协议返回一个绑定方法，把函数和实例捆在一起：

```python
class Counter:
    def __init__(self):
        self.value = 0

    def add(self, n):
        self.value += n
        return self.value


c = Counter()
print(c.add(2))              # 2
print(Counter.add(c, 2))     # 4，等价写法
print(c.add.__self__ is c)   # True
```

每次访问 `c.add` 都会新建绑定方法对象，所以 `c.add is c.add` 为 `False`，但底层函数是同一个。函数只有作为**类属性**时才会绑定；把函数赋给实例不会自动获得 `self`。`self` 名字可以换，但类方法统一用 `cls` 是团队约定。

## 3. 实例属性与类属性

类属性写在类体里，所有实例共享；实例属性在 `__init__` 里用 `self.xxx = ...` 创建，每个实例各有一份。读取时先查实例 `__dict__`，再去类的 MRO 上找。

```python
class Dog:
    species = '犬科'

    def __init__(self, name):
        self.name = name


d = Dog('旺财')
print(d.name, d.species)  # 旺财 犬科
print(d.__dict__)         # {'name': '旺财'}
```

### 3.1 共享可变类属性的陷阱

```python
class Dog:
    tricks = []  # 所有实例共享同一个列表

    def add_trick(self, trick):
        self.tricks.append(trick)


a, b = Dog(), Dog()
a.add_trick('坐下')
print(b.tricks)  # ['坐下']，b 也“学会”了
```

在 `__init__` 里为每个实例新建一份即可。对实例赋值会遮蔽类属性：`d.species = '狼'` 只改 `d`，`Dog.species` 仍是 `犬科`。要改共享的计数，必须写 `Dog.count += 1`；写成 `self.count += 1` 只会在实例上新建一个 `count`。

## 4. 构造与初始化

### 4.1 默认参数只在定义时求值

```python
class Cart:
    def __init__(self, items=[]):  # 所有实例共享这个列表
        self.items = items


a, b = Cart(), Cart()
a.items.append('苹果')
print(b.items)  # ['苹果']
```

用 `None` 占位，在函数体内新建：

```python
class Cart:
    def __init__(self, items=None):
        self.items = [] if items is None else list(items)
```

用 `list(items)` 而不是直接赋值，是为了复制一份，避免调用方之后修改传入列表影响到对象内部。

### 4.2 classmethod 作为替代构造器

一个类只能有一个 `__init__` 签名，从不同来源构造对象时用 `@classmethod`：

```python
class Date:
    def __init__(self, year, month, day):
        self.year, self.month, self.day = year, month, day

    @classmethod
    def from_string(cls, text):
        year, month, day = map(int, text.split('-'))
        return cls(year, month, day)


d = Date.from_string('2026-01-01')
print(d.year, d.month, d.day)  # 2026 1 1
```

`cls` 是类本身，子类调用时得到子类实例，不会硬编码成 `Date`。

[width(20,40,40)]

| 方式           | 适合的场景                         | 注意                         |
| :------------- | :--------------------------------- | :--------------------------- |
| `__init__`     | 直接给出全部字段                   | 只能有一种主签名             |
| `@classmethod` | 从字符串、时间戳、配置转换         | 收到 `cls`，对子类友好       |
| 工厂函数       | 需要缓存对象、返回不同类、复杂决策 | 不自动获得 `cls`，要自己处理 |
| `__new__`      | 控制实例创建，如不可变类型、单例   | 容易写错，优先考虑前三种     |

### 4.3 `__init__` 必须返回 None

`__init__` 的返回值被强制要求为 `None`，写 `return name` 会得到 `TypeError: __init__() should return None, not 'str'`。参数不合法就抛异常，不要返回 `False` 或 `None` 让调用方自己猜；构造失败时对象本来就不应该存在。

## 5. 类命名空间与 `__slots__`

### 5.1 类体是一个命名空间

类体从上到下执行，方法和属性都进了类的命名空间。方法本质是函数，`help()` 读取的是 `__doc__` 和方法文档：

```python
class Circle:
    """表示一个圆。"""

    pi = 3.14159

    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return self.pi * self.radius ** 2


print(Circle.__doc__)  # 表示一个圆。
help(Circle)           # 打印类说明和方法列表
```

类体不是闭包，方法里不能直接访问类体中的名字。上面的 `pi` 在 `area` 里必须写成 `self.pi`，写裸 `pi` 会得到 `NameError`。

### 5.2 `__slots__` 的用途与限制

```python
class Point:
    __slots__ = ('x', 'y')

    def __init__(self, x, y):
        self.x, self.y = x, y


p = Point(1, 2)
print(hasattr(p, '__dict__'))  # False
# p.z = 3  # AttributeError: 'Point' object has no attribute 'z'
```

[width(20,80)]

| 维度 | 说明                                                                        |
| :--- | :-------------------------------------------------------------------------- |
| 收益 | 省掉每实例一个字典，大量小对象时显著省内存；拼错属性名会立刻报错            |
| 限制 | 不能添加槽位之外的属性                                                      |
| 继承 | 子类不写 `__slots__` 就重新获得 `__dict__`；父类槽位会被继承                |
| 冲突 | 槽位名不能与类变量同名；多个非空 `__slots__` 的父类可能产生布局冲突         |
| 搭配 | `@property` 需要底层有对应槽位；依赖 `__dict__` 的 `cached_property` 会失效 |

只有对象数量大、字段固定、内存敏感时才值得用；普通业务类加它通常只会带来限制。

## 6. 对象身份与比较

[width(11,30,59)]

| 写法   | 比较什么                  | 什么时候用                               |
| :----- | :------------------------ | :--------------------------------------- |
| `is`   | 是否是同一个对象          | 与 `None`、`True`、`False`、哨兵对象比较 |
| `==`   | 值是否相等，调用 `__eq__` | 业务意义上的“相等”                       |
| `id()` | 对象生命周期内唯一的整数  | 调试、确认是否指向同一个对象             |

```python
a = [1, 2]
b = [1, 2]
c = a
print(a == b, a is b, a is c)  # True False True
```

用户类默认的 `__eq__` 就是身份比较：

```python
class User:
    def __init__(self, name):
        self.name = name


print(User('Ada') == User('Ada'))  # False
u = User('Ada')
print(u == u)                      # True
```

自定义 `__eq__` 后要同步考虑 `__hash__` 的契约，见 [魔术方法](/pythonBasics/oop/magicMethods)。不要用 `is` 比较数字或字符串的值：`int('1000') is int('1000')` 的结果依赖实现细节，业务判断只能用 `==`。

## 7. 常见陷阱

- **实例属性遮蔽类属性**：`c.debug = True` 只影响 `c`，`Config.debug` 不变。
- **忘记写 self**：`def greet():` 被 `g.greet()` 调用时会多收到一个参数，直接 `TypeError`。
- **在类体里放可变对象**：`items = []` 会被所有实例共享，应放进 `__init__`。
- **可变默认参数**：`def __init__(self, items=[])` 的列表只创建一次，用 `None` 占位。

## 8. 小结

[width(18,82)]

| 关键点      | 说明                                                             |
| :---------- | :--------------------------------------------------------------- |
| 类与实例    | 类是 `type` 的实例；`__new__` 造对象，`__init__` 初始化          |
| self        | 实例方法的第一个参数，绑定方法自动传入；`Class.method(obj)` 等价 |
| 属性查找    | 实例 `__dict__` 优先于类属性；可变类属性被所有实例共享           |
| 构造        | `@classmethod` 适合做替代构造器；`__init__` 必须返回 `None`      |
| `__slots__` | 省内存、限制属性，但牺牲动态性，不是默认选择                     |
| 比较        | `is` 比身份，`==` 比值，默认 `__eq__` 就是身份比较               |

**一句话理解**：类是模具，实例是铸件；`self` 是把铸件递回给方法的那个参数，类属性是模具上的公共标签，实例属性才是每个铸件自己的刻字。

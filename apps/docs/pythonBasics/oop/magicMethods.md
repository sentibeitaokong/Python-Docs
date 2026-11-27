---
outline: [2, 3]
---

# 魔术方法 (Magic Methods)

魔术方法是 Python 数据模型的**协议钩子**：`len(obj)`、`obj + other`、`with obj` 这些语法在背后查找并调用对应的双下划线方法。它们不是随便直接调用的“魔法函数”，而是让自定义对象接入内置语法的约定。

> [!TIP] 相关阅读
> 类与实例的基础见 [类与实例](/pythonBasics/oop/classesAndInstances)；继承和方法查找见 [继承与多态](/pythonBasics/oop/inheritance)；迭代器协议见 [迭代器](/pythonBasics/functions/iterators)；`with` 的完整用法见 [上下文管理器](/pythonBasics/functions/contextManagers)。

## 1. 协议钩子与字符串表示

Python 的很多语法都是协议：实现了 `__len__` 就能用 `len()`，实现了 `__iter__` 就能 `for` 循环。魔术方法就是这些协议的接入点，最常用的一对是 `__str__` 和 `__repr__`：

[width(14,43,43)]

| 维度     | `__str__`                          | `__repr__`                             |
| :------- | :--------------------------------- | :------------------------------------- |
| 面向对象 | 最终用户                           | 开发者、调试和日志                     |
| 目标     | 可读                               | 明确、尽量能重建对象                   |
| 触发     | `str(obj)`、`print(obj)`、f-string | `repr(obj)`、`f'{obj!r}'`、容器显示    |
| 回退     | 没有 `__str__` 时用 `__repr__`     | 不回退到 `__str__`，用默认 object 表示 |
| 示例     | `(1, 2)`                           | `Point(1, 2)`                          |

```python
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __repr__(self):
        return f'Point({self.x!r}, {self.y!r})'

    def __str__(self):
        return f'({self.x}, {self.y})'


p = Point(1, 2)
print(p, repr(p))   # (1, 2) Point(1, 2)
print([p])          # [Point(1, 2)]，容器用 repr
```

`__repr__` 里用 `!r`，是为了让字符串元素也带引号，避免 `Point('1', '2')` 和 `Point(1, 2)` 看起来一样。只写一个时优先写 `__repr__`，它同时承担调试和容器显示。

## 2. 容器协议

容器类不需要继承 `list`，实现几个钩子就能获得下标、赋值、`in`、`for`：

[width(20,33,47)]

| 钩子           | 触发的语法                     | 说明                                      |
| :------------- | :----------------------------- | :---------------------------------------- |
| `__len__`      | `len(obj)`、`bool(obj)` 的回退 | 必须返回非负整数                          |
| `__getitem__`  | `obj[key]`、切片               | 越界应抛 `IndexError`                     |
| `__setitem__`  | `obj[key] = value`             | 不存在时通常抛 `KeyError` 或 `IndexError` |
| `__delitem__`  | `del obj[key]`                 | 删除不存在的键时抛对应异常                |
| `__contains__` | `x in obj`                     | 不实现时回退到 `__iter__`，再回退到下标   |
| `__iter__`     | `for x in obj`、`iter(obj)`    | 返回迭代器                                |
| `__next__`     | `next(obj)`                    | 迭代器协议，耗尽时抛 `StopIteration`      |

```python
class Playlist:
    def __init__(self, songs):
        self._songs = list(songs)

    def __len__(self):
        return len(self._songs)

    def __getitem__(self, index):
        return self._songs[index]

    def __iter__(self):
        return iter(self._songs)


p = Playlist(['A', 'B'])
print(len(p), p[0], 'A' in p)  # 2 A True
print(list(p))                 # ['A', 'B']
```

`in` 没有 `__contains__` 时会退回到 `__iter__` 逐个比较。如果对象自己就是迭代器（同时实现 `__iter__` 和 `__next__`），要记住它是一次性的：

```python
class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        self.current -= 1
        return self.current + 1


c = Countdown(3)
print(list(c), list(c))  # [3, 2, 1] []
```

只有 `__getitem__` 时，`for` 也会从下标 0 开始取到 `IndexError`，这是旧式序列协议的兼容行为，不建议依赖。

## 3. 比较协议与哈希契约

`__eq__` 决定 `==`，`__hash__` 决定能否放进 `set` 或作为 `dict` 的键。两者必须遵守：**a == b 时，hash(a) 必须等于 hash(b)**；反过来不要求。

```python
class Money:
    def __init__(self, amount, currency='CNY'):
        self.amount = amount
        self.currency = currency

    def __eq__(self, other):
        if not isinstance(other, Money):
            return NotImplemented
        return (self.amount, self.currency) == (other.amount, other.currency)

    def __hash__(self):
        return hash((self.amount, self.currency))


print(Money(10) == Money(10))       # True
print(len({Money(10), Money(10)}))  # 1
```

只定义 `__eq__` 不定义 `__hash__` 时，Python 会把该类的 `__hash__` 设为 `None`，实例立刻不可哈希，`hash(obj)` 直接抛 `TypeError: unhashable type`。如果对象可变，并且参与哈希的字段会变，就不要实现 `__hash__`；否则放进 `set` 后一改字段就再也找不回来。

排序可以用 `__lt__`，也可以让 `functools.total_ordering` 根据 `__eq__` 和一个比较方法补齐其余：

```python
from dataclasses import dataclass
from functools import total_ordering


@total_ordering
@dataclass(frozen=True)
class Version:
    parts: tuple

    def __lt__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return self.parts < other.parts


print(sorted([Version((1, 10)), Version((1, 2))]))
# [Version(parts=(1, 2)), Version(parts=(1, 10))]
```

`dataclass(frozen=True)` 顺便提供了 `__eq__` 和 `__hash__`，`total_ordering` 再补上 `<=`、`>`、`>=`。

## 4. 算术协议与 NotImplemented

`a + b` 的顺序是：先试 `a.__add__(b)`；返回 `NotImplemented` 再试 `b.__radd__(a)`；两边都不支持才抛 `TypeError`。

```python
class Vector:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __add__(self, other):
        if not isinstance(other, Vector):
            return NotImplemented
        return Vector(self.x + other.x, self.y + other.y)

    def __radd__(self, other):
        if other == 0:  # 支持 sum()，它的起点是 0
            return self
        return NotImplemented

    def __iadd__(self, other):
        if not isinstance(other, Vector):
            return NotImplemented
        self.x += other.x
        self.y += other.y
        return self

    def __mul__(self, scale):
        if not isinstance(scale, (int, float)):
            return NotImplemented
        return Vector(self.x * scale, self.y * scale)

    __rmul__ = __mul__

    def __repr__(self):
        return f'Vector({self.x!r}, {self.y!r})'
```

`v + w` 走 `__add__`，`3 * v` 走 `__rmul__`，`sum([v, w])` 先遇到 `0 + v`，由 `__radd__` 接住。`__iadd__` 不实现时，`v += w` 会退化成 `v = v + w`，重新绑定一个新对象；实现了就应当返回 `self`，表示原地修改。

[width(29,71)]

| 返回值                 | 含义                                                              |
| :--------------------- | :---------------------------------------------------------------- |
| `NotImplemented`       | 值，不是异常；告诉 Python“我不处理这个类型”，请尝试对方的反射方法 |
| `NotImplementedError`  | 异常；表示“子类必须实现”，通常用于抽象方法的占位                  |
| `raise TypeError(...)` | 直接放弃运算符协商，立刻报错                                      |

## 5. 可调用、布尔与格式化

实现 `__call__` 后，实例可以像函数一样调用，`callable(obj)` 返回 `True`：

```python
class Adder:
    def __init__(self, n):
        self.n = n

    def __call__(self, x):
        return x + self.n


print(Adder(5)(3))  # 8
```

`bool(obj)` 先找 `__bool__`；没有就找 `__len__`，长度为 0 视为假；两者都没有则恒为真。所以一个实现 `__len__` 的空容器自动为假。`__bool__` 必须返回真正的 `bool`，返回 `1` 会得到 `TypeError: __bool__ should return bool, returned int`。

f-string 的格式说明符会传给 `__format__`；不实现时，空格式回退到 `str()`，非空格式报错。需要自定义输出时，在 `__format__` 里按 `spec` 分支返回字符串，再交给 `format()` 处理对齐和宽度。

`with` 依赖 `__enter__` 和 `__exit__`。`as` 绑定的是 `__enter__` 的返回值；`__exit__` 返回 `True` 会吞掉异常，返回 `False` 或 `None` 则让异常继续传播。

```python
import time


class Timer:
    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.elapsed = time.perf_counter() - self.start
        return False  # 不吞异常


with Timer() as t:
    total = sum(range(1_000_000))
print(t.elapsed > 0)  # True
```

`__exit__` 的三个参数是异常类型、异常实例和 traceback，更多细节见 [上下文管理器](/pythonBasics/functions/contextManagers)。

`__slots__` 不是魔术方法，但会影响属性存储：没有 `__dict__` 后，依赖实例字典的 `cached_property` 会失效，而 `__getattr__` 仍然只在常规查找失败后触发。

## 6. 属性访问钩子

[width(24,24,52)]

| 钩子               | 触发时机               | 注意                                           |
| :----------------- | :--------------------- | :--------------------------------------------- |
| `__getattribute__` | 每次读取属性，最先调用 | 覆盖它会影响所有属性访问，内部必须用 `super()` |
| `__getattr__`      | 常规查找失败后调用     | 适合代理、懒加载、兼容旧属性                   |
| `__setattr__`      | 每次赋值               | 不调用 `super().__setattr__` 会无限递归        |
| `__delattr__`      | 每次 `del obj.x`       | 同上                                           |

```python
class Lazy:
    def __init__(self):
        self._data = None

    def __getattr__(self, name):
        if name == 'data':
            if self._data is None:
                print('加载数据')
                self._data = [1, 2, 3]
            return self._data
        raise AttributeError(name)


obj = Lazy()
print(obj.data)  # 加载数据，然后 [1, 2, 3]
```

`__getattr__` 里访问 `self.xxx` 要小心：如果 `xxx` 也不存在，会再次触发自己，形成无限递归。需要绕过时用 `object.__getattribute__(self, name)` 或直接读 `self.__dict__`。

## 7. 常见陷阱

- **`__eq__` 忘记 `__hash__`**：实例变得不可哈希，放进 `set` 或做字典键时直接 `TypeError`。
- **`__getattr__` 无限递归**：在钩子里用 `getattr(self, name)` 取同一个名字，会不断回到自己。
- **算术钩子抛 `NotImplementedError`**：应该 `return NotImplemented`（值，不带括号），让 Python 尝试对方的反射方法。
- **`__bool__` 返回非布尔值**：`return 1` 会抛 `TypeError`，要写 `return bool(...)`。

```python
class Bad:
    def __getattr__(self, name):
        return getattr(self, name)  # RecursionError
```

## 8. 小结

[width(20,80)]

| 关键点     | 说明                                                                |
| :--------- | :------------------------------------------------------------------ |
| 字符串表示 | `__repr__` 给开发者，`__str__` 给用户；只写一个时优先 `__repr__`    |
| 容器       | `__len__`、`__getitem__`、`__iter__` 等让对象获得序列和迭代行为     |
| 比较与哈希 | `a == b` 必须推出 `hash(a) == hash(b)`；可变对象不要实现 `__hash__` |
| 属性访问   | `__getattr__` 只在找不到时触发；`__getattribute__` 拦截所有读取     |

**一句话理解**：魔术方法让自定义对象接入 `len()`、`+`、`with` 这些既有语法；遵守协议契约，比多写几个钩子更重要。

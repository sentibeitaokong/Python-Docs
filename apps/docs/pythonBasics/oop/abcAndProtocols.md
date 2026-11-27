---
outline: [2, 3]
---

# 抽象基类与协议 (ABCs and Protocols)

抽象基类（ABC）用**名义类型**强制子类实现一组接口；`typing.Protocol` 用**结构类型**描述“长得像什么就能当什么”。再加上什么都不要求的鸭子类型，三者是 Python 表达接口契约的三种强度。

> [!TIP] 相关阅读
> 继承与 MRO 见 [继承与多态](/pythonBasics/oop/inheritance)；迭代器和容器协议见 [魔术方法](/pythonBasics/oop/magicMethods)；`for` 循环背后的迭代器协议见 [迭代器](/pythonBasics/functions/iterators)。

## 1. 抽象基类 ABC

抽象基类不能直接实例化，子类必须实现所有标记为抽象的方法：

```python
from abc import ABC, abstractmethod
import math


class Shape(ABC):
    @abstractmethod
    def area(self) -> float:
        """返回面积。"""

    @abstractmethod
    def perimeter(self) -> float:
        """返回周长。"""


class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self) -> float:
        return math.pi * self.radius ** 2

    def perimeter(self) -> float:
        return 2 * math.pi * self.radius


print(round(Circle(1).area(), 2))  # 3.14
# Shape()  # TypeError: Can't instantiate abstract class Shape
```

错误发生在**实例化**时，而不是定义子类时。只实现一部分方法的子类仍然可以定义，但同样不能实例化，`TypeError` 会列出还缺哪些抽象方法。

抽象方法的判定依据是方法上的 `__isabstractmethod__` 属性；只有 `ABCMeta`（`ABC` 的元类）会在实例化时检查。普通类里写 `@abstractmethod` 没有强制力。

## 2. 抽象方法、抽象属性与模板方法

### 2.1 抽象方法可以有实现

`@abstractmethod` 只规定“子类必须覆盖”，不禁止基类写函数体。基类可以在抽象方法里给出默认实现，子类覆盖后用 `super().describe()` 复用，同时仍然被要求提供自己的版本。这比纯接口更灵活：既强制了契约，又避免了每个子类重复样板代码。

### 2.2 抽象属性与抽象类方法

装饰器顺序很重要：`property`、`classmethod` 在外层，`@abstractmethod` 紧贴函数：

```python
from abc import ABC, abstractmethod


class Shape(ABC):
    @property
    @abstractmethod
    def name(self) -> str: ...

    @classmethod
    @abstractmethod
    def from_config(cls, config): ...
```

反过来写（`@abstractmethod` 在最外层）不会让属性或类方法变成抽象的，因为 `abstractmethod` 需要标记的是最内层的函数对象。

### 2.3 模板方法模式

基类固定流程，子类只填步骤：

```python
from abc import ABC, abstractmethod


class DataPipeline(ABC):
    def run(self, source):
        data = self.extract(source)
        data = self.transform(data)
        return self.load(data)

    @abstractmethod
    def extract(self, source): ...

    @abstractmethod
    def transform(self, data): ...

    @abstractmethod
    def load(self, data): ...


class CsvPipeline(DataPipeline):
    def extract(self, source):
        return source.split(',')

    def transform(self, data):
        return [item.strip().upper() for item in data]

    def load(self, data):
        return '|'.join(data)


print(CsvPipeline().run('a, b, c'))  # A|B|C
```

`run` 是稳定的模板，子类只实现三个钩子。这叫好莱坞原则：不要调用我们，我们会调用你。

## 3. collections.abc 提供的接口

标准库已经把常用容器接口做成 ABC。继承它们，只要实现少量必须方法，就能免费获得一批 mixin 方法：

[width(22,44,34)]

| 接口              | 必须实现                                    | 继承后免费得到                                      |
| :---------------- | :------------------------------------------ | :-------------------------------------------------- |
| `Iterable`        | `__iter__`                                  | `for`、`iter()`                                     |
| `Sized`           | `__len__`                                   | `len()`                                             |
| `Container`       | `__contains__`                              | `in`                                                |
| `Sequence`        | `__getitem__`、`__len__`                    | `__iter__`、`__contains__`、`__reversed__`、`index` |
| `MutableSequence` | 再加 `__setitem__`、`__delitem__`、`insert` | `append`、`extend`、`pop`、`remove`、`reverse`      |
| `Mapping`         | `__getitem__`、`__len__`、`__iter__`        | `get`、`keys`、`items`、`values`、`__contains__`    |
| `MutableMapping`  | 再加 `__setitem__`、`__delitem__`           | `pop`、`popitem`、`clear`、`update`、`setdefault`   |
| `Set`             | `__len__`、`__iter__`、`__contains__`       | 交集、并集、差集、对称差等集合运算                  |

```python
from collections.abc import Sequence


class Deck(Sequence):
    def __init__(self, cards):
        self._cards = list(cards)

    def __len__(self):
        return len(self._cards)

    def __getitem__(self, index):
        return self._cards[index]


d = Deck(['A', 'K', 'Q'])
print(len(d))             # 3
print('K' in d)           # True
print(list(reversed(d)))  # ['Q', 'K', 'A']
print(d.index('Q'))       # 2
```

继承 `Sequence` 也意味着承诺“有序、可重复、按位置访问”的语义。语义不符时，不要为了几个 mixin 方法硬继承。

## 4. 虚拟子类与结构化 isinstance

调用 `register()` 可以把一个类登记为 ABC 的虚拟子类，不需要修改它的继承关系：

```python
from collections.abc import Sequence


class MyRange:
    def __len__(self):
        return 3

    def __getitem__(self, index):
        if index >= 3:
            raise IndexError(index)
        return index


Sequence.register(MyRange)
print(isinstance(MyRange(), Sequence))  # True
print(Sequence in MyRange.__mro__)     # False
```

注册只影响 `isinstance`/`issubclass`，不会把 `Sequence` 放进 MRO，也不会带来 `index`、`count` 这些方法。标准库用这种方式把 `list`、`tuple`、`str` 登记为 `Sequence`。

ABC 还可以通过 `__subclasshook__` 做结构化判断，只要类形状匹配就认：

```python
from abc import ABC


class Closeable(ABC):
    @classmethod
    def __subclasshook__(cls, candidate):
        if cls is Closeable:
            for base in candidate.__mro__:
                if 'close' in base.__dict__:
                    return True
        return NotImplemented


class File:
    def close(self):
        print('关闭')


print(issubclass(File, Closeable))  # True
```

返回值应当是 `True`、`False` 或 `NotImplemented`。返回 `NotImplemented` 表示“我判断不了，继续交给其他检查”，不要为了省事直接返回 `False`。

## 5. typing.Protocol

`Protocol` 用结构化的方式描述接口：实现方不需要继承协议，只要成员匹配，静态类型检查器就认可。

```python
from typing import Protocol, runtime_checkable


@runtime_checkable
class SupportsClose(Protocol):
    def close(self) -> None: ...


class File:
    def close(self) -> None:
        print('关闭文件')


def close_all(items: list[SupportsClose]) -> None:
    for item in items:
        item.close()


close_all([File()])
print(isinstance(File(), SupportsClose))  # True
print(issubclass(File, SupportsClose))    # True，仅限方法成员
```

> [!NOTE]
> `File` 没有继承 `SupportsClose`，但结构上匹配，mypy、pyright 都接受它。协议本身不能实例化，`SupportsClose()` 会得到 `TypeError: Protocols cannot be instantiated`。

`@runtime_checkable` 只让 `isinstance`/`issubclass` 能用，而且检查非常浅：

- 只检查成员**名字是否存在**，不检查签名、参数类型和返回值；
- 方法成员用 `hasattr` 判断，属性名叫 `close` 但不是可调用对象也会通过；
- 带数据成员的协议，`isinstance` 从 Python 3.12 起才支持，之前直接 `TypeError`；`issubclass` 对数据协议仍然不支持。

例如一个类把 `close` 写成字符串而非方法，`isinstance(obj, SupportsClose)` 仍然返回 `True`，直到真正调用 `obj.close()` 才暴露问题。

## 6. 名义类型与结构类型

[width(16,22,31,31)]

| 维度       | 鸭子类型         | ABC（名义）              | Protocol（结构）         |
| :--------- | :--------------- | :----------------------- | :----------------------- |
| 判断依据   | 能不能用         | 是否继承或注册           | 形状是否匹配             |
| 运行时检查 | 无               | `isinstance` 可靠        | 只查成员名字             |
| 静态检查   | 无               | 有限                     | 完整支持                 |
| 耦合       | 最低             | 实现方依赖基类           | 只依赖协议定义           |
| 适合       | 小脚本、内部协作 | 框架、库、需要运行时分发 | 跨模块接口、静态类型项目 |

选择顺序可以按这个来：

1. 只是内部几个类协作，直接鸭子类型，别急着抽接口。
2. 需要 `isinstance` 做分发、需要注册第三方类、或想复用 `collections.abc` 的 mixin，用 ABC。
3. 想给静态检查器一个契约，又不想让实现方依赖你的基类，用 Protocol。

ABC 和 Protocol 不互斥：协议可以继承 ABC，也可以在运行时配合 `register()` 使用。

## 7. 常见陷阱

- **ABC 里没有抽象方法**：忘记 `@abstractmethod` 时基类可以直接实例化，错误被推迟到调用具体方法。
- **把 ABC 写成纯接口**：ABC 完全可以有具体方法，模板方法就需要；拒绝任何默认实现会让子类重复样板代码。
- **`runtime_checkable` 当成完整校验**：它只查名字，签名错误、不可调用属性都能混过去。
- **过度抽象**：只有一个实现时先写具体类，等第二个实现出现、契约稳定后再抽 ABC 或 Protocol。
- **虚拟子类不会继承方法**：`register()` 只改变 `isinstance` 的结果，`Sequence.register(MyRange)` 不会给 `MyRange` 添加 `index`。

```python
from abc import ABC, abstractmethod


class NotReallyAbstract(ABC):
    def run(self):  # 忘了 @abstractmethod
        return '默认实现'


print(NotReallyAbstract().run())  # 能实例化，抽象约束没有生效
```

## 8. 小结

[width(20,80)]

| 关键点          | 说明                                                       |
| :-------------- | :--------------------------------------------------------- |
| ABC             | 用继承强制实现接口；`@abstractmethod` 在实例化时检查       |
| 抽象方法        | 可以有函数体，供子类用 `super()` 复用                      |
| 模板方法        | 基类固定流程，子类只实现抽象钩子                           |
| collections.abc | 提供常用容器接口，继承后可获得一批 mixin 方法              |
| 虚拟子类        | `register()` 只影响 `isinstance`，不改变 MRO、不继承方法   |
| Protocol        | 结构化接口，适合静态检查；`runtime_checkable` 只查成员名字 |

**一句话理解**：ABC 说“你必须继承我”，Protocol 说“你长得像我就行”，鸭子类型说“你能跑就行”；约束越强，运行时的保障越多，耦合也越重。

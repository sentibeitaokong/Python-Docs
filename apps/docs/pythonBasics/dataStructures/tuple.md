---
outline: [2, 3]
---

# 元组 (Tuple)

元组是**有序、不可变**的序列，用逗号分隔。它比列表轻，常用于多返回值、固定结构的记录，以及需要可哈希的场合，例如字典的键。

> [!TIP] 相关阅读
> 元组与 [列表](/pythonBasics/dataStructures/list) 的区别只在可变性；可哈希使它常与 [字典](/pythonBasics/dataStructures/dict)、[集合](/pythonBasics/dataStructures/set) 搭配。批量生成元组可参考 [推导式](/pythonBasics/dataStructures/comprehensions)。

## 1. 核心特性

元组回答的是“**按顺序存一组不该被改的数据**”这个问题。它和列表一样保存一组对象引用，区别是这组引用建好后不能增删改。

[width(16,42,42)]

| 维度     | 列表 list                            | 元组 tuple                           |
| :------- | :----------------------------------- | :----------------------------------- |
| 可变性   | 可变，支持 `append`、`pop`、切片赋值 | 不可变，不能增删元素或替换位置       |
| 可哈希   | 永远不可哈希                         | 元素都可哈希时可哈希，可做字典键     |
| 方法     | 11 个常用方法                        | 只有 `count`、`index`                |
| 内存     | 较大，容量预留空位                   | 更紧凑，按元素个数精确分配           |
| 典型用途 | 同类型、数量会变的一批数据           | 固定记录、多返回值、字典键、函数参数 |

```python
point = (3, 5)
mixed = (1, 'two', 3.0, None)

print(point[0], point[-1])  # 3 5
print(mixed[1:])            # ('two', 3.0, None)
```

元组支持所有序列通用操作：下标、切片、`in`、`len()`、迭代、解包；不支持任何改变内容的操作。

## 2. 创建元组

只有一条规则必须记牢：**单元素元组必须有逗号**。

[width(39,17,44)]

| 写法                             | 结果        | 说明                              |
| :------------------------------- | :---------- | :-------------------------------- |
| `()`                             | 空元组      | 全局单例，所有空元组是同一个对象  |
| `(1, 2, 3)` 或 `1, 2, 3`         | `(1, 2, 3)` | 逗号才是元组的标志，括号可以省略  |
| `(1,)`                           | `(1,)`      | 单元素必须带逗号，否则是整数      |
| `tuple([1, 2])`                  | `(1, 2)`    | 把任意可迭代对象转成元组          |
| `tuple(range(3))`                | `(0, 1, 2)` | 固定 `range`、`map`、`zip` 的结果 |
| `tuple(x * 2 for x in range(3))` | `(0, 2, 4)` | 生成器表达式一次性求值            |

```python
empty = ()
single = (1,)          # 逗号不能省
also_single = 1,       # 括号可以不要
from_list = tuple([1, 2, 3])
from_str = tuple('abc')  # ('a', 'b', 'c')
from_gen = tuple(x * 2 for x in range(3))  # (0, 2, 4)

print(type(single), type(also_single))  # <class 'tuple'> <class 'tuple'>
```

类型注解中，固定长度写 `tuple[int, int]`，任意长度写 `tuple[int, ...]`。Python 3.9 起可直接用内置泛型，更早版本需要 `from typing import Tuple`。

## 3. 不可变的边界

“不可变”指的是**元组持有的一组引用不能换**，不是指引用指向的对象也不能变。

```python
t = (1, 2, 3)
# t[0] = 99  # TypeError: 'tuple' object does not support item assignment

t = (9, 2, 3)  # 合法：让变量指向新元组，不是修改旧元组

old = t
t += (4,)      # 拼接产生新元组，old 不受影响
print(old, t)  # (9, 2, 3) (9, 2, 3, 4)
```

元组里的列表仍然可以改：

```python
t = ([1, 2], 'a')
t[0].append(3)
t[0][0] = 99
print(t)  # ([99, 2, 3], 'a')
```

有一个经典陷阱：对元组里的列表做 `+=`，会先原地修改列表，再尝试写回元组，于是抛错但列表已经被改了：

```python
t = ([1, 2],)
try:
    t[0] += [3]
except TypeError as e:
    print(e)  # 'tuple' object does not support item assignment
print(t)  # ([1, 2, 3],)
```

> [!WARNING]
> 元组的不可变不是深拷贝意义上的不可变。要得到真正不可变的结构，内部元素也得是不可变对象，如 `int`、`str`、`frozenset`、嵌套元组。

可哈希的前提是**所有元素都可哈希**：

```python
print(hash((1, 'a')))  # 可以计算

try:
    hash((1, [2]))
except TypeError as e:
    print(e)  # unhashable type: 'list'

try:
    mapping = {(1, [2]): 'value'}
except TypeError as e:
    print(e)  # unhashable type: 'list'
```

判断标准很简单：对每个元素依次调用 `hash()`，全都不报错，元组就可哈希。

## 4. 打包与解包

逗号既创建元组，也把元组拆回变量。函数返回多个值，本质就是返回元组再解包。

```python
point = (3, 5)
x, y = point
print(x, y)  # 3 5

first, *middle, last = (1, 2, 3, 4)
print(first, middle, last)  # 1 [2, 3] 4，星号结果一定是列表

(a, b), c = (1, 2), 3
print(a, b, c)  # 1 2 3
```

元素个数对不上会抛 `ValueError`，除非用星号吸收；一条赋值里只能有一个星号目标。

```python
def min_max(nums):
    return min(nums), max(nums)


low, high = min_max([3, 1, 4])
print(low, high)  # 1 4

result = min_max([3, 1, 4])
print(result, type(result))  # (1, 4) <class 'tuple'>

a, b = 1, 2
a, b = b, a  # 右边先组成元组，再从左到右解包
print(a, b)  # 2 1
```

`_` 只是约定俗成的占位变量名，Python 不会特殊处理：

```python
_, y = (1, 2)
print(y)  # 2

first, _, third = (1, 2, 3)
print(first, third)  # 1 3
```

## 5. 命名元组

普通元组只能靠位置记字段。命名元组给每个位置起名字，同时保留下标、解包、可哈希等全部元组能力。

```python
from collections import namedtuple

Point = namedtuple('Point', ['x', 'y'])
p = Point(1, 2)

print(p)         # Point(x=1, y=2)
print(p.x, p[0])  # 1 1
x, y = p         # 仍然可以解包
```

3.7 起支持默认值，从最右边的字段开始生效：

```python
Point = namedtuple('Point', ['x', 'y'], defaults=[0])
print(Point(5))     # Point(x=5, y=0)
print(Point(5, 6))  # Point(x=5, y=6)
```

[width(24,76)]

| 成员               | 作用                                   |
| :----------------- | :------------------------------------- |
| `p._replace(x=10)` | 返回替换字段后的**新**元组，原对象不变 |
| `p._asdict()`      | 转成普通字典，3.8 起返回普通 `dict`    |
| `Point._fields`    | 字段名元组，如 `('x', 'y')`            |

需要类型注解时，用 `typing.NamedTuple` 的类语法：

```python
from typing import NamedTuple


class Point(NamedTuple):
    x: int
    y: int = 0


p = Point(1)
print(p)  # Point(x=1, y=0)
print(isinstance(p, tuple), hash(p) == hash((1, 0)))  # True True
```

两种写法生成的都是 `tuple` 子类。字段名不能是关键字、不能以下划线开头；需要校验、可变字段或继承时，改用 `dataclasses.dataclass`。

## 6. 键、比较与性能

### 6.1 字典键与集合元素

```python
locations = {('北京', '朝阳'): '100020', ('上海', '浦东'): '200120'}
print(locations[('北京', '朝阳')])  # 100020

visited = {(0, 0), (1, 2), (3, 4)}
print((1, 2) in visited)  # True
```

用元组组合多个值当键，比拼接字符串更安全：不用选分隔符，也不会有歧义。

### 6.2 比较、排序与查询

元组按字典序比较：先比第 0 个元素，相等再比第 1 个。

```python
print((1, 2) < (1, 3))   # True
print((2,) < (10,))      # True

records = [(2, 'b'), (1, 'z'), (1, 'a')]
print(sorted(records))   # [(1, 'a'), (1, 'z'), (2, 'b')]

t = (1, 2, 1, 3, 1)
print(t.count(1))        # 3
print(t.index(2))        # 1
```

同一位置类型不同且无法比较时会抛 `TypeError`，例如 `(1, 'a') < (1, 2)`。多关键字排序 `key=lambda u: (u.age, u.name)` 正是利用了这个顺序。

### 6.3 内存与性能

64 位 CPython 下，元组比列表紧凑，因为它不为未来追加预留容量（可用 `sys.getsizeof` 验证）：

[width(30,70)]

| 对象     | `sys.getsizeof` 的典型值          |
| :------- | :-------------------------------- |
| `()`     | 40 字节，全局只有一个空元组       |
| `(1, 2)` | 56 字节                           |
| `[1, 2]` | 72 字节；多次 `append` 后可能更大 |

几个值得知道的点：

- 字面量常量元组在编译期可能被复用，创建开销极低；从生成器构造时按最终长度精确分配。
- 元组哈希不缓存，每次 `hash()` 都遍历所有元素；超长元组反复做键时要考虑这一点。不可变的真正价值是共享安全：可放心作为默认值或跨函数传递。
- 查询操作都是线性：`in`、`count`、`index` 均为 $O(n)$；下标 $O(1)$；拼接 `+` 为 $O(n+m)$ 且产生新对象。

## 7. 常见陷阱

**单元素漏逗号**：`(1)` 是整数，`(1,)` 才是元组。写默认值、字典键时漏逗号，报错位置往往离真正原因很远。

```python
print(type((1)))   # <class 'int'>
print(type((1,)))  # <class 'tuple'>
```

**把元组当只读列表**：元组没有 `append`、`remove`、`sort`，`t.sort()` 直接抛 `AttributeError`。需要排序用 `tuple(sorted(t))`；数据要反复增删就一开始用列表，最后再 `tuple(items)` 固定。

**循环里反复 `+` 拼接**：每次拼接都复制整个元组，累积是 $O(n^2)$。应先用列表 `append`，最后一次性转换：

```python
items = []
for x in range(1000):
    items.append(x)
result = tuple(items)
```

**误判可哈希**：看到元组就以为能当键。`('config', [1, 2])` 含列表，`{key: 'value'}` 会抛 `unhashable type: 'list'`；嵌套的列表、字典、普通集合都不行，可换成嵌套元组或 `frozenset`。

## 8. 小结

[width(24,76)]

| 关键点     | 说明                                                        |
| :--------- | :---------------------------------------------------------- |
| 定位       | 有序、不可变、轻量的序列，适合固定结构的数据。              |
| 创建       | 逗号才是标志；空元组 `()`，单元素必须写 `(1,)`。            |
| 不可变边界 | 不能换元素，但元素内部的列表等可变对象仍可被修改。          |
| 可哈希     | 所有元素可哈希时，才能做字典键或集合元素。                  |
| 解包       | 星号吸收、多返回值、交换变量都依赖元组语义。                |
| 命名元组   | 给位置起名字，仍是元组；需要注解时用 `typing.NamedTuple`。  |
| 性能       | 通常比列表省内存；但拼接是复制，反复追加应先攒列表。        |
| 常见陷阱   | 单元素漏逗号、当只读列表用、循环里 `+=`、含可变元素却当键。 |

**一句话理解**：元组是“位置固定、内容不许换”的序列，省内存、可哈希、能解包；需要变动时先用 [列表](/pythonBasics/dataStructures/list) 攒，最后再固定成元组。

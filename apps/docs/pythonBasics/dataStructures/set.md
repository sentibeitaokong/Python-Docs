---
outline: [2, 3]
---

# 集合 (Set)

集合是 Python 中**元素唯一、无序**的容器，底层同样是哈希表。它最擅长两件事：判断“某个元素在不在”，以及做交、并、差这类集合运算。

> [!TIP] 相关阅读
> 集合与 [字典](/pythonBasics/dataStructures/dict) 共享哈希表实现，但只存键不存值；需要保留顺序和下标时用 [列表](/pythonBasics/dataStructures/list)，需要不可变且可哈希的集合时用 `frozenset` 或 [元组](/pythonBasics/dataStructures/tuple)。批量生成集合见 [推导式](/pythonBasics/dataStructures/comprehensions)。

## 1. 核心特性

集合回答的是“**哪些东西存在**”这个问题。它不记录顺序，也不允许重复，换来平均 $O(1)$ 的成员判断。

[width(13,87)]

| 特性           | 描述                                                                              |
| :------------- | :-------------------------------------------------------------------------------- |
| **无序**       | 不按下标访问，不能切片；迭代顺序由哈希值决定，不保证跨版本、跨进程稳定。          |
| **唯一**       | 重复元素自动合并，每个值只出现一次。                                              |
| **哈希表**     | 用元素哈希值定位，平均 $O(1)$ 完成 `in`、`add`、`remove`；冲突严重时最坏 $O(n)$。 |
| **元素可哈希** | 元素必须可哈希，如 `int`、`str`、`tuple`；列表、字典、普通集合不能放进去。        |
| **可变性**     | `set` 可增删；`frozenset` 不可变、可哈希，能当字典键或另一个集合的元素。          |
| **集合运算**   | 并、交、差、对称差都有运算符和方法两套写法。                                      |

```python
tags = {'python', 'backend', 'python'}
print(tags)               # 输出两个元素，重复的自动去掉
print('python' in tags)   # True，平均 O(1)
```

> [!NOTE]
> “无序”不等于“每次都不一样”。同一个进程里，集合没被修改时迭代顺序是稳定的；但顺序由哈希值决定，字符串集合在不同进程间通常会变。

## 2. 创建集合

[width(30,29,41)]

| 写法                    | 结果                   | 说明                           |
| :---------------------- | :--------------------- | :----------------------------- |
| `{1, 2, 3}`             | `{1, 2, 3}`            | 字面量；空集合不能用 `{}`      |
| `set()`                 | `set()`                | 创建空集合的唯一写法           |
| `set([1, 2, 2, 3])`     | `{1, 2, 3}`            | 从任意可迭代对象构造，自动去重 |
| `set('hello')`          | `{'h', 'e', 'l', 'o'}` | 字符串会被拆成字符             |
| `{x for x in range(3)}` | `{0, 1, 2}`            | 集合推导式                     |
| `frozenset([1, 2])`     | `frozenset({1, 2})`    | 不可变集合，可哈希             |

```python
empty = set()
from_list = set([1, 2, 2, 3, 3])
from_str = set('hello')

print(empty, type(empty))     # set() <class 'set'>
print(sorted(from_list))      # [1, 2, 3]
print(sorted(from_str))       # ['e', 'h', 'l', 'o']
```

`{}` 是空字典，不是空集合：`type({})` 是 `dict`，`type(set())` 是 `set`。

### 2.1 frozenset

`frozenset` 是集合的不可变版本：不能 `add`、`remove`，因此可以计算哈希，能当字典键或放进另一个集合。

```python
fs = frozenset([1, 2, 3])
print(hash(fs))  # 可以计算
# fs.add(4)      # AttributeError

lookup = {fs: 'value'}
print(lookup[frozenset([3, 2, 1])])  # value，内容相等就能查到

groups = {frozenset({1, 2}), frozenset({3, 4})}  # 集合里放 frozenset
```

普通 `set` 不能放进另一个集合，因为它可变、不可哈希。

## 3. 增删元素

[width(24,28,48)]

| 方法               | 作用                           | 元素不存在 / 边界情况                  |
| :----------------- | :----------------------------- | :------------------------------------- |
| `add(x)`           | 加入**一个**元素               | 已存在则无操作；不可哈希抛 `TypeError` |
| `update(iterable)` | 加入一个可迭代对象里的所有元素 | 接受多个可迭代对象                     |
| `remove(x)`        | 删除指定元素                   | 不存在抛 `KeyError`                    |
| `discard(x)`       | 删除指定元素                   | 不存在时静默忽略                       |
| `pop()`            | 删除并返回**任意**一个元素     | 集合为空抛 `KeyError`                  |
| `clear()`          | 清空集合                       | 不适用                                 |

```python
s = {1, 2, 3}
s.add(4)
s.update([4, 5, 6])     # 可以传列表、元组、字符串、另一个集合
print(sorted(s))        # [1, 2, 3, 4, 5, 6]

s.remove(1)
s.discard(99)           # 99 不存在，但不会报错
s.pop()                 # 删除并返回任意一个元素
s.clear()
print(s)                # set()
```

`remove` 和 `discard` 只在“元素不存在”时不同：前者抛 `KeyError`，后者什么都不做。元素应当存在、缺失说明逻辑有问题时用 `remove`；清理外部数据时用 `discard`。

> [!WARNING]
> `add` 一次只能加一个元素。`s.add([4, 5])` 会抛 `TypeError: unhashable type: 'list'`，因为它试图把整个列表当成一个元素；加多个元素用 `s.update([4, 5])`。

## 4. 集合运算

[width(13,13,38,36)]

| 运算   | 运算符 | 对应方法                      | 含义                         |
| :----- | :----- | :---------------------------- | :--------------------------- |
| 并集   | `\|`   | `union(*others)`              | 出现在任意一个集合里的元素   |
| 交集   | `&`    | `intersection(*others)`       | 同时出现在所有集合里的元素   |
| 差集   | `-`    | `difference(*others)`         | 在左边但不在右边（顺序有关） |
| 对称差 | `^`    | `symmetric_difference(other)` | 只出现在其中一个集合里的元素 |

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(sorted(a | b))  # [1, 2, 3, 4, 5, 6]
print(sorted(a & b))  # [3, 4]
print(sorted(a - b))  # [1, 2]，只在 a 中
print(sorted(b - a))  # [5, 6]，只在 b 中
print(sorted(a ^ b))  # [1, 2, 5, 6]
```

差集不满足交换律：`a - b` 和 `b - a` 通常不同；其余三个运算满足交换律。

**运算符要求两边都是集合，方法接受任意可迭代对象**，这是两套写法最重要的差异：

```python
a = {1, 2, 3}

print(a.union([3, 4]))           # {1, 2, 3, 4}，方法接受列表
print(a.intersection([2, 3, 9]))  # {2, 3}
print(a.difference([1]))         # {2, 3}
```

`a | [3, 4]` 会抛 `TypeError`。方法还能一次接受多个可迭代对象，如 `a.union(b, c)`、`a.intersection(b, c)`、`a.difference(b, c)`。

**原地更新**用 `|=`、`&=`、`-=`、`^=`，或对应的 `update`、`intersection_update`、`difference_update`、`symmetric_difference_update`：

```python
s = {1, 2, 3, 4}
s |= {5, 6}       # 并集更新
s &= {2, 3, 5}    # 交集更新
s -= {2}          # 差集更新
s ^= {9, 10}      # 对称差更新
print(sorted(s))  # [3, 5, 9, 10]
```

> [!WARNING]
> 原地运算符同样要求右边是集合：`s |= [1, 2]` 会抛 `TypeError`，而 `s.update([1, 2])` 可以正常工作。

`frozenset` 参与运算时，结果类型跟随左操作数：`set | frozenset` 得到 `set`，`frozenset | set` 得到 `frozenset`。

## 5. 关系判断

集合的比较运算符不是字典序，而是**包含关系**：

[width(26,24,50)]

| 写法              | 含义              | 说明                                |
| :---------------- | :---------------- | :---------------------------------- |
| `a <= b`          | `a` 是 `b` 的子集 | 允许相等                            |
| `a < b`           | 真子集            | 必须严格更小                        |
| `a >= b`          | 超集              | 允许相等                            |
| `a > b`           | 真超集            | 必须严格更大                        |
| `a.issubset(b)`   | 子集判断          | 接受任意可迭代对象                  |
| `a.issuperset(b)` | 超集判断          | 接受任意可迭代对象                  |
| `a.isdisjoint(b)` | 是否没有交集      | 无交集返回 `True`，空集和谁都不相交 |

```python
print({1, 2} <= {1, 2, 3})  # True
print({1, 2} < {1, 2})      # False，不是真子集
print({1, 2} <= {1, 2})     # True，允许相等

print({1, 2}.issubset([1, 2, 3]))  # True，方法接受列表
print({1, 2}.isdisjoint({3, 4}))   # True
```

运算符同样要求两边是集合，`{1, 2} <= [1, 2, 3]` 会抛 `TypeError`。`==` 比较内容，与顺序无关：`{1, 2, 3} == {3, 2, 1}` 为 `True`。

## 6. 常用场景与性能

### 6.1 去重与成员判断

```python
nums = [3, 1, 3, 2]
print(sorted(set(nums)))            # [1, 2, 3]

# 去重但保留第一次出现的顺序
print(list(dict.fromkeys(nums)))    # [3, 1, 2]
```

集合去重不保留原顺序；需要保序时用 `dict.fromkeys()`，它同样要求元素可哈希。

列表的 `in` 是 $O(n)$，集合平均是 $O(1)$。数据量大、判断频繁时先转成集合：

```python
allowed = {'admin', 'editor', 'viewer'}
role = 'editor'
if role in allowed:
    print('权限通过')
```

### 6.2 交并差：共同好友

```python
alice = {'Amy', 'Bob', 'Cara'}
bob = {'Bob', 'Cara', 'Dan'}

print(sorted(alice & bob))        # ['Bob', 'Cara']，共同好友
print(sorted(alice - bob))        # ['Amy']，alice 独有
print(sorted(alice ^ bob))        # ['Amy', 'Dan']，只出现在一边
```

### 6.3 图遍历中的 visited

集合最经典的算法用途之一是记录已访问节点，判断是否访问过是 $O(1)$：

```python
graph = {'A': ['B', 'C'], 'B': ['D'], 'C': ['D', 'E'], 'D': [], 'E': []}

def reachable(graph, start):
    visited = set()
    stack = [start]
    while stack:
        node = stack.pop()
        if node in visited: continue
        visited.add(node)
        stack.extend(n for n in graph.get(node, []) if n not in visited)
    return visited


print(sorted(reachable(graph, 'A')))  # ['A', 'B', 'C', 'D', 'E']
```

换成列表存 `visited`，每次 `in` 都要扫一遍，节点多时复杂度会从 $O(V+E)$ 退化。

### 6.4 性能与内存

[width(22,31,47)]

| 操作              | 平均复杂度                  | 说明                            |
| :---------------- | :-------------------------- | :------------------------------ |
| `x in s`          | $O(1)$                      | 哈希定位；冲突严重时最坏 $O(n)$ |
| `add` / `remove`  | $O(1)$                      | 同样是哈希定位                  |
| 迭代 `for x in s` | $O(n)$                      | 顺序不保证                      |
| `a \| b`          | $O(len(a)+len(b))$          | 遍历两个集合                    |
| `a & b`           | 约 $O(min(len(a), len(b)))$ | 通常遍历较小的那个              |
| `a - b`           | $O(len(a))$                 | 结果最多和左边一样大            |

集合省的是查找时间，费的是内存：每个元素除了对象本身，还要存哈希值和哈希表的空槽，负载因子低于 1。因此只需要顺序遍历的数据用列表更省，频繁判断存在、频繁去重的数据才用集合。

## 7. 常见陷阱

**`{}` 是空字典**：空集合只能写 `set()`。

```python
print(type({}), type(set()))  # <class 'dict'> <class 'set'>
```

**`remove` 与 `discard`**：`remove(3)` 在 3 不存在时抛 `KeyError`；`discard(3)` 静默忽略，集合不变。

**集合里不能放可变对象**：

```python
try:
    {1, 2}.add({'a': 1})
except TypeError as e:
    print(e)  # unhashable type: 'dict'
```

需要放“一组值”时用元组或 `frozenset`，如 `{(1, 2), (3, 4)}`；元组本身也必须元素全可哈希。

**不要依赖遍历顺序**：`set([3, 1, 2])` 的打印顺序不保证。整数集合看起来常按大小排列，只是小整数的哈希值等于自身；字符串集合还会因哈希随机化在不同进程间变化。需要确定顺序就 `sorted(s)`，需要保序去重用 `dict.fromkeys()`。

**遍历时修改集合**：会抛 `RuntimeError: Set changed size during iteration`。先复制 `for x in list(s):`，或收集完再统一 `update` / `difference_update`。

## 8. 小结

[width(24,76)]

| 关键点   | 说明                                                              |
| :------- | :---------------------------------------------------------------- |
| 定位     | 无序、唯一、基于哈希表的容器，平均 $O(1)$ 判断成员是否存在。      |
| 创建     | 空集合只能 `set()`；`{}` 是空字典；`frozenset()` 创建不可变版本。 |
| 增删     | `add` 加一个，`update` 加一批；`remove` 抛错，`discard` 静默。    |
| 运算     | `\|`、`&`、`-`、`^` 要求两边是集合，方法可接受任意可迭代对象。    |
| 关系     | `<=` / `<` / `>=` / `>` 是子集与超集，不是字典序。                |
| 常用场景 | 去重、快速成员判断、交并差、图遍历的 `visited`。                  |
| 顺序     | 不保证；有序去重用 `dict.fromkeys()`，确定顺序用 `sorted()`。     |
| 常见陷阱 | `{}` 是字典、`remove` 抛错、集合里不能放 list、遍历时修改。       |

**一句话理解**：集合是“只关心有没有”的哈希容器，去重和成员判断是它的主场；需要保留顺序时用 [列表](/pythonBasics/dataStructures/list)，需要键值映射时用 [字典](/pythonBasics/dataStructures/dict)，需要不可变集合时用 `frozenset`。

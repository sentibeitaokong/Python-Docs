---
outline: [2, 3]
---

# 字典 (Dict)

字典是 Python 的**键值映射**容器，底层是哈希表：用键直接定位值，平均查找 $O(1)$。Python 3.7 起保证遍历顺序与插入顺序一致。

> [!TIP] 相关阅读
> 键必须可哈希，这一点和 [元组](/pythonBasics/dataStructures/tuple) 关系密切；只需要“存在性”而不需要映射时用 [集合](/pythonBasics/dataStructures/set)。批量构造或反转字典见 [推导式](/pythonBasics/dataStructures/comprehensions)，顺序访问对比见 [列表](/pythonBasics/dataStructures/list)。

## 1. 核心特性

字典回答的是“**按名字查数据**”这个问题。它保存键值对，键唯一，值可以重复。

[width(13,87)]

| 特性         | 描述                                                                            |
| :----------- | :------------------------------------------------------------------------------ |
| **哈希表**   | 用键的哈希值定位槽位，平均 $O(1)$ 完成查找、插入、删除；冲突严重时最坏 $O(n)$。 |
| **键唯一**   | 同一个键只出现一次；重复赋值覆盖旧值。                                          |
| **键可哈希** | 键必须不可变且可哈希，如 `int`、`str`、`tuple`；列表、字典不行。                |
| **插入有序** | 3.7 起遍历顺序就是插入顺序；覆盖已有键不改变它原来的位置。                      |
| **值任意**   | 值可以是任何对象，包括列表、字典、函数，不要求可哈希。                          |

```python
user = {'name': 'Amy', 'age': 30, 'tags': ['python', 'backend']}

print(user['name'])   # Amy
print('age' in user)  # True，in 只检查键
```

“插入有序”不等于“自动排序”，按键或值排序要显式调用 `sorted()`。

## 2. 创建字典

[width(37,28,35)]

| 写法                           | 结果                   | 说明                          |
| :----------------------------- | :--------------------- | :---------------------------- |
| `{}`                           | 空字典                 | 空集合要写 `set()`，不是 `{}` |
| `{'a': 1, 'b': 2}`             | `{'a': 1, 'b': 2}`     | 最常用的字面量                |
| `dict(a=1, b=2)`               | `{'a': 1, 'b': 2}`     | 键只能是合法标识符字符串      |
| `dict([('a', 1), ('b', 2)])`   | `{'a': 1, 'b': 2}`     | 从键值对序列构造              |
| `dict(zip(keys, values))`      | 两个序列一一配对       | 批量构造；以短序列为准        |
| `dict.fromkeys(keys, 0)`       | 所有键指向同一个默认值 | 默认值可变时有共享陷阱        |
| `{x: x * x for x in range(3)}` | `{0: 0, 1: 1, 2: 4}`   | 字典推导式                    |

`dict(zip(keys, values))` 在最短的序列结束时停止，多出来的元素直接丢掉，不会报错。

### 2.1 fromkeys 的共享值陷阱

`dict.fromkeys(keys, value)` 只创建一个 `value`，所有键都指向它。默认值是列表时，改一个键会影响全部：

```python
d = dict.fromkeys(['a', 'b'], [])
d['a'].append(1)
print(d)  # {'a': [1], 'b': [1]}，共享同一个列表
d = {k: [] for k in ['a', 'b']}  # 正确：每个键新建列表
d['a'].append(1)
print(d)  # {'a': [1], 'b': []}
```

默认值是 `int`、`str`、`None` 时共享没问题，可以放心用。

### 2.2 推导式与合并

```python
nums = [1, 2, 3, 4]

squares = {x: x * x for x in nums}
evens = {x: x * x for x in nums if x % 2 == 0}  # 过滤
prices = {'apple': 3, 'banana': 2}
by_price = {v: k for k, v in prices.items()}  # 反转，值要唯一
```

合并字典时后写的键覆盖先写的：`{**a, **b}` 从 3.5 起可用，`a | b` 从 3.9 起可用，都返回新字典。

```python
a = {'x': 1, 'y': 2}
b = {'y': 20, 'z': 30}

print({**a, **b})  # {'x': 1, 'y': 20, 'z': 30}
print(a | b)       # 同上，Python 3.9+
```

## 3. 访问与修改

[width(27,28,26,19)]

| 操作                 | 作用                           | 示例                   | 键不存在时     |
| :------------------- | :----------------------------- | :--------------------- | :------------- |
| `d[k]`               | 读取键对应的值                 | `d['name']`            | 抛 `KeyError`  |
| `d.get(k, default)`  | 安全读取                       | `d.get('age', 0)`      | 返回 `default` |
| `d.setdefault(k, v)` | 存在则返回旧值，不存在则插入   | `d.setdefault('n', 0)` | 插入后返回 `v` |
| `d.update(other)`    | 批量更新，接受映射或键值对序列 | `d.update({'a': 1})`   | 新增           |
| `d1 \| d2`           | 合并并返回新字典，3.9+         | `a \| b`               | 新增           |
| `d1 \|= d2`          | 原地合并，3.9+                 | `a \|= b`              | 新增           |
| `del d[k]`           | 删除指定键                     | `del d['age']`         | 抛 `KeyError`  |
| `d.pop(k, default)`  | 删除并返回指定键的值           | `d.pop('age', None)`   | 返回 `default` |
| `d.popitem()`        | 删除并返回最后插入的键值对     | `d.popitem()`          | 抛 `KeyError`  |
| `d.clear()`          | 清空所有键值对                 | `d.clear()`            | 不适用         |

```python
d = {'name': 'Amy', 'age': 30}
print(d['name'], d.get('city', '未知'))  # Amy 未知
d['age'] = 31                            # 覆盖
d.update({'age': 32, 'job': 'engineer'})  # 批量更新
d.setdefault('tags', []).append('python')  # 缺失时建列表再追加

print(d.popitem())  # ('tags', ['python'])，删除最后插入的
```

### 3.1 get 与 KeyError 的取舍

`d[k]` 在键缺失时立即抛 `KeyError`，适合“这个键必须存在”；`get` 把缺失当成正常分支，返回 `None` 或默认值。

```python
config = {'timeout': None}

print(config.get('timeout'))  # None
print('timeout' in config)    # True，说明键存在、值是 None
```

`get(k)` 无法区分“缺失”和“值就是 `None`”。需要区分时用 `in`，或把 `get` 的默认值设为独有的哨兵对象再比较 `is`。

`setdefault(k, default)` 的 `default` 每次调用都会先求值，即使键已存在；构造默认值很贵时先判断 `k in d`。`update` 与 `|=` 都接受键值对序列，但 `|` 要求两边都是字典，传列表会抛 `TypeError`。

## 4. 遍历与视图

`keys()`、`values()`、`items()` 返回**视图**，不复制数据，会实时反映字典变化，但不能按下标访问。

[width(20,26,54)]

| 视图         | 迭代得到        | 说明                                     |
| :----------- | :-------------- | :--------------------------------------- |
| `d.keys()`   | 所有键          | 支持集合运算，如 `d.keys() & other`      |
| `d.values()` | 所有值          | 可能有重复，不支持集合运算               |
| `d.items()`  | `(键, 值)` 元组 | 最常用；值的可哈希性决定能否参与集合运算 |

常用的遍历写法是 `for k, v in d.items()`；视图是动态的，字典新增键后 `list(d.keys())` 会立刻反映出来。`reversed(d)`（3.8+）按键的插入顺序反向遍历。

### 4.1 遍历时修改的陷阱

遍历中增删键会改变哈希表大小，Python 抛 `RuntimeError`：

```python
d = {'a': 1, 'b': 2, 'c': 3}
try:
    for k in d:
        if k == 'a':
            del d[k]
except RuntimeError as e:
    print(e)  # dictionary changed size during iteration

for k in list(d):  # 先复制一份键的快照
    if k == 'a':
        del d[k]
```

只修改已有键的**值**、不改变键集合是允许的：`for k in d: d[k] *= 10` 可以正常工作。

## 5. 常用模式

**计数**：用 `get` 提供初值，或用 `Counter`。

```python
words = ['apple', 'banana', 'apple']
counts = {}
for word in words:
    counts[word] = counts.get(word, 0) + 1

from collections import Counter
print(Counter(words).most_common(2))  # [('apple', 2), ('banana', 1)]
```

**分组**：`setdefault` 或 `defaultdict(list)`。

```python
from collections import defaultdict

groups = defaultdict(list)
for user in [{'name': 'Amy', 'dept': 'dev'}, {'name': 'Bob', 'dept': 'ops'}]:
    groups[user['dept']].append(user['name'])

print(dict(groups))  # {'dev': ['Amy'], 'ops': ['Bob']}
```

`defaultdict` 读取不存在的键时会顺手插入默认值，`groups['missing']` 会改变字典；只想查询时用 `.get('missing', [])`。

**反转与排序**：

```python
d = {'a': 1, 'b': 2, 'c': 3}

reverse = {v: k for k, v in d.items()}  # 值重复时后者覆盖
by_value = dict(sorted(d.items(), key=lambda kv: kv[1], reverse=True))
print(by_value)  # {'c': 3, 'b': 2, 'a': 1}
```

`sorted` 是稳定的，值相同的条目保持原来的插入顺序。

**合并多份配置**：逐份 `update`，后写的覆盖先写的；需要保留分层来源时用 6.3 的 `ChainMap`。

## 6. 键的契约与嵌套访问

### 6.1 自定义对象作为键

字典用 `__hash__` 定位槽位，用 `__eq__` 判断两个键是否相同，两者必须成对正确实现：

```python
class Point:
    __slots__ = ('x', 'y')
    def __init__(self, x, y): self.x, self.y = x, y
    def __eq__(self, other): return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)
    def __hash__(self): return hash((self.x, self.y))

cache = {Point(1, 2): 'value'}
print(cache[Point(1, 2)])  # value，等价对象能查到
```

契约有两条：

- **相等的对象必须有相同的哈希值**，否则会被分到不同槽位，永远查不到。
- **哈希相同不代表相等**，那只是冲突，字典会再用 `__eq__` 比较。

> [!WARNING]
> 只实现 `__eq__` 不实现 `__hash__`，Python 会把 `__hash__` 设为 `None`，类直接不可哈希。用可变字段计算哈希也危险：对象进字典后字段一变，就再也查不到。键要么不可变，要么在作为键期间不修改。

### 6.2 嵌套字典与安全取值

```python
config = {'db': {'host': 'localhost', 'port': 5432}}
print(config['db']['host'])                  # localhost
print(config.get('db', {}).get('host'))      # localhost
print(config.get('redis', {}).get('host'))   # None
```

`config.get('db', {})` 只保护“键不存在”，保护不了“键存在但值是 `None`”：`{'db': None}.get('db', {}).get('host')` 会抛 `AttributeError`。需要通用方案时写一个逐层检查 `isinstance(data, dict)` 的 `deep_get` 函数，或约定缺失层不出现 `None`。

写入嵌套结构时，用 `setdefault` 逐层建容器：

```python
config = {}
config.setdefault('db', {})['port'] = 5432
```

### 6.3 用 ChainMap 做分层查找

`ChainMap` 把多个字典串成查找链：从左到右找，先找到的生效；写入只落在第一个字典。

```python
from collections import ChainMap

defaults = {'host': 'localhost', 'port': 5432}
cli_args = {'port': 8000}
config = ChainMap(cli_args, defaults)

print(config['port'], config['host'])  # 8000 localhost
config['host'] = 'example.com'         # 写入第一层
```

适合“默认配置 + 环境变量 + 命令行参数”的分层覆盖，不必真的复制合并。`dict(config)` 会拍平，`config.new_child({...})` 可临时叠加一层。

## 7. 常见陷阱

**浮点数当键**：精度误差会让“算出来的值”和“字面量”不相等。

```python
d = {0.1 + 0.2: 'value'}
print(0.1 + 0.2)  # 0.30000000000000004
```

此时 `d[0.3]` 会抛 `KeyError`。金额、精确小数用 `Decimal` 或字符串当键，不要用 `float`。

**跨类型键合并**：`1`、`1.0`、`True` 相等且哈希相同，是同一个键，所以 `{1: 'int', 1.0: 'float', True: 'bool'}` 的结果是 `{1: 'bool'}`。`-0.0` 与 `0.0` 同理。`float('nan')` 不等于任何值，包括自己；同一个 `nan` 对象因身份相同能查到，换一个 `nan` 就查不到，不要拿 NaN 当键。

**遍历中增删**：见 4.1，遍历 `list(d)` 的快照或生成新字典。

**KeyError 与 get**：`d[k]` 让缺失尽早暴露；`get` 适合缺失可接受的分支，但会掩盖“值是 None”的情况。见 3.1。

**fromkeys 共享可变默认值**：见 2.1。默认值可变时改用字典推导式。

## 8. 小结

[width(15,85)]

| 关键点     | 说明                                                                       |
| :--------- | :------------------------------------------------------------------------- |
| 定位       | 基于哈希表的键值映射，平均 $O(1)$ 查找，3.7+ 保持插入顺序。                |
| 键的要求   | 必须可哈希；`1`、`1.0`、`True` 是同一个键，浮点数和 NaN 慎用。             |
| 创建       | 字面量、`dict()`、`zip`、推导式；`fromkeys` 的可变默认值会共享。           |
| 访问与修改 | `d[k]` 快速失败，`get` 容错；`update` / `\|=` 批量更新，`popitem` 删最后。 |
| 遍历       | `keys` / `values` / `items` 是动态视图；遍历时不能增删键。                 |
| 常用模式   | 计数用 `Counter`，分组用 `defaultdict`，分层配置用 `ChainMap`。            |
| 常见陷阱   | 浮点键、遍历中修改、`get` 掩盖缺失、共享可变默认值。                       |

**一句话理解**：字典是“用可哈希的键换 $O(1)$ 查找”的映射表；需要顺序和下标时用 [列表](/pythonBasics/dataStructures/list)，只关心成员是否存在时用 [集合](/pythonBasics/dataStructures/set)，批量生成映射时用 [推导式](/pythonBasics/dataStructures/comprehensions)。

---
outline: [2, 3]
---

# 列表 (List)

列表是 Python 中使用频率最高的容器，本质是一个**可变的、有序的、元素类型不限**的序列。它用连续的内存保存对象引用，因此按下标访问极快，而头部插入、删除则需要整体搬移。

> [!TIP] 相关阅读
> 列表与 [元组](/pythonBasics/dataStructures/tuple)、[字典](/pythonBasics/dataStructures/dict)、[集合](/pythonBasics/dataStructures/set) 并列为四大内置容器；由循环批量生成列表的写法见 [推导式](/pythonBasics/dataStructures/comprehensions)。

## 1. 核心特性

列表回答的是“**按顺序存一组会变的数据**”这个问题。它保存的不是元素本身，而是一组指向 Python 对象的指针。

[width(13,87)]

| 特性         | 描述                                                                                                   |
| :----------- | :----------------------------------------------------------------------------------------------------- |
| **有序**     | 元素按插入顺序排列，可用下标 `0 ~ len-1` 访问，也支持负数下标从末尾倒数。                              |
| **可变**     | 可以原地追加、删除、替换元素，`id()` 不变；这是它与 `tuple`、`str` 最根本的区别。                      |
| **异构**     | 同一个列表可以混放整数、字符串、对象，甚至嵌套另一个列表。                                             |
| **动态扩容** | 无需预先声明长度，`append` 触发容量不足时会按比例扩容，单次扩容 $O(n)$，但摊还到每次是 $O(1)$。        |
| **存引用**   | `[a, b]` 保存的是对象引用。对元素的修改会反映到原对象；简单赋值 `b = a` 也只是复制引用，不是复制列表。 |
| **可迭代**   | 实现了序列协议，支持 `for`、切片、解包、`in`、`len()`、`reversed()` 等所有序列通用操作。               |

```python
nums = [3, 1, 4]
mixed = [1, 'two', 3.0, None, [5, 6]]
print(nums[0], nums[-1])  # 3 4
print(len(mixed))  # 5
```

## 2. 创建与初始化

```python
# 1. 字面量：最常用
empty = []
nums = [1, 2, 3]

# 2. list() 构造：把任意可迭代对象转成列表
chars = list('abc')  # ['a', 'b', 'c']
squares = list(range(1, 6))  # [1, 2, 3, 4, 5]

# 3. 推导式：带条件的批量生成
evens = [x for x in range(10) if x % 2 == 0]  # [0, 2, 4, 6, 8]

# 4. 重复运算符
zeros = [0] * 5  # [0, 0, 0, 0, 0]
```

### 2.1 乘法创建二维列表的陷阱

`[0] * 5` 对不可变元素是安全的，但**对可变元素会共享引用**：

```python
# 错误：三行指向同一个内层列表
grid = [[0] * 3] * 3
grid[0][0] = 1
print(grid)  # [[1, 0, 0], [1, 0, 0], [1, 0, 0]]

# 正确：每轮推导式都新建一个内层列表
grid = [[0] * 3 for _ in range(3)]
grid[0][0] = 1
print(grid)  # [[1, 0, 0], [0, 0, 0], [0, 0, 0]]
```

> [!WARNING]
> `[[0] * 3] * 3` 只复制了外层列表的三个**引用**，内层列表仍只有一个。判断是否踩坑的方法：修改一个元素，看其他行是否跟着变。

### 2.2 类型注解

```python
from typing import Any

nums: list[int] = [1, 2, 3]
matrix: list[list[float]] = [[1.0], [2.0]]
anything: list[Any] = [1, 'a', None]
```

Python 3.9 起可以直接写内置泛型 `list[int]`；3.8 及更早版本需要 `from typing import List`。

## 3. 常用操作

### 3.1 增加元素

[width(23,33,28,16)]

| 方法               | 描述                                   | 示例                         | 时间复杂度  |
| :----------------- | :------------------------------------- | :--------------------------- | :---------- |
| **`append(x)`**    | 在末尾追加**一个**元素。               | `nums.append(4)`             | 摊还 $O(1)$ |
| **`extend(it)`**   | 在末尾追加一个可迭代对象里的所有元素。 | `nums.extend([4, 5])`        | $O(k)$      |
| **`insert(i, x)`** | 在索引 `i` 前插入元素，后续元素后移。  | `nums.insert(0, 9)`          | $O(n)$      |
| **`+`**            | 拼接两个列表，返回**新列表**。         | `[1, 2] + [3]` → `[1, 2, 3]` | $O(n+m)$    |
| **`*`**            | 重复列表内容，返回新列表。             | `[0] * 3`                    | $O(nk)$     |

```python
nums = [1, 2]
nums.append(3)  # [1, 2, 3]
nums.extend('ab')  # [1, 2, 3, 'a', 'b']
nums.insert(1, 9)  # [1, 9, 2, 3, 'a', 'b']
```

注意 `extend('ab')` 会逐个字符展开，而 `append('ab')` 会把整个字符串当成一个元素。

### 3.2 删除元素

[width(20,52,28)]

| 写法              | 描述                                        | 示例             |
| :---------------- | :------------------------------------------ | :--------------- |
| **`pop(i=-1)`**   | 删除并返回指定位置元素，默认删末尾。        | `nums.pop()`     |
| **`remove(x)`**   | 删除**第一个**等于 `x` 的元素，找不到抛错。 | `nums.remove(2)` |
| **`del nums[i]`** | 删除指定下标或切片，不返回值。              | `del nums[0]`    |
| **`clear()`**     | 清空列表，保留列表对象本身。                | `nums.clear()`   |

```python
nums = [10, 20, 30, 20]
nums.remove(20)  # [10, 30, 20]
last = nums.pop()  # last = 20, nums = [10, 30]
del nums[0]  # [30]
```

`remove` 按**值**删除且只删第一个；`pop` 按**位置**删除并返回元素。不确定值是否存在时，先用 `in` 判断，或捕获 `ValueError`。

### 3.3 查找与统计

```python
nums = [1, 2, 3, 2, 4]

print(nums.index(2))  # 1，第一个 2 的下标；找不到抛 ValueError
print(nums.count(2))  # 2
print(3 in nums)  # True，时间复杂度 O(n)

# 指定区间查找：[start, stop)
print(nums.index(2, 2))  # 3
```

### 3.4 排序与反转

```python
nums = [3, 1, 2]

nums.sort()  # 原地升序，返回 None
nums.sort(reverse=True)  # 原地降序
nums.reverse()  # 原地反转

# sorted 返回新列表，原列表不变
new_nums = sorted(nums)
desc = sorted(nums, key=lambda x: -x)

# 多关键字排序：先按 age，再按 name
users = [{'name': 'Bob', 'age': 30}, {'name': 'Amy', 'age': 30}]
users.sort(key=lambda u: (u['age'], u['name']))
```

> [!WARNING]
> `nums.sort()` 是**原地**排序，返回值是 `None`。写 `nums = nums.sort()` 会把列表弄丢。需要新列表时用 `sorted(nums)`。

Python 的排序是 **Timsort**，稳定且最坏 $O(n \log n)$：比较结果相等的元素会保持原有相对顺序。

### 3.5 复制列表

```python
a = [1, 2, 3]
b = a.copy()  # 浅拷贝
c = a[:]  # 浅拷贝
d = list(a)  # 浅拷贝

e = [a, a]  # 只是把引用放进新列表，不是拷贝
```

浅拷贝只复制第一层；嵌套列表仍共享内层对象。需要完全独立时使用 `copy.deepcopy`：

```python
import copy

grid = [[1], [2]]
shallow = grid.copy()
deep = copy.deepcopy(grid)
shallow[0][0] = 99
print(grid)  # [[99], [2]]，内层被共享
print(deep)  # [[1], [2]]
```

## 4. 切片与解包

### 4.1 切片

切片的完整语法是 `lst[start:stop:step]`，区间为**左闭右开**：

```python
nums = [0, 1, 2, 3, 4, 5]

print(nums[1:4])  # [1, 2, 3]
print(nums[:3])  # [0, 1, 2]
print(nums[3:])  # [3, 4, 5]
print(nums[::2])  # [0, 2, 4]
print(nums[::-1])  # [5, 4, 3, 2, 1]
print(nums[-2:])  # [4, 5]
```

切片**越界不会报错**，会尽可能截取；但直接按下标访问越界会抛 `IndexError`。

### 4.2 切片赋值

切片不仅能读，还能整段替换，长度可以不同：

```python
nums = [0, 1, 2, 3, 4]
nums[1:4] = ['a', 'b']  # [0, 'a', 'b', 4]
nums[1:2] = []  # [0, 'b', 4]，删除
nums[:] = [9]  # 原地替换全部内容
```

### 4.3 解包

```python
first, second = [1, 2]
head, *rest = [1, 2, 3, 4]  # head=1, rest=[2, 3, 4]
*init, last = [1, 2, 3, 4]  # init=[1, 2, 3], last=4

# 交换变量
a, b = 1, 2
a, b = b, a

# 函数返回多个值时，本质是返回元组，再用解包接住
def min_max(nums):
    return min(nums), max(nums)


low, high = min_max([3, 1, 4])
```

## 5. 性能与底层实现

CPython 的 `list` 不是链表，而是一块**连续的 `PyObject*` 指针数组**，额外维护 `ob_size`（已用长度）和分配容量。容量不足时按约 `size + size >> 3 + 6` 的策略扩容，所以 `append` 的摊还复杂度是 $O(1)$。

[width(27,18,55)]

| 操作                    | 复杂度        | 说明                                       |
| :---------------------- | :------------ | :----------------------------------------- |
| 按下标读写 `lst[i]`     | $O(1)$        | 直接按指针偏移定位。                       |
| 末尾 `append` / `pop()` | 摊还 $O(1)$   | 扩容偶尔 $O(n)$，均摊后仍接近常数。        |
| 头部 `insert(0, x)`     | $O(n)$        | 所有元素后移一位。                         |
| 中间删除 `pop(i)`       | $O(n)$        | 删除位置之后的元素全部前移。               |
| 成员判断 `x in lst`     | $O(n)$        | 逐个比较；频繁判断应改用 `set` 或 `dict`。 |
| `sort()`                | $O(n \log n)$ | Timsort，稳定排序。                        |
| 切片 `lst[a:b]`         | $O(k)$        | 复制长度为 $k$ 的新列表。                  |

因此：

- **尾部增删**用列表非常高效，可以当栈用（`append` / `pop`）。
- **头部增删**很慢；需要队列时用 `collections.deque`。
- **频繁成员判断**不要用列表，用 `set`。
- **大量数值计算**用 `array` 或 NumPy，它们保存的是原始数值而不是对象指针。

## 6. 常见陷阱

### 6.1 遍历时删除元素

```python
nums = [1, 2, 2, 3]
for x in nums:
    if x == 2:
        nums.remove(x)  # 删除后索引前移，会漏掉元素
print(nums)  # [1, 2, 3]

# 正确：推导式生成新列表
nums = [x for x in nums if x != 2]
```

### 6.2 把列表当默认参数

```python
def add_item(item, bucket=[]):  # 默认值只在函数定义时创建一次
    bucket.append(item)
    return bucket


print(add_item(1))  # [1]
print(add_item(2))  # [1, 2]，共享同一个列表
```

正确写法是用 `None` 占位，在函数体内新建：

```python
def add_item(item, bucket=None):
    if bucket is None:
        bucket = []
    bucket.append(item)
    return bucket
```

### 6.3 `sort()` 返回 `None`

```python
nums = [3, 1, 2]
result = nums.sort()
print(result)  # None
print(nums)  # [1, 2, 3]，原列表已被排序
```

### 6.4 列表乘法共享引用

见上文 2.1 节。一句话：外层 `*` 只复制引用，内层可变对象仍共享。

### 6.5 用 `==` 比较列表

`==` 逐元素比较值，`is` 比较是否为同一个对象。两个内容相同的列表 `==` 为 `True`，但 `is` 通常为 `False`：

```python
a = [1, 2]
b = [1, 2]
print(a == b)  # True
print(a is b)  # False
```

## 7. 小结

[width(15,85)]

| 关键点     | 说明                                                                             |
| :--------- | :------------------------------------------------------------------------------- |
| 定位       | 有序、可变、异构的连续引用数组。                                                 |
| 适合场景   | 按下标访问、尾部增删、排序、需要保留插入顺序的一批数据。                         |
| 不适合场景 | 频繁头部增删（用 `deque`）、频繁成员判断（用 `set`）、超大数值计算（用 NumPy）。 |
| 必记陷阱   | 乘法浅拷贝、遍历时删除、`sort()` 返回 `None`、可变默认参数。                     |
| 与元组区别 | 列表可变、开销略大；元组不可变、可哈希、可作为字典键。                           |

**一句话理解**：列表是 Python 的“动态数组”，按下标访问和尾部追加是它的主场；需要去重、快速查找或键值映射时，换 [集合](/pythonBasics/dataStructures/set) 或 [字典](/pythonBasics/dataStructures/dict)。

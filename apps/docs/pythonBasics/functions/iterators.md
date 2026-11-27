---
outline: [2, 3]
---

# 迭代器与可迭代对象 (Iterators and Iterables)

`for` 循环能遍历列表、字典、文件、生成器，靠的是一套统一协议：可迭代对象负责“能产出迭代器”，迭代器负责“逐个给出下一个值”。把这两件事分清，很多“为什么只能遍历一次”的问题就自然消失了。

> [!TIP] 相关阅读
> 用 `yield` 创建迭代器的最简方式见 [生成器](/pythonBasics/functions/generators)；推导式与生成器表达式的写法见 [推导式](/pythonBasics/dataStructures/comprehensions)；容器本身的遍历特性见 [列表](/pythonBasics/dataStructures/list) 与 [字典](/pythonBasics/dataStructures/dict)；`for` 的语法基础见 [运算符与流程控制](/pythonBasics/basic/operatorsAndControlFlow)。

## 1. 可迭代对象 vs 迭代器

这两个概念经常被混用，但职责不同：

[width(15,49,36)]

| 概念       | 要求                                        | 说明                                       |
| :--------- | :------------------------------------------ | :----------------------------------------- |
| 可迭代对象 | 实现 `__iter__`，返回一个迭代器。           | 列表、元组、字典、集合、字符串、文件都是。 |
| 迭代器     | 实现 `__next__`，耗尽时抛 `StopIteration`。 | 迭代器自己的 `__iter__` 通常返回 `self`。  |

```python
from collections.abc import Iterable, Iterator

nums = [1, 2, 3]
it = iter(nums)
print(isinstance(nums, Iterable), isinstance(nums, Iterator))  # True False
print(isinstance(it, Iterator))  # True
print(type(it))  # <class 'list_iterator'>
```

可迭代对象不是迭代器：列表本身没有 `__next__`，每次 `iter(list)` 都返回一个新的迭代器。迭代器则通常是一次性的，自己就是自己的 `__iter__` 返回值。

## 2. for 循环的展开与 iter/next

`for` 循环在幕后做的就是：先 `iter()` 拿迭代器，再反复 `next()`，直到捕获 `StopIteration` 为止。

```python
it = iter([1, 2, 3])
while True:
    try:
        value = next(it)
    except StopIteration:
        break
    print(value)  # 1 2 3
```

`next(it, default)` 可以在耗尽时返回默认值，避免异常；`iter(callable, sentinel)` 则不断调用 `callable`，直到返回值等于 `sentinel`。文件逐行读取常写成 `for line in file`，不需要手动处理 `StopIteration`。

```python
it = iter([1])
print(next(it))        # 1
print(next(it, '结束'))  # 结束
print(next(it, '结束'))  # 结束
```

> [!NOTE]
> `for` 循环会正常结束于 `StopIteration`，但如果你在生成器内部手动 `next()` 并把 `StopIteration` 漏出去，Python 3.7+ 会把它转换成 `RuntimeError`，见第 7 节。

## 3. 自定义可迭代与迭代器

自定义可迭代类实现 `__iter__`，每次返回一个新的迭代器；自定义迭代器类实现 `__next__` 和返回 `self` 的 `__iter__`。分开写能让同一个容器被反复遍历。

```python
class Countdown:
    def __init__(self, start):
        self.start = start

    def __iter__(self):
        return CountdownIterator(self.start)


class CountdownIterator:
    def __init__(self, current):
        self.current = current

    def __iter__(self):
        return self

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        value = self.current
        self.current -= 1
        return value

print(list(Countdown(3)))  # [3, 2, 1]
print(list(Countdown(3)))  # [3, 2, 1]，每次 __iter__ 都新建迭代器
```

如果不需要复用，`__iter__` 直接写成生成器函数更短：`def __iter__(self): ... yield ...`。生成器的细节见 [生成器](/pythonBasics/functions/generators)。

## 4. 一次性、序列协议与复用

迭代器是**一次性**的：耗尽后再 `next()` 只会继续抛 `StopIteration`，再 `list()` 得到空列表。

```python
it = iter([1, 2, 3])
print(list(it))  # [1, 2, 3]
print(list(it))  # []
```

列表可以反复遍历，是因为 `list.__iter__` 每次都返回一个新的 `list_iterator`，而不是列表自己记录了一个“读到哪”的位置。把迭代器误当成列表反复使用，是数据处理脚本里最常见的 bug 之一。

只实现 `__getitem__` 的对象也能被 `for` 遍历，这叫序列协议：`for` 会从下标 0 开始依次取值，直到 `IndexError`。

```python
class Deck:
    def __init__(self):
        self.cards = ['A', 'K', 'Q']

    def __getitem__(self, index):
        return self.cards[index]

for card in Deck():
    print(card)  # A K Q
```

`in` 也会走这套协议；但 `len()`、`reversed()` 需要 `__len__`，`reversed()` 还要求对象实现 `__reversed__` 或同时有 `__len__` 和 `__getitem__`。

## 5. 内置迭代工具

[width(18,18,13,51)]

| 函数        | 返回类型    | 是否惰性 | 说明                                    |
| :---------- | :---------- | :------- | :-------------------------------------- |
| `enumerate` | `enumerate` | 是       | 同时给出下标和元素，`start=` 可调起点。 |
| `zip`       | `zip`       | 是       | 并行取多个可迭代对象，默认截断到最短。  |
| `reversed`  | 反向迭代器  | 是       | 需要序列协议或 `__reversed__`。         |
| `sorted`    | `list`      | 否       | 立即排序，返回新列表。                  |
| `map`       | `map`       | 是       | 对每个元素应用函数。                    |
| `filter`    | `filter`    | 是       | 保留谓词为真的元素。                    |

```python
words = ['apple', 'banana']
for index, word in enumerate(words, start=1):
    print(index, word)  # 1 apple 换行 2 banana

names = ['a', 'b', 'c']
scores = [90, 80]
print(list(zip(names, scores)))  # [('a', 90), ('b', 80)]

print(list(reversed([1, 2, 3])))  # [3, 2, 1]
print(sorted(words, key=len))    # ['apple', 'banana']

print(list(map(len, words)))          # [5, 6]
print(list(filter(lambda w: len(w) > 5, words)))  # ['banana']
```

`zip` 默认按最短的截断，多余元素被静默丢弃；Python 3.10+ 可以用 `zip(..., strict=True)` 在长度不等时抛 `ValueError`，或者用 `itertools.zip_longest` 补齐。

```python
from itertools import zip_longest

print(list(zip_longest([1, 2, 3], 'ab', fillvalue='-')))
# [(1, 'a'), (2, 'b'), (3, '-')]
```

## 6. itertools 常用工具

[width(27,32,41)]

| 工具                  | 作用                       | 备注                                      |
| :-------------------- | :------------------------- | :---------------------------------------- |
| `count(start, step)`  | 无限递增序列。             | 必须配合 `islice` 或条件使用。            |
| `cycle(iterable)`     | 无限循环一个序列。         | 会缓存原序列，元素很多时注意内存。        |
| `repeat(obj, times)`  | 重复同一个对象。           | 省略 `times` 时无限重复。                 |
| `chain(*its)`         | 把多个可迭代对象串成一条。 | 惰性，不复制元素。                        |
| `islice(it, stop)`    | 对任意迭代器做切片。       | 不支持负下标。                            |
| `takewhile(pred, it)` | 一直取到谓词第一次为假。   | 之后的元素不再检查。                      |
| `dropwhile(pred, it)` | 跳过开头谓词为真的元素。   | 谓词第一次为假后全部保留。                |
| `groupby(it, key)`    | 按 key 分组。              | 必须先用同一个 key 排序，否则同组会拆开。 |
| `product(*its)`       | 笛卡尔积。                 | `repeat=` 控制自身重复次数。              |
| `permutations(it, r)` | 排列。                     | 顺序不同算不同结果。                      |
| `combinations(it, r)` | 组合。                     | 顺序不同算同一结果。                      |

```python
import itertools as it

print(list(it.islice(it.count(10, 2), 4)))  # [10, 12, 14, 16]
print(list(it.chain([1, 2], 'ab')))         # [1, 2, 'a', 'b']
print(list(it.takewhile(lambda x: x < 3, [1, 2, 3, 1])))  # [1, 2]
print(list(it.dropwhile(lambda x: x < 3, [1, 2, 3, 1])))  # [3, 1]

pairs = [('a', 1), ('a', 2), ('b', 3)]
for key, group in it.groupby(pairs, key=lambda p: p[0]):
    print(key, list(group))  # a [('a', 1), ('a', 2)] 换行 b [('b', 3)]

print(list(it.product('AB', repeat=2)))
# [('A', 'A'), ('A', 'B'), ('B', 'A'), ('B', 'B')]
print(list(it.combinations('ABC', 2)))
# [('A', 'B'), ('A', 'C'), ('B', 'C')]
```

> [!WARNING]
> `groupby` 只合并**相邻**的同 key 元素。输入没有按 key 排序时，同一个 key 会出现多个组；而且每个 `group` 迭代器在下一次外层循环推进后失效，需要保存时立刻转成 `list`。

## 7. 生成器表达式与常见陷阱

生成器表达式是创建迭代器最简的方式，写法像列表推导式，但用圆括号，返回的是生成器（生成器本身就是迭代器）。生成器函数则在函数体里用 `yield`，适合逻辑更复杂的场景。

```python
squares = (x * x for x in range(5))
print(next(squares))  # 0
print(list(squares))  # [1, 4, 9, 16]

def read_lines(path):
    with open(path, encoding='utf-8') as f:
        for line in f:
            yield line.rstrip('\n')
```

**把迭代器当列表反复使用。** 见第 4 节，第二次遍历为空。确实需要多轮遍历时，先 `list()` 物化，或者把“创建迭代器”封装成每次调用的函数。

**`zip` 长度不等时截断。** 默认行为是静默丢弃多余元素；需要严格校验时用 `strict=True`，需要补齐时用 `zip_longest`。

**遍历时修改容器。** 删除元素会让后面的元素前移，导致漏遍历：

```python
nums = [1, 2, 2, 3]
for x in nums:
    if x == 2:
        nums.remove(x)
print(nums)  # [1, 2, 3]
```

正确做法是遍历副本 `for x in nums[:]`，或者用推导式生成新列表，再整体替换。

**`StopIteration` 泄漏。** 在生成器内部手动调用 `next()`，要把 `StopIteration` 转换成 `return` 或捕获；直接让它冒出生成器，会被 PEP 479 转成 `RuntimeError`。

```python
def bad():
    it = iter([1])
    while True:
        yield next(it)  # 第二次 next 抛 StopIteration

try:
    print(list(bad()))
except RuntimeError as exc:
    print('RuntimeError:', exc)  # generator raised StopIteration
```

另外，迭代器没有 `len()`；需要计数时用 `sum(1 for _ in it)`，但这会消耗迭代器，之后不能再用。

## 8. 小结

[width(22,78)]

| 关键点      | 说明                                                             |
| :---------- | :--------------------------------------------------------------- |
| 可迭代对象  | 实现 `__iter__`，每次返回一个新的迭代器。                        |
| 迭代器      | 实现 `__next__`，耗尽时抛 `StopIteration`，通常一次性。          |
| `for` 展开  | `iter()` 拿迭代器，反复 `next()`，捕获 `StopIteration` 结束。    |
| 复用        | 列表可反复遍历；迭代器耗尽即空，需要多轮时先物化。               |
| 惰性工具    | `enumerate`、`zip`、`map`、`filter`、`reversed` 返回迭代器。     |
| `itertools` | `islice` 截断无限流，`chain` 串联，`groupby` 要求先按 key 排序。 |
| 常见陷阱    | 迭代器复用、`zip` 截断、遍历中修改容器、`StopIteration` 泄漏。   |

**一句话理解**：可迭代对象是“能发牌的人”，迭代器是“手里那副牌”；牌发完就没了，想再玩一局必须重新要一副。

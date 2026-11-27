---
outline: [2, 3]
---

# 推导式 (Comprehensions)

推导式是 Python 用一行表达式从可迭代对象生成容器的语法。它把“遍历、过滤、转换”压缩成一个表达式，写好了比 `for` 循环更短、更快，也更好读。

> [!TIP] 相关阅读
> 推导式最常生成 [列表](/pythonBasics/dataStructures/list)、[字典](/pythonBasics/dataStructures/dict) 和 [集合](/pythonBasics/dataStructures/set)；生成器表达式则是惰性版本，适合只消费一次的大数据流。需要理解循环变量作用域时，可对照 [元组](/pythonBasics/dataStructures/tuple) 页里的解包写法。

## 1. 统一语法与四种形式

所有推导式共享同一个骨架：`[表达式 for 变量 in 可迭代对象 if 条件]`。区别只在最外层的括号，以及表达式是单值还是键值对。

[width(18,41,41)]

| 形式         | 语法                               | 结果                           |
| :----------- | :--------------------------------- | :----------------------------- |
| 列表推导式   | `[expr for x in it if cond]`       | 列表，立即求值，有顺序         |
| 字典推导式   | `{key: value for x in it if cond}` | 字典，键唯一，重复键后者覆盖   |
| 集合推导式   | `{expr for x in it if cond}`       | 集合，自动去重，顺序不保证     |
| 生成器表达式 | `(expr for x in it if cond)`       | 生成器，惰性求值，只能消费一次 |

```python
nums = [1, 2, 3]

print([x * x for x in nums])       # [1, 4, 9]
print({x: x * x for x in nums})    # {1: 1, 2: 4, 3: 9}
print(sorted({x * x for x in nums}))  # [1, 4, 9]
gen = (x * x for x in nums)        # 还没开始算
print(list(gen))                   # [1, 4, 9]
```

`[x * x for x in nums]` 读作“对 `nums` 里的每个 `x`，算出 `x * x`，收集成列表”。先读 `for` 后面的来源，再读前面的表达式。

> [!NOTE]
> 生成器表达式作为函数的唯一参数时，可以省掉一层括号：`sum(x * x for x in nums)`。写成 `sum((x * x for x in nums))` 也对，只是多余。

## 2. 过滤与条件表达式

`if` 在推导式里有两个完全不同的位置：末尾的 `if` 决定“要不要这个元素”，表达式里的 `if/else` 决定“这个元素变成什么”。

**末尾的 if 是过滤**，条件为假的元素不会进入结果：

```python
nums = [-2, -1, 0, 1, 2, 3]

print([x for x in nums if x % 2 == 0])        # [-2, 0, 2]
print([x for x in nums if x > 0])             # [1, 2, 3]
print([x for x in nums if x > 0 if x % 2 == 0])  # [2]，多个 if 等价于逻辑与
```

**表达式里的 if/else 是转换**，每个输入都产出一个结果：

```python
print(['正' if x > 0 else '非正' for x in nums])  # ['非正', '非正', '非正', '正', '正', '正']
print([x if x > 0 else 0 for x in nums])         # [0, 0, 0, 1, 2, 3]
```

对比记忆：`[x for x in nums if x > 0]` 会改变结果长度；`[x if x > 0 else 0 for x in nums]` 长度不变。末尾的过滤 `if` 不能带 `else`，`[x for x in nums if x > 0 else 0]` 是语法错误。

### 2.1 嵌套循环的求值顺序

多个 `for` 子句按**从左到右**对应从外到内的循环：

```python
pairs = [(x, y) for x in range(2) for y in range(3)]
print(pairs)  # [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2)]

filtered = [(x, y) for x in range(3) for y in range(3) if x != y]
print(filtered)  # [(0, 1), (0, 2), (1, 0), (1, 2), (2, 0), (2, 1)]
```

它等价于 `for x ...: for y ...: append(...)`。`if` 放在某个 `for` 后面，就只作用于该层及更内层。循环目标也可以直接解包：

```python
points = [(1, 2), (3, 4)]
print([x + y for x, y in points])  # [3, 7]
```

## 3. 字典与集合推导式

字典推导式的表达式部分必须写成 `键: 值`，重复键由后出现的条目覆盖：

```python
nums = [1, 2, 3, 4]

squares = {x: x * x for x in nums}
print(squares)  # {1: 1, 2: 4, 3: 9, 4: 16}
print({k: v for k, v in squares.items() if v >= 9})  # {3: 9, 4: 16}

prices = {'apple': 3, 'banana': 2}
print({v: k for k, v in prices.items()})  # {3: 'apple', 2: 'banana'}，反转

print({x % 3: x for x in range(6)})  # {0: 3, 1: 4, 2: 5}，重复键后者胜出
```

集合推导式就是没有键的字典推导式，天然去重：

```python
print(sorted({x * x for x in [1, 2, 2, 3]}))  # [1, 4, 9]
print(sorted({w.lower() for w in ['Python', 'python', 'Go']}))  # ['go', 'python']
```

集合去重不保留顺序。需要“去重但保留第一次出现的顺序”时，用 `dict.fromkeys()`：

```python
print(list(dict.fromkeys(['b', 'a', 'b', 'c'])))  # ['b', 'a', 'c']
```

空集合只能写 `set()`；`{}` 是空字典，所以也没有“空集合推导式”。

## 4. 生成器表达式

把方括号换成圆括号，得到的就是生成器表达式。它不会立刻计算，而是每次被迭代时才算一个元素。

```python
gen = (x * x for x in range(5))

print(next(gen))   # 0
print(list(gen))   # [1, 4, 9, 16]，剩下的元素
print(list(gen))   # []，已经消费完了
```

生成器不把结果存进内存，适合大数据或流式处理：`sum(x * x for x in range(1_000_000))` 不会创建一百万个整数的列表。代价是它**只能消费一次**，没有 `len()`，不能下标访问，也不能重新开始；需要反复使用就先 `list(gen)`。

生成器只有“元素计算”是惰性的，最外层的可迭代对象在创建时就会求值：

```python
def source():
    print('source 被调用')
    return range(3)


gen = (x for x in source())  # 这里立刻打印“source 被调用”
print('创建完成')
```

[width(41,18,41)]

| 场景                                   | 推荐         | 原因                               |
| :------------------------------------- | :----------- | :--------------------------------- |
| 结果要多次遍历、取长度、按下标访问     | 列表推导式   | 生成器不能重复消费，也没有这些操作 |
| 数据量大，只需要 `sum` / `any` / `max` | 生成器表达式 | 不占整份结果的内存                 |
| 结果传给 `join`、`sorted` 等聚合函数   | 生成器表达式 | 这些函数只遍历一次，惰性足够       |

`any` 和 `all` 还会短路，搭配生成器可以在第一个满足/不满足的元素处停下：`any(x % 2 == 0 for x in nums)`。

## 5. 嵌套推导式与典型模式

**展平二维列表**：第一个 `for` 是外层循环，顺序不能写反。

```python
matrix = [[1, 2, 3], [4, 5, 6]]

print([x for row in matrix for x in row])  # [1, 2, 3, 4, 5, 6]
# [x for x in row for row in matrix] 会 NameError：row 尚未定义
```

**矩阵转置与生成**：

```python
transposed = [[row[i] for row in matrix] for i in range(len(matrix[0]))]
print(transposed)  # [[1, 4], [2, 5], [3, 6]]
print(list(zip(*matrix)))  # [(1, 4), (2, 5), (3, 6)]，更简洁

table = [[i * j for j in range(1, 4)] for i in range(1, 4)]
print(table)  # [[1, 2, 3], [2, 4, 6], [3, 6, 9]]，每行都是新列表
```

**过滤 + 转换**：条件写在末尾，转换写在前面的表达式。

```python
names = ['  Amy ', 'Bob', '', 'Cara']
print([name.strip().title() for name in names if name.strip()])  # ['Amy', 'Bob', 'Cara']
```

**建查找表**：把列表转成以某个字段为键的字典，重复键由后者覆盖。

```python
users = [{'id': 1, 'name': 'Amy', 'dept': 'dev'}, {'id': 2, 'name': 'Bob', 'dept': 'ops'}]
by_id = {user['id']: user for user in users}
print(by_id[2]['name'])  # Bob
```

**条件计数与查找**：布尔值是 `int` 的子类，可以直接求和。

```python
nums = [-2, -1, 0, 1, 2, 3]
print(sum(1 for x in nums if x > 0))  # 4
print(sum(x > 0 for x in nums))       # 4，True 当 1

first_big = next((x for x in nums if x > 1), None)
print(first_big)  # 2，找不到时返回 None
```

**分组**：分组键事先已知时可以一行搞定，但每个组都要扫一遍全表：

```python
grouped = {dept: [u['name'] for u in users if u['dept'] == dept] for dept in {'dev', 'ops'}}
```

数据量大时这是 $O(n \times k)$；真正的分组用一次遍历的 `defaultdict(list)` 更合适。推导式的优势是表达力，不是所有聚合都该硬塞进去。

## 6. 性能与可读性

列表推导式在字节码层面使用专门的 `LIST_APPEND`，循环由解释器直接驱动，不用每轮查找 `append` 方法，常见情况下比显式 `for + append` 快一些：

```python
squares = [x * x for x in range(1000)]  # 通常更快

squares = []
for x in range(1000):
    squares.append(x * x)
```

计算本身很重时，这点差距会被摊薄。生成器表达式的单元素开销通常更高，但省内存；如果最后还是要 `list(...)`，直接用列表推导式往往更划算。

出现下面情况时，`for` 循环更好：

- 需要 `break`、`continue` 或提前退出（推导式没有 `break`）。
- 每个元素要 `try/except` 做错误处理。
- 循环体有多个步骤或副作用，比如 `[print(x) for x in range(3)]` 既建了无用列表，又违背表达式无副作用的直觉。
- 嵌套超过两层 `for`，或者条件长到需要换行。

## 7. 作用域、海象运算符与陷阱

### 7.1 独立作用域，不泄漏循环变量

Python 3 的推导式有自己的函数作用域，循环变量不会泄漏到外层：

```python
x = 'outer'
result = [x for x in range(3)]
print(result, x)  # [0, 1, 2] outer
```

外层没有同名变量时，循环结束后也访问不到它：

```python
def build():
    result = [i for i in range(3)]
    return i  # NameError: name 'i' is not defined
```

这和 Python 2 不同：Python 2 的列表推导式会泄漏循环变量。

### 7.2 海象运算符 `:=`

赋值表达式可以在推导式里边算边存，绑定到**外层作用域**：

```python
results = [(y := x * 2) for x in range(3)]
print(results, y)  # [0, 2, 4] 4

values = [1, 2, 3, 4]
filtered = [y for x in values if (y := x * 2) > 4]
print(filtered)  # [6, 8]，条件里算一次，结果里直接用
```

限制也要记住：不能把海象运算符的目标设成循环变量（`[z := z + 1 for z in range(3)]` 是 `SyntaxError`），也不能用在外层可迭代对象里（`[i for i in (q := range(3))]` 同样报错）。它可读性争议大，除非确实消除了重复计算，否则优先用普通写法。

### 7.3 闭包延迟绑定

推导式里的 `lambda` 共享同一个循环变量，调用时看到的是循环结束后的最终值：

```python
funcs = [lambda: x for x in range(3)]
print([f() for f in funcs])  # [2, 2, 2]，不是 [0, 1, 2]

funcs = [lambda x=x: x for x in range(3)]
print([f() for f in funcs])  # [0, 1, 2]
```

原因和普通 `for` 循环里的闭包一样：`lambda` 捕获的是变量 `x` 这个单元格，不是它当时的值。

### 7.4 其他高频陷阱

- **把生成器当列表反复用**：消费完就空了，第二次遍历得到空结果；需要复用先 `list(gen)`。
- **嵌套顺序写反**：展平二维列表时外层 `for` 必须写在前面，否则 `NameError` 或结果错误。
- **过滤与三目混淆**：末尾 `if` 是过滤，不能带 `else`；`if/else` 要放在最前面的表达式位置。
- **副作用与过度嵌套**：用推导式调用 `print`、`append` 或修改外部状态，既浪费结果列表，也难调试；三层以上循环加条件时，拆成普通循环更划算。

## 8. 小结

[width(24,76)]

| 关键点    | 说明                                                              |
| :-------- | :---------------------------------------------------------------- |
| 统一语法  | `[expr for x in it if cond]`，换括号得到字典、集合、生成器版本。  |
| 两种 if   | 末尾 `if` 是过滤；表达式里的 `if/else` 是逐元素转换，位置不能混。 |
| 嵌套循环  | `for` 从左到右对应从外到内；展平时外层循环必须写在前面。          |
| 字典/集合 | 字典要求 `键: 值`，重复键后者覆盖；集合自动去重但顺序不保证。     |
| 生成器    | 惰性、省内存、只能消费一次；外层来源立即求值，元素计算才延迟。    |
| 性能      | 列表推导式通常快于 `for + append`；生成器省内存但单元素开销更高。 |
| 作用域    | Python 3 不泄漏循环变量；海象运算符绑定到外层，但有使用限制。     |
| 常见陷阱  | 副作用、过度嵌套、生成器复用、闭包延迟绑定、过滤与三目混用。      |

**一句话理解**：推导式是“遍历 + 过滤 + 转换”的一行写法；数据小、要复用就用列表推导式，数据大、只消费一次就用生成器表达式，逻辑一复杂就退回普通循环。

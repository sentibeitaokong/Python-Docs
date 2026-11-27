---
outline: [2, 3]
---

# 运算符与流程控制 (Operators and Control Flow)

运算符决定“怎么算”，流程控制决定“按什么顺序算”。Python 的运算符有几个反直觉之处：`//` 对负数向下取整、`and`/`or` 返回的是操作数而不是布尔值、`**` 是右结合；这一页把这些规则和 `if`、`match`、循环的写法一起讲清。

> [!TIP] 相关阅读
> 运算符操作的对象类型见 [数据类型](/pythonBasics/basic/dataTypes)；字符串的比较与方法见 [字符串](/pythonBasics/basic/strings)；把循环逻辑收进函数见 [函数基础](/pythonBasics/functions/functionBasics)；条件分支里的异常处理见 [异常处理](/pythonBasics/basic/exceptions)。

## 1. 算术运算符

[width(16,34,50)]

| 运算符 | 含义   | 示例与结果                          |
| :----- | :----- | :---------------------------------- |
| `+`    | 加     | `2 + 3` → `5`                       |
| `-`    | 减     | `5 - 2` → `3`                       |
| `*`    | 乘     | `3 * 4` → `12`                      |
| `/`    | 真除法 | `7 / 2` → `3.5`，**永远返回 float** |
| `//`   | 地板除 | `7 // 2` → `3`，对负数向下取整      |
| `%`    | 取余   | `7 % 2` → `1`，符号跟随除数         |
| `**`   | 幂     | `2 ** 10` → `1024`，右结合          |

```python
print(4 / 2)    # 2.0，即使整除也是 float
print(7 // 2)   # 3
print(-7 // 2)  # -4，向下取整到 -4，不是 -3
print(7 // -2)  # -4
print(-7 % 2)   # 1，余数符号跟随除数
print(7 % -2)   # -1
```

`//` 和 `%` 满足恒等式 `a == (a // b) * b + a % b`。对负数，牢记“向下取整”而不是“截断”，这是和 C、Java 最大的差异。除数为零时，整数和浮点都会抛 `ZeroDivisionError`，Python 不会返回 `inf` 或 `nan`。

`**` 是右结合：`2 ** 3 ** 2` 等于 `2 ** (3 ** 2) = 512`，不是 `(2 ** 3) ** 2 = 64`。另外一元负号优先级低于 `**`，所以 `-2 ** 2` 是 `-(2 ** 2) = -4`。

## 2. 比较、逻辑、位、成员与身份

### 2.1 比较与链式比较

比较运算符返回 `bool`。Python 支持数学式链式比较，且中间操作数只求值一次：

```python
x = 5
print(0 < x < 10)        # True
print(1 < x == 5 <= 9)   # True，等价于 1 < x and x == 5 and 5 <= 9
print(1 == 1.0)          # True，数值按值比较
print([1, 2] < [1, 3])   # True，列表按字典序比较
```

链式比较不要和 `0 < x > 3` 混淆，后者只要求 `x` 同时大于两边，并不表示区间。

### 2.2 and / or / not

`and` 和 `or` 会**短路**，并返回决定结果的那个操作数，而不是强制转成 `bool`：

```python
print(0 or '默认值')   # 默认值
print('a' and 'b')     # b
print([] and 1)        # []，左边为假直接返回
print(not [])          # True，not 一定返回 bool

name = ''
display = name or '匿名'  # 常用兜底写法
print(display)            # 匿名
```

短路意味着右边的表达式可能根本不执行，可以安全地写 `if user and user.is_active:`。但要小心 `x = x or 10`：当 `x` 是合法的 `0` 或 `''` 时也会被替换掉。

> [!WARNING]
> `and`/`or` 返回操作数，不是布尔值。需要严格布尔时用 `bool(x and y)`；需要“有值就用、没值兜底”时，返回操作数反而正好。

### 2.3 位运算、成员与身份

```python
print(0b1010 & 0b0110)  # 2，按位与
print(0b1010 | 0b0110)  # 14，按位或
print(0b1010 ^ 0b0110)  # 12，按位异或
print(1 << 4, 16 >> 2)  # 16 4

print(3 in [1, 2, 3])   # True，列表是 O(n)
print('k' in {'k': 1})  # True，字典查的是键
print([] is not None)   # True，非 None
```

位运算不做短路，`f() & g()` 两边都会执行；需要短路时用 `and`。`in` 对 `list`/`tuple` 是线性扫描，对 `set`/`dict` 平均 $O(1)$。`is` 判断身份，只该用于 `None`、`True`、`False` 和确实需要比较对象同一性的场合。

## 3. 运算符优先级

从高到低记住常用的一层即可，拿不准就加括号：

[width(11,49,40)]

| 优先级 | 运算符                                       | 说明                             |
| :----- | :------------------------------------------- | :------------------------------- |
| 高     | `**`                                         | 右结合。                         |
|        | `+x`、`-x`、`~x`                             | 一元运算。                       |
|        | `*`、`/`、`//`、`%`                          | 乘除类。                         |
|        | `+`、`-`                                     | 加减类。                         |
|        | `&`                                          | 按位与（另含 `^`、`\|`、移位）。 |
|        | `<`、`<=`、`>`、`>=`、`==`、`!=`、`in`、`is` | 比较，可链式。                   |
|        | `not x`                                      | 逻辑非。                         |
|        | `and`                                        | 逻辑与。                         |
| 低     | `or`                                         | 逻辑或；之后是条件表达式。       |

两个易错点：位运算优先级高于比较，所以 `a & b == 0` 是 `(a & b) == 0`；`not` 低于比较，所以 `not a == b` 是 `not (a == b)`。混合 `and`、`or`、位运算时，直接写括号最省心。

## 4. 条件语句与 match

### 4.1 if / elif / else

```python
def grade(score):
    if score >= 90:
        return 'A'
    elif score >= 60:
        return 'B'
    else:
        return 'C'


print(grade(75))  # B
```

条件按真值测试判断，空容器、`0`、`None` 都为假。不要把“值存在”和“值非零”混为一谈：允许 `0` 的字段要用 `is not None`。

条件表达式适合简单的二选一，嵌套超过一层就该改回 `if`：

```python
age = 20
label = '成年' if age >= 18 else '未成年'
print(label)  # 成年
```

### 4.2 match / case（3.10+）

`match` 做的是**结构模式匹配**，不是简单的值比较。它从上到下尝试，命中一个分支就结束，不需要 `break`。

```python
from dataclasses import dataclass


@dataclass
class Point:
    x: int
    y: int


def describe(command):
    match command:
        case 'quit':
            return '退出'
        case ['go', direction]:
            return f'向 {direction} 走'
        case {'type': 'move', 'dx': dx, 'dy': dy} if dx or dy:
            return f'移动 ({dx}, {dy})'
        case Point(x=0, y=0):
            return '原点'
        case _:
            return '未知命令'


print(describe(['go', 'north']))            # 向 north 走
print(describe({'type': 'move', 'dx': 1, 'dy': 0}))  # 移动 (1, 0)
print(describe(Point(0, 0)))                # 原点
```

几条规则：

- `case _:` 是通配，必须放最后；裸名字 `case x:` 会捕获任何值，容易误写成“万能分支”。
- 序列模式 `[a, b]` 要求长度一致，`[first, *rest]` 可以捕获剩余部分；映射模式只要求包含指定键，允许额外键。
- 守卫 `if 条件` 在模式匹配成功后再判断，失败会继续尝试后面的分支。
- 常量要用字面量或带点的名字（如 `Color.RED`），裸名字会被当成捕获变量。

`match` 适合处理“形状不同”的数据（命令、AST、协议消息）；普通区间判断用 `if` 更直接。

## 5. 循环与迭代工具

### 5.1 while 与 for

`while` 在条件为真时重复，适合“不知道要循环多少次”的场景；`for` 遍历任何可迭代对象，是 Python 的首选。

```python
count = 0
while count < 3:
    print(count)
    count += 1

for ch in 'abc':
    print(ch)

for key, value in {'a': 1, 'b': 2}.items():
    print(key, value)
```

### 5.2 range / enumerate / zip

```python
print(list(range(5)))          # [0, 1, 2, 3, 4]
print(list(range(1, 10, 2)))   # [1, 3, 5, 7, 9]
print(list(range(5, 0, -1)))   # [5, 4, 3, 2, 1]

names = ['Ada', 'Bob']
for i, name in enumerate(names, start=1):
    if not name:
        continue  # 跳过空名字
    print(i, name)  # 1 Ada / 2 Bob

for name, score in zip(names, [95, 88]):
    print(name, score)
```

`range` 是惰性序列，不会真的创建列表；`enumerate` 比 `for i in range(len(seq))` 更清晰；`zip` 默认以最短为准，需要严格对齐时加 `strict=True`。

## 6. 循环控制与 else 子句

`break` 跳出**最近一层**循环，`continue` 跳过本轮剩余语句。嵌套循环里 `break` 只影响内层，需要跳出多层时用函数返回或标志变量。

```python
for n in range(2, 10):
    for factor in range(2, n):
        if n % factor == 0:
            break  # 只跳出内层
    else:
        print(f'{n} 是质数')
```

`for`/`while` 可以带 `else`：**没有执行过 `break`** 时运行，正常结束和零次迭代都算。它常用来表达“找遍了都没找到”：

```python
target = 7
for x in [1, 3, 5]:
    if x == target:
        print('找到了')
        break
else:
    print('没找到')  # 会执行
```

注意 `else` 不是“循环体没执行才运行”，而是“没有被 `break` 打断”。`while True` 配 `break` 时，`else` 基本不会触发。

## 7. 常见陷阱

### 7.1 浮点数直接用 == 比较

```python
import math

print(0.1 + 0.2 == 0.3)              # False
print(math.isclose(0.1 + 0.2, 0.3))  # True
```

涉及计算结果的比较，用 `math.isclose()` 或 `round()` 后再比。

### 7.2 循环变量会留在作用域

Python 3 的 `for`/`while` 不会创建独立作用域，循环变量在循环结束后仍然存在：

```python
for i in range(3):
    pass
print(i)  # 2
```

循环变量的“最后一次值”经常被误用；空循环后访问则会 `NameError`，因为 `item` 从未绑定。不要让循环变量在循环外承担额外语义。

### 7.3 在 while 条件里赋值

普通赋值是语句，不能直接放进条件：

```python
# while line = f.readline():  # SyntaxError
#     ...

# 正确：用海象运算符
with open('data.txt', encoding='utf-8') as f:
    while line := f.readline():
        print(line.rstrip())
```

海象在 `while` 里很自然，但别为了少写一行把复杂逻辑塞进条件，可读性会下降。

## 8. 小结

[width(22,78)]

| 关键点    | 说明                                                           |
| :-------- | :------------------------------------------------------------- |
| 除法      | `/` 永远返回 `float`；`//` 向下取整，负数结果比截断更小。      |
| 取余      | `%` 的符号跟随除数；负数地板除比截断更小。                     |
| 幂        | `**` 右结合，`-2 ** 2` 是 `-4`。                               |
| 逻辑      | `and`/`or` 短路并返回操作数；`not` 返回 `bool`。               |
| 比较      | 支持链式比较；浮点比较用 `math.isclose()`。                    |
| match     | 3.10+ 的结构模式匹配，支持守卫、序列/映射/类模式，命中即结束。 |
| 循环      | 优先 `for`；`range`/`enumerate`/`zip` 覆盖大多数下标需求。     |
| 循环 else | 没有 `break` 才执行，适合“找遍都没有”的语义。                  |

**一句话理解**：算术上牢记 `//` 向下取整和 `%` 跟随除数；逻辑上记住 `and`/`or` 返回操作数；流程上优先 `for` 和提前 `return`，`match` 只用来处理不同形状的数据。

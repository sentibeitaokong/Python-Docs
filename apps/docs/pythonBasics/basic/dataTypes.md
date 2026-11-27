---
outline: [2, 3]
---

# 数据类型 (Data Types)

Python 的每个值都是对象，都有自己的类型；类型决定了它能做什么、能不能被修改、能不能当字典键。这一页按“数值、文本、容器”三条线梳理内置类型，并讲清真值、类型转换和 `None` 这几个天天要用却容易含糊的概念。

> [!TIP] 相关阅读
> 变量如何绑定对象见 [语法与变量](/pythonBasics/basic/syntaxAndVariables)；字符串的细节见 [字符串](/pythonBasics/basic/strings)；容器用法见 [列表](/pythonBasics/dataStructures/list) 和 [字典](/pythonBasics/dataStructures/dict)。

## 1. 内置类型全景

[width(16,13,23,9,39)]

| 类型        | 类别     | 示例                | 可变 | 说明                                   |
| :---------- | :------- | :------------------ | :--- | :------------------------------------- |
| `NoneType`  | 单例     | `None`              | 否   | 表示“没有值”，全程序只有一个实例。     |
| `bool`      | 数值     | `True`、`False`     | 否   | `int` 的子类，`True == 1`。            |
| `int`       | 数值     | `42`、`-7`          | 否   | 任意精度整数，不会溢出。               |
| `float`     | 数值     | `3.14`、`1e-3`      | 否   | IEEE 754 双精度浮点，有精度误差。      |
| `complex`   | 数值     | `3+4j`              | 否   | 复数，工程计算之外的场景很少用。       |
| `str`       | 文本     | `'你好'`            | 否   | Unicode 字符序列。                     |
| `bytes`     | 二进制   | `b'\xe4\xbd\xa0'`   | 否   | 0–255 的字节序列。                     |
| `bytearray` | 二进制   | `bytearray(b'ab')`  | 是   | 可原地修改的字节序列。                 |
| `list`      | 序列容器 | `[1, 'a']`          | 是   | 有序、可重复、按下标访问。             |
| `tuple`     | 序列容器 | `(1, 2)`            | 否   | 有序、可重复，元素可哈希时自身可哈希。 |
| `dict`      | 映射容器 | `{'a': 1}`          | 是   | 键值映射，键必须可哈希。               |
| `set`       | 集合容器 | `{1, 2}`            | 是   | 无序、去重，元素必须可哈希。           |
| `frozenset` | 集合容器 | `frozenset({1, 2})` | 否   | 不可变集合，可哈希，能当字典键。       |

用 `type()` 可以查看任意对象的类型；`isinstance()` 还能识别继承关系，后面细说。

## 2. 数值类型

### 2.1 整数与布尔

`int` 是任意精度的：内存允许就能一直算，不存在 C 语言那种 32/64 位溢出。

```python
big = 2 ** 200
print(big)  # 1606938044258990275541962092341162602522202993782792835301376
print(10 ** 1000 % 97)  # 大整数取模也正常

# bool 是 int 的子类，可以参与算术
print(True + True)  # 2
print(isinstance(True, int))  # True
```

### 2.2 浮点数与精度

`float` 是 IEEE 754 双精度（64 位），有效数字约 15–17 位。十进制小数多数无法用二进制精确表示，于是出现“看起来算错”的结果。

```python
print(0.1 + 0.2)          # 0.30000000000000004
print(0.1 + 0.2 == 0.3)  # False

import math

print(math.isclose(0.1 + 0.2, 0.3))  # True，推荐用容差比较
print(round(2.675, 2))  # 2.67，底层表示并非 2.675
```

比较浮点数用 `math.isclose()`（或 `pytest.approx`），不要写 `==`。需要十进制精确计算时用 `Decimal`；需要精确分数时用 `Fraction`。

```python
from decimal import Decimal
from fractions import Fraction

print(Decimal('0.1') + Decimal('0.2') == Decimal('0.3'))  # True
print(Fraction(1, 3) + Fraction(1, 6))  # 1/2

# Decimal 默认 28 位有效数字，可按需调整
print(Decimal(1) / Decimal(3))  # 0.3333333333333333333333333333
```

浮点还有两个特殊值：`float('inf')` 和 `float('nan')`。`nan` 不等于任何值，包括它自己，判断要用 `math.isnan()`。

```python
inf = float('inf')
nan = float('nan')
print(inf > 10 ** 100)  # True
print(nan == nan)       # False
print(math.isnan(nan))  # True
```

### 2.3 字面量与进制

```python
print(0b1010, 0o17, 0xFF)  # 10 15 255
print(1_000_000)           # 1000000，下划线只为可读
print(1.5e-3)              # 0.0015
print(1_000.5)             # 1000.5，整数和小数部分都能加下划线

# print(010)  # SyntaxError：Python 3 不允许前导零表示八进制
```

`/` 永远返回 `float`，即使能整除；要整数除法用 `//`。大整数转浮点可能丢精度，超出范围则抛 `OverflowError`。

## 3. 文本与字节

`str` 是 Unicode 码点序列，`bytes` 是 0–255 的原始字节序列。两者不能直接拼接，必须显式编码或解码。

```python
text = '你好'
raw = text.encode('utf-8')   # b'\xe4\xbd\xa0\xe5\xa5\xbd'
print(len(text), len(raw))   # 2 6，一个汉字 3 字节
print(raw.decode('utf-8'))   # 你好

# 用错编码会抛 UnicodeDecodeError
try:
    raw.decode('ascii')
except UnicodeDecodeError as e:
    print(type(e).__name__)  # UnicodeDecodeError

print(raw.decode('ascii', errors='replace'))  # 乱码替换，不抛异常
```

`bytes` 字面量只能写 ASCII，非 ASCII 字符必须用转义或 `encode()`。`bytearray` 与 `bytes` 类似，但支持原地修改，适合处理二进制缓冲区。文件读写时，文本模式返回 `str`，二进制模式（`'rb'`）返回 `bytes`，选错模式是最常见的编码问题来源。

## 4. 可变、不可变与可哈希

可变对象能原地修改，所有指向它的名字都会看到变化；不可变对象一旦创建就不能改，所谓“修改”都是新建对象。

[width(11,89)]

| 分类   | 类型                                                                            |
| :----- | :------------------------------------------------------------------------------ |
| 不可变 | `None`、`bool`、`int`、`float`、`complex`、`str`、`bytes`、`tuple`、`frozenset` |
| 可变   | `list`、`dict`、`set`、`bytearray`、大多数自定义类实例                          |

**可哈希**意味着对象有一个在生命周期内不变的哈希值，并且相等对象哈希值相同。不可变类型通常可哈希；`tuple` 只有在所有元素都可哈希时才可哈希。

```python
print(hash((1, 2)))       # 正常
print(hash(frozenset({1, 2})))  # 正常

try:
    hash((1, [2]))
except TypeError as e:
    print(e)  # unhashable type: 'list'
```

`list` 不能当 `dict` 的键或 `set` 的元素，因为它的内容会变，哈希值随之改变，字典就找不到原来的位置了。需要把一组值当键时，转成 `tuple`；需要可变集合当键时，用 `frozenset`。

```python
# 错误：TypeError: unhashable type: 'list'
# d = {[1, 2]: 'value'}

d = {(1, 2): 'value'}  # 正确：元组不可变且元素可哈希
print(d[(1, 2)])       # value
```

> [!NOTE]
> 自定义类默认按对象身份哈希，可以直接当键。一旦你定义了 `__eq__` 却没定义 `__hash__`，Python 会把该类设为不可哈希。需要两者兼得时，两个方法一起实现。

## 5. 真值测试与类型判断

`if`、`while`、`and`、`or`、`not` 都会把值转成布尔。**假值**只有下面这些，其余一律为真，包括 `'False'`、`[0]`、`-1` 和 `float('nan')`。

[width(51,49)]

| 假值                                          | 说明                     |
| :-------------------------------------------- | :----------------------- |
| `None`、`False`                               | 单例与布尔假。           |
| `0`、`0.0`、`0j`、`Decimal(0)`、`Fraction(0)` | 各种数值零。             |
| `''`、`b''`、`[]`、`()`、`{}`、`set()`        | 空序列、空映射、空集合。 |
| `range(0)`                                    | 空范围。                 |

```python
print(bool(''), bool('0'), bool([]), bool([0]))  # False True False True
print(bool(float('nan')))  # True

value = 0
if value:  # 0 是假值，这里不会进入
    print('有值')

if value is not None:  # 0 是合法值时，用 is not None 判断“有没有给”
    print('不是 None')
```

自定义对象可以实现 `__bool__`（返回布尔）或 `__len__`（返回 0 即假）来控制真值，`numpy` 数组就是典型例子：对多元素数组做 `if arr:` 会直接抛 `ValueError`，必须用 `.any()` 或 `.all()`。

类型判断的取舍：

[width(36,26,38)]

| 写法                          | 含义                  | 建议                           |
| :---------------------------- | :-------------------- | :----------------------------- |
| `type(x) is int`              | 类型**恰好**是 `int`  | 少数需要排除子类的场景。       |
| `isinstance(x, int)`          | 是 `int` 或其子类实例 | 默认选它，兼容继承与鸭子类型。 |
| `isinstance(x, (int, float))` | 命中元组中任一类型    | 接受多种输入时使用。           |

```python
print(type(True) is int)        # False，bool 是子类但不是 int 本身
print(isinstance(True, int))    # True
print(isinstance(3, (int, float)))  # True
```

## 6. 类型转换

内置类型同时也是转换函数。转换失败通常抛 `ValueError`（内容不合法）或 `TypeError`（类型根本不支持）。

```python
print(int('42'))        # 42
print(int('0x1f', 16))  # 31，指定进制
print(int(3.9), int(-3.9))  # 3 -3，向零截断
print(float('3.14'))    # 3.14
print(float('inf'))     # inf
print(str(3.0))         # '3.0'
print(bool('False'))    # True，非空字符串都是真
```

容器之间也能转换：

```python
print(list('abc'))          # ['a', 'b', 'c']
print(tuple([1, 2]))        # (1, 2)
print(set('hello'))         # {'h', 'e', 'l', 'o'}，去重且无序
print(dict([('a', 1), ('b', 2)]))  # {'a': 1, 'b': 2}
```

常见失败情况：

```python
int('3.9')    # ValueError: invalid literal for int() with base 10: '3.9'
int(None)     # TypeError: int() argument must be a string...
float(10 ** 400)  # OverflowError: int too large to convert to float
```

要解析小数形式的字符串，先 `float('3.9')` 再按需 `int()`；要处理用户输入，始终假定它可能不合法，捕获 `ValueError` 而不是让程序崩掉。

## 7. `None` 的语义

`None` 是 `NoneType` 的唯一实例，表示“没有值”。它不等于 `0`、`''`、`False`，也不等于任何其他假值。

```python
print(type(None))       # <class 'NoneType'>
print(None == 0)        # False
print(None == False)    # False
print(bool(None))       # False
```

判断 `None` 永远用 `is` / `is not`：

```python
value = None
print(value is None)    # 推荐
print(value == None)    # 能跑，但可能被自定义 __eq__ 干扰
```

典型用法是**默认值 + 哨兵**：函数默认参数写 `None`，函数体内再换成真正的默认值，避免可变默认参数被共享；如果 `None` 本身是合法输入，就用一个独立对象当哨兵。

```python
def connect(host, timeout=None):
    if timeout is None:
        timeout = 30.0
    return host, timeout


_MISSING = object()


def set_value(value=_MISSING):
    if value is _MISSING:
        print('没传参数')
    else:
        print(f'收到 {value!r}')
```

类型注解里用 `int | None`（3.10+）或 `Optional[int]` 表示“可能是 `None`”。函数没有 `return` 时也隐式返回 `None`，所以“查不到”经常用 `None` 表达，调用方必须显式检查。

## 8. 小结

[width(22,78)]

| 关键点     | 说明                                                                                          |
| :--------- | :-------------------------------------------------------------------------------------------- |
| 类型全景   | 数值（`int`/`float`/`complex`）、文本（`str`/`bytes`）、容器（`list`/`tuple`/`dict`/`set`）。 |
| 数值精度   | `int` 任意精度；`float` 是 IEEE 754，比较用 `math.isclose`，精确计算用 `Decimal`/`Fraction`。 |
| 文本与字节 | `str` 是 Unicode，`bytes` 是原始字节；跨边界必须 `encode()`/`decode()`。                      |
| 可变与哈希 | 可变对象不能当字典键；`tuple`/`frozenset` 在元素可哈希时可哈希。                              |
| 真值       | 只有 `None`、`False`、数值零、空容器为假；`0` 合法时用 `is not None`。                        |
| 类型判断   | 优先 `isinstance()`，需要精确类型时才用 `type() is`。                                         |
| `None`     | 表示“没有值”，判断用 `is None`，可作默认值与哨兵。                                            |

**一句话理解**：类型决定了一个值能不能改、能不能哈希、在 `if` 里算真还是假；数值精度和 `str`/`bytes` 边界是 Python 新手最容易踩的两条线。

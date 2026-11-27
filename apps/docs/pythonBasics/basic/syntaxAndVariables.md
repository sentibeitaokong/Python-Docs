---
outline: [2, 3]
---

# 语法与变量 (Syntax and Variables)

Python 用缩进划分代码块，用名字绑定对象而不是把值装进盒子；它解释执行、动态类型，但类型检查很严格。这一页把词法、赋值和各种“看起来一样其实不一样”的写法一次讲清。

> [!TIP] 相关阅读
> 变量的值有不同类型，见 [数据类型](/pythonBasics/basic/dataTypes)；赋值之后要用运算符和分支循环，见 [运算符与流程控制](/pythonBasics/basic/operatorsAndControlFlow)；字符串格式化见 [字符串](/pythonBasics/basic/strings)；代码拆成多个文件后见 [模块与包](/pythonBasics/basic/modulesAndPackages)。

## 1. Python 的执行模型

CPython 先把 `.py` 源码编译成字节码，再由虚拟机逐条解释执行；结果缓存到 `__pycache__/*.pyc`，源码没变时直接复用。这与 C、Java“先编译成机器码再交付”不同：Python 改一行立刻生效，没有独立的编译产物流程。

[width(22,78)]

| 特性             | 含义                                                                   |
| :--------------- | :--------------------------------------------------------------------- |
| **解释执行**     | 源码转字节码后由解释器执行；启动快、跨平台，纯计算速度不如编译型语言。 |
| **动态类型**     | 变量本身没有类型，类型属于运行时的对象；同一个名字可先后绑定不同类型。 |
| **强类型**       | 不做隐式转换，`'1' + 1` 直接抛 `TypeError`，不会悄悄拼成 `'11'`。      |
| **自动内存管理** | 引用计数加垃圾回收，不需要手动释放；名字只是对象的引用之一。           |

```python
value = 42
print(type(value))  # <class 'int'>
value = 'hello'    # 同一个名字换成 str，合法

print('1' + 1)  # TypeError: can only concatenate str (not "int") to str
```

> [!NOTE]
> “动态类型”和“弱类型”不是一回事。Python 是动态类型 + 强类型；JavaScript 是动态类型 + 弱类型，所以 `'1' + 1` 会得到 `'11'`。

## 2. 缩进、注释与命名

### 2.1 缩进就是语法

Python 没有 `{}`，缩进层级本身就是块结构。PEP 8 约定每级 **4 个空格**，同一块内必须一致；混用 Tab 和空格会抛 `TabError`。冒号 `:` 表示“下面开始一个块”，块内不能为空，占位用 `pass`。

```python
def classify(score):
    if score >= 90:
        return '优秀'
    return '不及格'

if True:
    pass  # 空块占位
```

### 2.2 注释与文档字符串

`#` 是单行注释。函数、类、模块的**第一条语句**若是字符串字面量，它就是文档字符串（docstring），保存在 `__doc__` 里，`help()` 和 IDE 都能读取。注释解释“为什么”，docstring 解释“是什么、怎么用”。

```python
def add(a, b):
    """返回两个数的和。"""
    return a + b
```

### 2.3 标识符与关键字

标识符由字母、数字、下划线组成，不能以数字开头，区分大小写。Python 3 允许 Unicode 字母，`变量名 = 1` 合法，但工程代码建议统一英文；`2name`、`my-name` 和 `class` 都不合法。

[width(20,80)]

| 类别         | 关键字                                                     |
| :----------- | :--------------------------------------------------------- |
| 值与逻辑     | `True` `False` `None` `and` `or` `not` `is` `in`           |
| 流程控制     | `if` `elif` `else` `for` `while` `break` `continue` `pass` |
| 函数与作用域 | `def` `return` `yield` `lambda` `global` `nonlocal`        |
| 异常         | `try` `except` `finally` `raise` `assert`                  |
| 类与模块     | `class` `import` `from` `as` `with` `del`                  |
| 异步         | `async` `await`                                            |

`match`、`case`、`_` 是**软关键字**：只在 `match` 语句的特定位置有特殊含义，平时仍可当普通名字。

### 2.4 PEP 8 命名速查

[width(24,36,40)]

| 对象        | 约定            | 示例                       |
| :---------- | :-------------- | :------------------------- |
| 模块 / 包   | 全小写 + 下划线 | `data_utils.py`            |
| 类          | 大驼峰          | `HttpClient`               |
| 函数 / 变量 | 全小写 + 下划线 | `parse_url`、`retry_count` |
| 常量        | 全大写 + 下划线 | `MAX_RETRIES`              |
| 内部使用    | 单下划线前缀    | `_cache`、`_helper()`      |

避免用 `l`、`O`、`I` 当单字符变量名，它们和数字 `1`、`0` 太难区分。

## 3. 变量：名字绑定对象

Python 的变量不是“装值的盒子”，而是**贴在对象上的名字标签**。执行 `a = 1` 时，解释器创建（或复用）整数对象 `1`，再让 `a` 指向它；执行 `b = a` 只是让 `b` 指向同一个对象，不复制值。

```python
a = [1, 2]
b = a
print(a is b)  # True
b.append(3)
print(a)  # [1, 2, 3]，通过 b 改的就是 a 看到的对象
```

想把“赋值”和“拷贝”分开，必须显式复制（`a.copy()`、`a[:]`、`copy.deepcopy`）。

### 3.1 赋值的几种形态

```python
a = b = c = []  # 链式：三个名字指向同一个对象
print(a is b is c)  # True

x, y = 1, 2
x, y = y, x  # 右侧先整体求值，交换安全
first, *rest = [1, 2, 3, 4]
print(first, rest)  # 1 [2, 3, 4]
```

链式赋值对不可变对象没问题，但对可变对象是**共享引用**：`a = b = []` 之后，`a.append(1)` 会让 `b` 也变。需要独立对象就分开写。

### 3.2 增量赋值不只是简写

`x += y` 优先调用 `__iadd__`（原地加法），没有才退化为 `x = x + y`。对列表来说，`+=` 是**原地扩展**，对象身份不变：

```python
nums = [1, 2]
alias = nums
nums += [3]
print(nums is alias)  # True，原地修改

nums = nums + [4]  # 普通 + 生成新列表
print(nums is alias)  # False
```

对不可变对象（`int`、`str`、`tuple`），`+=` 只能重新绑定新对象，别名不受影响。

> [!WARNING]
> 元组里放列表时，`t += (1,)` 合法（重新绑定整个元组），但 `t[0] += [1]` 会先原地改列表、再尝试给元组元素赋值，最终抛 `TypeError`，而列表其实已经被改了。

### 3.3 海象运算符 `:=`

`:=` 在表达式内部完成赋值，并把值作为整个表达式的结果，适合“先算再用”。它通常需要括号消除歧义。

```python
data = [1, 2, 3, 4]
if (n := len(data)) > 3:
    print(f'长度是 {n}')  # 长度是 4

with open('notes.txt', encoding='utf-8') as f:
    while line := f.readline():  # 边读边判断
        print(line.rstrip())
```

不要在能自然赋值的地方硬用海象，`n = len(data)` 再 `if n > 3:` 往往更清楚。

## 4. 类型、身份与相等

- `type(obj)`：对象是什么类型。
- `id(obj)`：对象的身份编号（CPython 里即地址，存活期间不变）。
- `==` 比较值是否相等，由 `__eq__` 决定；`is` 判断是否同一个对象，等价于比较 `id()`。

```python
a = [1, 2]
b = [1, 2]
c = a

print(type(a))  # <class 'list'>
print(a == b)   # True，内容相同
print(a is b)   # False，两个不同的列表对象
print(a is c)   # True，同一个对象
```

### 4.1 可变与不可变的直观感受

不可变对象（`int`、`str`、`tuple`、`frozenset`）创建后内容不能改，所有“修改”都是新建对象再重新绑定；可变对象（`list`、`dict`、`set`）原地修改，所有指向它的名字都会看到变化。

```python
s = 'abc'
t = s
s += 'd'
print(s, t)  # abcd abc，s 换了新对象，t 还指向旧的

lst = [1]
alias = lst
lst.append(2)
print(lst, alias)  # [1, 2] [1, 2]，同一个对象被原地修改
```

### 4.2 小整数与字符串驻留

CPython 缓存 `-5` 到 `256` 的整数，并在编译期合并相同的字符串字面量，所以某些 `is` 比较会意外为真：

```python
print(int('256') is int('256'))  # True（小整数缓存）
print(int('257') is int('257'))  # 通常 False，不要依赖
```

这是实现细节，不是语言保证。**判断相等永远用 `==`**；`is` 只用于 `None`、`True`、`False` 这类单例，以及确实要判断“是不是同一个对象”的场合。`value is None` 永远比 `value == None` 正确。

> [!WARNING]
> Python 3.8 起，对字面量使用 `is`（如 `x is 1`）会给出 `SyntaxWarning`。驻留行为随版本、实现、运行方式变化，线上可能和本地结果不同。

## 5. 输入、输出与 f-string 初识

`input()` 永远返回 `str`，需要数字就自己转换；`print()` 默认用空格分隔、结尾换行。

```python
name = input('请输入名字：')
age = int(input('请输入年龄：'))  # input 返回字符串，必须转换
print('明年', age + 1, '岁')       # 逗号分隔，输出时自动加空格

score = 92.5
print(f'{name} 的得分是 {score:.1f}')  # f-string 嵌入表达式
```

f-string 的完整格式说明符（宽度、对齐、千分位等）在 [字符串](/pythonBasics/basic/strings) 页展开。

## 6. 语句组织：分号、续行与 del

Python 允许用分号把多条简单语句写在一行，但 PEP 8 明确不建议：

```python
a = 1; b = 2; print(a + b)  # 合法，但不推荐
```

括号 `()`、`[]`、`{}` 内部可以自由换行，这叫**隐式行连接**，也是最推荐的写法：

```python
total = (
    1 + 2
    + 3
)
config = {'host': 'localhost', 'port': 8080}
```

括号外只能靠反斜杠 `\` 做**显式行连接**，而且反斜杠后不能有空格或注释：

```python
result = 1 + 2 + \
    3 + 4
```

显式续行脆弱又难维护，能加括号就加括号。

### 6.1 del 与常量约定

`del` 删除的是**名字绑定**，不是对象本身；没有其他引用时对象才可能被回收。Python 没有真正的常量，约定是**全大写命名**表示“不要改”，部分团队用 `typing.Final` 让类型检查器帮忙。

```python
x = 10
del x  # 删除名字绑定

from typing import Final

MAX_RETRIES: Final = 3  # 约定 + 静态检查，运行时仍可改
```

## 7. 常见陷阱

### 7.1 函数内赋值变成局部变量

```python
count = 0


def increase():
    count += 1  # UnboundLocalError：有赋值，count 在整个函数内都是局部名
```

只要函数体里对某个名字有赋值，它整个函数内就是局部变量，读取也会失败。需要修改全局时显式写 `global count`。

### 7.2 `+=` 污染默认参数

```python
def add_item(item, bucket=[]):  # 默认列表只创建一次，详见函数页
    bucket += [item]
    return bucket


print(add_item(1))  # [1]
print(add_item(2))  # [1, 2]
```

改用 `bucket = bucket + [item]` 或 `None` 哨兵。

## 8. 小结

[width(22,78)]

| 关键点     | 说明                                                           |
| :--------- | :------------------------------------------------------------- |
| 执行模型   | 编译到字节码后解释执行；动态类型 + 强类型，不做隐式转换。      |
| 缩进       | 4 个空格一级，缩进即语法；不要混用 Tab。                       |
| 变量       | 名字绑定对象，不是盒子；`b = a` 复制引用，可变对象会被共享。   |
| 相等与身份 | 比较值用 `==`，判断同一对象或 `None` 用 `is`；别依赖驻留行为。 |
| 赋值形态   | 链式、解包、增量、海象各有场景；`+=` 对可变对象是原地修改。    |
| 语句组织   | 一行一条语句；优先括号隐式续行，反斜杠只作兜底。               |

**一句话理解**：Python 的变量是对象的名字标签，赋值是重新贴标签；缩进定义结构，`==` 比内容、`is` 比身份，记住这两条就能避开大半语法坑。

---
outline: [2, 3]
---

# 函数基础与参数模型 (Functions and Parameters)

函数把一段逻辑打包成可复用的名字，同时它本身也是对象：可以赋值、传参、返回。真正容易出错的往往不是 `def` 的写法，而是参数怎样绑定、默认值在什么时候求值。

> [!TIP] 相关阅读
> 名字与赋值的基础见 [语法与变量](/pythonBasics/basic/syntaxAndVariables)；函数记住外层变量的机制见 [作用域与闭包](/pythonBasics/functions/closures)；在函数外面再包一层的写法见 [装饰器](/pythonBasics/functions/decorators)；函数返回的迭代器如何逐个产出值，见 [迭代器与可迭代对象](/pythonBasics/functions/iterators)。

## 1. 定义、调用与返回值

`def` 定义函数，函数名后是参数列表，冒号后是缩进的函数体。函数体在**调用时**才执行，定义时只是创建函数对象。

```python
def greet(name):
    return f'你好，{name}！'

print(greet('小明'))  # 你好，小明！
print(greet.__name__)  # greet
```

没有 `return`，或者只写 `return`，返回值都是 `None`。`print` 只是往标准输出写内容，它本身也返回 `None`，不能当成“返回结果”。`return a, b` 返回的是一个元组，可以原样接收，也可以解包：

```python
def min_max(nums):
    return min(nums), max(nums)

print(min_max([3, 1, 4]))  # (1, 4)
low, high = min_max([3, 1, 4])
print(low, high)  # 1 4
```

返回值超过三四个时，元组解包会变得难读，改用 `dataclass`、`NamedTuple` 或字典更清楚。

## 2. 文档与类型注解

函数体第一行如果是字符串，它就成为文档字符串，保存在 `__doc__` 里，`help()` 会读取：

```python
def divide(a: float, b: float) -> float:
    """返回 a / b，b 不能为 0。"""
    return a / b

print(divide.__doc__)  # 返回 a / b，b 不能为 0。
```

参数和返回值的注解写在名字后面，Python **不会在运行时检查**它们，也不会做类型转换；它们服务于阅读者、IDE 和 mypy / pyright。Python 3.9 起可直接写 `list[int]`，3.10 起可用 `int | None`。

```python
def repeat(text: str, times: int = 2) -> str:
    return text * times

print(repeat(3, 2))  # 6，注解不参与运行，传错类型不会报错
```

`from __future__ import annotations`（3.7+）把注解保存成字符串并推迟求值，便于写前向引用，也减少导入时的开销。需要真实类型对象时用 `typing.get_type_hints()` 解析；Python 3.14 起注解默认就是延迟求值。

## 3. 参数模型

### 3.1 五种参数形态

[width(18,23,59)]

| 形态         | 写法              | 说明                               |
| :----------- | :---------------- | :--------------------------------- |
| 位置或关键字 | `def f(a, b)`     | 最普通的一类，可按位置或按名字传。 |
| 仅限位置     | `def f(a, /, b)`  | 斜杠前的参数只能按位置传。         |
| 仅限关键字   | `def f(a, *, b)`  | 星号后的参数只能按名字传。         |
| 可变位置     | `def f(*args)`    | 收集多余的位置参数，得到元组。     |
| 可变关键字   | `def f(**kwargs)` | 收集多余的关键字参数，得到字典。   |

### 3.2 位置参数、关键字参数与可变参数

```python
def move(x, y, speed):
    return f'移动到 ({x}, {y})，速度 {speed}'

print(move(10, 20, 3))            # 按位置
print(move(x=10, y=20, speed=3))  # 全按名字

def report(title, *rows, **options):
    print(title, rows, options)

report('销售', '一月', '二月', bold=True, align='center')
# 销售 ('一月', '二月') {'bold': True, 'align': 'center'}
```

### 3.3 参数顺序规则

一旦某个参数用关键字传了，它后面的参数也必须用关键字传；`move(10, y=20, 3)` 是语法错误。`*args` / `**kwargs` 适合包装器和参数转发，业务函数里能写明确参数就写明确参数。

完整签名的顺序是：仅限位置参数 → 普通参数 → `*args` → 仅限关键字参数 → `**kwargs`。普通参数中带默认值的必须排在没有默认值的后面；仅限关键字参数不受此限制，因为调用时总能按名字跳过。

```python
def configure(host, port=8000, /, *flags, debug=False, retries=3, **options):
    print(host, port, flags, debug, retries, options)

configure('localhost', 9000, '--reload', debug=True, retries=1)
# localhost 9000 ('--reload',) True 1 {}
```

### 3.4 仅限位置、仅限关键字与解包

Python 3.8 起支持这两个标记。斜杠 `/` 前面的参数只能按位置传，适合参数名没有语义、或者不希望调用方依赖参数名的接口。星号 `*` 后面的参数只能按名字传，适合布尔开关和配置项，避免 `f(True, False, True)` 这种看不出含义的调用。

```python
def power(base, exponent, /):
    return base ** exponent

print(power(2, 10))  # 1024
# power(base=2, exponent=10)  # TypeError

def fetch(url, *, timeout=5, retries=3):
    return f'GET {url}，超时 {timeout}s，重试 {retries} 次'

print(fetch('https://example.com', timeout=1))
# fetch('https://example.com', 1)  # TypeError
```

定义端的 `*` / `**` 是收集，调用端的 `*` / `**` 是展开。列表、元组、集合、生成器都能展开成位置参数，字典能展开成关键字参数；`**` 的键必须是字符串且与参数名对应：

```python
def add(a, b, c):
    return a + b + c

nums = [1, 2, 3]
options = {'a': 1, 'b': 2, 'c': 3}
print(add(*nums), add(**options))  # 6 6
print(*nums, sep=', ')  # 1, 2, 3
```

### 3.5 默认参数的陷阱

默认值在**函数定义时**求值一次，之后每次调用复用同一个对象。可变默认值因此会被所有调用共享：

```python
def add_item(item, bucket=[]):
    bucket.append(item)
    return bucket

print(add_item('a'))  # ['a']
print(add_item('b'))  # ['a', 'b']
```

正确写法是用 `None` 占位，在函数体内新建对象。`{}`、`set()` 和自定义可变对象同理；`dataclasses.field(default_factory=list)` 解决的是同类问题。

```python
def add_item(item, bucket=None):
    if bucket is None:
        bucket = []
    bucket.append(item)
    return bucket
```

默认值也不是每次调用重新计算。下面这个时间戳会永远停在模块导入的时刻：

```python
import time

def stamp(now=time.time()):
    return now

print(stamp() == stamp())  # True

def stamp_now(now=None):
    return time.time() if now is None else now
```

> [!WARNING]
> 默认值表达式里不要放读文件、连数据库、发请求这类有副作用的调用。模块级函数定义发生在导入阶段，副作用会让模块导入变慢，甚至让测试环境直接失败。

## 4. 函数是一等对象

函数可以绑定到另一个名字、放进容器、作为参数传给别的函数，也可以作为返回值。接收函数或返回函数的函数叫高阶函数。

```python
def square(x):
    return x * x

f = square
print(f(4), f is square)  # 16 True

def apply(func, value):
    return func(value)

print(apply(square, 5))  # 25

def make_multiplier(n):
    def multiply(x):
        return x * n
    return multiply

double = make_multiplier(2)
print(double(10))  # 20
```

`make_multiplier` 返回的内部函数记住了 `n`，这就是闭包，机制见 [作用域与闭包](/pythonBasics/functions/closures)。

`lambda` 只能写单个表达式，适合作为 `key=` 或一次性回调；不能包含语句，不能写注解，也不适合赋给变量长期使用：

```python
pairs = [('b', 2), ('a', 1)]
pairs.sort(key=lambda p: p[0])
print(pairs)  # [('a', 1), ('b', 2)]
```

[width(24,11,65)]

| 函数               | 返回   | 说明                                  |
| :----------------- | :----- | :------------------------------------ |
| `map(func, it)`    | 迭代器 | 对每个元素调用 `func`，惰性求值。     |
| `filter(func, it)` | 迭代器 | 保留 `func` 返回真值的元素。          |
| `sorted(it, key=)` | 列表   | 立即排序并返回新列表，稳定排序。      |
| `any` / `all`      | 布尔值 | 任一为真 / 全部为真，遇到结果就短路。 |
| `max` / `min`      | 元素   | 支持 `key=` 和 `default=`。           |

`functools.partial` 预先绑定部分参数，`functools.reduce` 把序列折叠成单个值；`reduce` 对空序列且没有初始值会抛 `TypeError`：

```python
from functools import partial, reduce

def power(base, exponent):
    return base ** exponent

square = partial(power, exponent=2)
print(square(5))  # 25
print(reduce(lambda a, b: a * b, [1, 2, 3, 4]))  # 24
print(reduce(lambda a, b: a + b, [1, 2, 3], 10))  # 16
```

`map`、`filter` 与迭代器的关系集中在 [迭代器与可迭代对象](/pythonBasics/functions/iterators) 里讲。

## 5. 递归

递归函数直接或间接调用自己，必须有**基线条件**和**递归步骤**：

```python
def factorial(n):
    if n <= 1:  # 基线条件
        return 1
    return n * factorial(n - 1)  # 递归步骤

print(factorial(5))  # 120
```

没有基线条件，或者基线条件永远达不到，会一直压栈直到 `RecursionError`。CPython 默认递归深度约 1000，可用 `sys.getrecursionlimit()` 查看，但不要为了跑通代码随意调大。

Python **不做尾递归优化**。下面这个写法看起来是尾递归，每次调用仍然新增栈帧：

```python
def factorial_tail(n, acc=1):
    if n <= 1:
        return acc
    return factorial_tail(n - 1, n * acc)  # 不会复用栈帧
```

树的遍历、分治、回溯适合递归；深度不可控时改成循环或显式栈。有重复子问题时用 `functools.lru_cache` 记忆化，例如 `fib(50)` 可以从指数级降到线性。

## 6. 常见陷阱

**参数名遮蔽内置名字。** `list`、`dict`、`sum`、`input`、`id`、`type` 作为参数名后，函数体内就看不到同名的内置对象：

```python
def average(sum, count):
    return sum / count  # 这里的 sum 是参数，内置 sum() 已不可见

print(average(10, 2))  # 5.0
```

**参数列表过长。** 超过四五个参数，调用方很难记住顺序，布尔参数尤其容易传反。把相关参数收进 `dataclass` 或配置对象，或者用 `*` 强制关键字传参；需要多个返回值时，用有字段名的 `NamedTuple` 也比裸元组清楚。

**忘了调用函数。** 函数名后不加括号，拿到的是函数对象，不是结果；存进变量或回调时尤其容易漏：

```python
import math

result = math.sqrt
print(result)     # <built-in function sqrt>
print(result(9))  # 3.0
```

**用可变对象做默认值。** 见 3.5 节，默认值是 `[]`、`{}`、`set()` 时几乎都应该改成 `None` 占位。

## 7. 小结

[width(22,78)]

| 关键点     | 说明                                                      |
| :--------- | :-------------------------------------------------------- |
| 返回值     | 没有 `return` 返回 `None`；多个返回值是一个元组。         |
| 参数顺序   | 仅限位置 → 普通参数 → `*args` → 仅限关键字 → `**kwargs`。 |
| 默认值时机 | 定义时求值一次，所有调用共享；可变默认值用 `None` 占位。  |
| 函数是对象 | 可赋值、可传参、可返回；`lambda` 只适合单表达式。         |
| 递归       | 必须有基线条件；Python 不做尾递归优化，深度受限。         |
| 类型注解   | 不影响运行，只服务阅读和静态检查；前向引用可用延迟注解。  |

**一句话理解**：Python 的函数是可调用的普通对象，参数模型负责把调用方的值绑定到名字上，而默认值的求值时机和可变性是这套模型里最容易踩的两个坑。

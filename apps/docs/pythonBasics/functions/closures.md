---
outline: [2, 3]
---

# 作用域与闭包 (Scope and Closures)

闭包是“函数记住了它出生时的环境”。要理解它，先要弄清楚一个名字在函数里到底去哪儿找；要避免它的坑，则要记住：闭包捕获的是变量，不是变量当时的值。

> [!TIP] 相关阅读
> 参数与返回值的基础见 [函数基础与参数模型](/pythonBasics/functions/functionBasics)；闭包最常见的应用是 [装饰器](/pythonBasics/functions/decorators)；闭包也让生成器与 [上下文管理器](/pythonBasics/functions/contextManagers) 的状态得以保留；类与闭包如何取舍，可对照 [类与实例](/pythonBasics/oop/classesAndInstances)。

## 1. 名字查找：LEGB 与 global/nonlocal

Python 查找一个名字时，按 **L → E → G → B** 的顺序逐层搜索，找到就停：

[width(14,24,62)]

| 层级 | 名称      | 含义                                        |
| :--- | :-------- | :------------------------------------------ |
| L    | Local     | 当前函数自己的局部作用域。                  |
| E    | Enclosing | 外层函数的局部作用域，由内向外逐层查找。    |
| G    | Global    | 当前模块的全局作用域。                      |
| B    | Built-in  | 内置名字，如 `len`、`print`、`ValueError`。 |

```python
x = 'global'

def outer():
    x = 'enclosing'
    def inner():
        x = 'local'
        print(x)  # local
    inner()

outer()
```

内层函数没有自己的 `x` 时，会用到外层的 `enclosing`；外层也没有，才轮到全局和内置。**赋值会让名字在编译期被判定为局部变量**，因此下面的代码在 `print(count)` 就抛 `UnboundLocalError`，而不是先读全局再赋值：

```python
count = 0

def bump():
    print(count)  # UnboundLocalError
    count += 1

bump()
```

要在函数内改写模块级变量，必须声明 `global`；要改写外层函数的局部变量，必须声明 `nonlocal`：

```python
count = 0

def bump():
    global count
    count += 1

def make_counter():
    count = 0
    def increment():
        nonlocal count
        count += 1
        return count
    return increment
```

`nonlocal` 只向上找函数作用域，找不到绑定会在编译期报 `SyntaxError`；它不能指向全局或内置名字。`global` 能改全局状态，但会让数据流隐式化、测试变难、并发下更容易出错，能用返回值、参数或类实例替代时就不要用。模块级常量只读不写，根本不需要 `global`。

## 2. 闭包是什么

闭包指内部函数引用了外层函数的局部变量，并且这个内部函数被传到外层函数之外继续使用。形成闭包需要三个条件：

- **函数嵌套**：内部函数定义在外部函数里。
- **引用自由变量**：内部函数使用了既不是自己参数、也不是自己局部变量的名字。
- **内部函数被传出**：外部函数返回它，或把它存进容器、注册为回调。

```python
def make_greeting(greeting):
    def greet(name):
        return f'{greeting}，{name}！'
    return greet

hello = make_greeting('你好')
morning = make_greeting('早上好')
print(hello('小明'))    # 你好，小明！
print(morning('小明'))  # 早上好，小明！
```

`make_greeting` 返回后，它的栈帧已经销毁，但 `greeting` 被内部函数的闭包单元持有，所以两次调用各用各的问候语。自由变量是 `greeting`，不是 `name`。

## 3. 闭包的典型用法

**函数工厂**：把配置固定下来，生成一批行为相似、参数不同的函数。

```python
def make_power(exponent):
    def power(base):
        return base ** exponent
    return power

square = make_power(2)
cube = make_power(3)
print(square(5), cube(5))  # 25 125
```

**带状态的计数器**：状态藏在闭包里，外部只能通过返回的函数读写。

```python
def make_counter(start=0):
    count = start
    def increment(step=1):
        nonlocal count
        count += step
        return count
    return increment

counter = make_counter(10)
print(counter())   # 11
print(counter(5))  # 16
```

**配置化函数**：把范围、前缀、重试次数等固定进一个专用函数，调用处只传变化的部分。

```python
def make_validator(min_len, max_len):
    def validate(text):
        return min_len <= len(text) <= max_len
    return validate

username = make_validator(3, 12)
print(username('ab'))     # False
print(username('alice'))  # True
```

闭包适合“一个有状态的、只需一个入口的可调用对象”。需要多个方法、需要被继承或序列化时，类更合适，见第 6 节。

## 4. 捕获的是变量：延迟绑定

闭包保存的是**变量所在的作用域**，不是创建闭包那一刻的值。变量后来变了，闭包里看到的就是新值。循环里创建闭包是最典型的翻车场景：

```python
funcs = []
for i in range(3):
    funcs.append(lambda: i)

print([f() for f in funcs])  # [2, 2, 2]
```

三个 lambda 共用同一个 `i`；循环结束时 `i == 2`，调用时自然都返回 2。用列表推导式也一样，推导式有独立作用域，但三个 lambda 仍然共享那个作用域里的 `i`。

修复方式一：用默认参数在**定义时**把当前值绑定进去。默认值在定义时求值，每个 lambda 得到自己的副本。

```python
funcs = [lambda i=i: i for i in range(3)]
print([f() for f in funcs])  # [0, 1, 2]
```

修复方式二：用工厂函数，每次调用都创建一个新的闭包单元。

```python
def make_func(i):
    return lambda: i

funcs = [make_func(i) for i in range(3)]
print([f() for f in funcs])  # [0, 1, 2]
```

> [!NOTE]
> 默认参数绑定是“立即捕获值”的技巧，代价是函数签名里多了一个带默认值的参数。如果这个函数要暴露给外部调用，工厂函数更干净。

## 5. 观察闭包与内存

函数的 `__closure__` 是一个由 cell 组成的元组，每个 cell 的 `cell_contents` 就是被捕获的变量；`__code__.co_freevars` 给出自由变量的名字。这些是调试和教学用的，业务代码不应该依赖它们。

```python
def make_adder(n):
    def add(x):
        return x + n
    return add

add5 = make_adder(5)
print(add5.__code__.co_freevars)            # ('n',)
print(add5.__closure__[0].cell_contents)    # 5
print(add5(10))                             # 15
```

闭包持有变量，也就持有变量指向的对象。只要闭包函数还活着，被捕获的对象就不会被回收：

```python
def make_reader():
    data = list(range(1_000_000))  # 大对象
    def read(index):
        return data[index]
    return read

reader = make_reader()  # data 一直被 reader 的闭包持有
# del reader 之后，data 才可能被回收
```

> [!WARNING]
> 不要在闭包里无意捕获大对象、打开的文件句柄或 `self`。如果只需要其中一小部分，先提取出需要的值再返回内部函数；用完闭包后及时 `del` 掉，别让它一直挂在全局或长生命周期的容器里。

## 6. 闭包 vs 类

闭包的状态是**隐式**的：只能通过调用行为观察，不能直接读属性，也不容易序列化。类把状态放在 `self` 上，方法、属性、继承和类型检查都更明确。

[width(13,44,43)]

| 维度     | 闭包                                   | 类                                   |
| :------- | :------------------------------------- | :----------------------------------- |
| 状态     | 藏在 cell 里，外部不可见。             | 存在实例属性上，可直接访问和调试。   |
| 入口数量 | 通常只有一个可调用对象。               | 可以有多个方法、属性和运算符重载。   |
| 复用方式 | 通过工厂函数生成不同配置的副本。       | 通过继承、组合、协议扩展。           |
| 序列化   | 局部函数通常不能 `pickle`。            | 普通类实例可以序列化。               |
| 适用场景 | 回调、装饰器、一次性配置、小型状态机。 | 有明确生命周期和多个操作的领域对象。 |

```python
class Counter:
    def __init__(self, start=0):
        self.count = start

    def increment(self, step=1):
        self.count += step
        return self.count

counter = Counter(10)
print(counter.increment())  # 11
print(counter.count)        # 11，状态可见
```

闭包和装饰器是同一套机制：装饰器用一个闭包保存原函数和配置，再返回包装后的函数。具体写法见 [装饰器](/pythonBasics/functions/decorators)。

## 7. 常见陷阱

**漏写 `nonlocal`。** 在内部函数里给外层变量赋值却不声明 `nonlocal`，Python 会把它当成新的局部变量；`+=` 还会在读之前就抛 `UnboundLocalError`。只读不写时不需要 `nonlocal`。

**循环变量延迟绑定。** 见第 4 节。默认参数绑定当前值，工厂函数创建新作用域，两种方式都能修。

**默认参数绑定与闭包语义混淆。** `lambda x=x: x` 捕获的是定义时的值；`lambda: x` 捕获的是变量。前者适合循环里立即固定，后者适合“每次调用都读最新值”的场景，比如实时读取配置。

**异常变量被清空。** `except Exception as e:` 在块结束时隐式删除 `e`，以打断异常引用环。如果闭包捕获了 `e`，之后调用会因 cell 为空而报 `NameError`：

```python
def make_handler():
    try:
        1 / 0
    except ZeroDivisionError as e:
        return lambda: str(e)
    return None

handler = make_handler()
# handler()  # NameError: cannot access free variable 'e'
```

需要在闭包外继续使用异常对象时，进 `except` 后立刻赋给另一个名字：`message = str(e)`。

## 8. 小结

[width(22,78)]

| 关键点     | 说明                                                           |
| :--------- | :------------------------------------------------------------- |
| 查找顺序   | LEGB：局部 → 外层函数 → 全局 → 内置。                          |
| 改写外层   | 改全局用 `global`，改外层函数变量用 `nonlocal`；能不用就不用。 |
| 闭包三要素 | 函数嵌套、引用自由变量、内部函数被传出。                       |
| 捕获对象   | 捕获变量（作用域），不是创建时的值；循环里要用默认参数或工厂。 |
| 内存       | cell 持有变量指向的对象，闭包活着对象就不释放。                |
| 选型       | 单入口、轻状态用闭包；多方法、可序列化、需继承用类。           |

**一句话理解**：闭包让函数带着出生环境一起走，但这个环境是活的——变量后来怎么变，闭包里就怎么变，循环里创建闭包时必须主动把当前值固定下来。

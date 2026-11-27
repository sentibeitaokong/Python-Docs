---
outline: [2, 3]
---

# 生成器 (Generators)

生成器是“能暂停和恢复的函数”：调用时什么都不执行，`next()` 一次才跑到下一个 `yield`。它用极低的内存成本表达惰性序列、无限流和多级数据处理管道。

> [!TIP] 相关阅读
> 迭代器协议与 `StopIteration` 见 [迭代器与可迭代对象](/pythonBasics/functions/iterators)；`yield` 让函数记住状态的机制见 [作用域与闭包](/pythonBasics/functions/closures)；基于生成器实现的资源管理见 [上下文管理器](/pythonBasics/functions/contextManagers)；生成器表达式与推导式的对比见 [推导式](/pythonBasics/dataStructures/comprehensions)。

## 1. 从 yield 开始

函数体里出现 `yield`，它就不再是普通函数，而是生成器函数。调用它不会执行函数体，只返回一个生成器对象；每次 `next()` 执行到 `yield` 处暂停并产出一个值，下次从暂停处继续。

```python
def countdown(n):
    print('开始')
    while n > 0:
        yield n
        n -= 1
    print('结束')

gen = countdown(2)   # 什么都不打印
print(type(gen))     # <class 'generator'>
print(next(gen))     # 先打印“开始”，再打印 2
print(next(gen))     # 1
# 第三次 next：打印“结束”，然后抛 StopIteration
```

`yield` 既是“产出一个值”，也是“把控制权交回调用方”。函数的所有局部变量在暂停期间都保留着，恢复后接着用；这就是生成器能表达状态机的原因。生成器表达式 `(x * x for x in range(5))` 是创建生成器的最短写法，返回的同样是只能消费一次的生成器对象。

## 2. 惰性求值与内存优势

生成器按需计算，不会先把整个结果装进内存。处理大文件时，可以一块一块读：

```python
def read_in_chunks(path, size=1024):
    with open(path, 'rb') as f:
        while chunk := f.read(size):
            yield chunk

# 每次只持有一个 chunk，内存占用与文件大小无关
total = sum(len(chunk) for chunk in read_in_chunks('big.bin'))
```

表达无限序列时，生成器几乎是唯一自然的选择；配合 `itertools.islice` 取前若干项：

```python
import itertools

def naturals():
    n = 0
    while True:
        yield n
        n += 1

print(list(itertools.islice(naturals(), 5)))  # [0, 1, 2, 3, 4]
```

[width(22,36,42)]

| 方式         | 内存                 | 适合场景                           |
| :----------- | :------------------- | :--------------------------------- |
| 列表推导式   | 一次装下所有结果。   | 数据量小、需要反复遍历或随机访问。 |
| 生成器表达式 | 一次只保留当前元素。 | 数据量大、只需要顺序消费一次。     |
| 生成器函数   | 一次只保留当前状态。 | 逻辑复杂、需要多步处理或无限流。   |

> [!NOTE]
> 惰性不自动等于更快。生成器每产出一个元素都有额外的帧切换开销；数据量小、需要多次遍历时，直接构造列表往往更简单也更快。先看内存和访问模式，再决定是否惰性。

## 3. 驱动生成器：next、send、throw、close

`next(gen)` 等价于 `gen.send(None)`。`send(value)` 会把值送回**上一个暂停的 `yield` 表达式**，因此生成器可以用它接收外部输入：

```python
def accumulator():
    total = 0
    while True:
        value = yield total
        if value is None:
            break
        total += value

acc = accumulator()
print(next(acc))     # 0，启动并停在第一个 yield
print(acc.send(10))  # 10
print(acc.send(5))   # 15
acc.close()
```

第一次启动必须用 `next()` 或 `send(None)`；直接 `send(非 None)` 会抛 `TypeError`，因为生成器还没停在任何 `yield` 上。

`throw()` 在暂停点抛入一个异常，生成器可以捕获它并继续产出；`close()` 在暂停点抛入 `GeneratorExit`，用于触发 `finally` 清理。生成器不应在收到 `GeneratorExit` 后继续 `yield`，否则会抛 `RuntimeError`。

```python
def guarded():
    try:
        while True:
            yield '工作中'
    except ValueError:
        yield '已捕获 ValueError'

g = guarded()
print(next(g))              # 工作中
print(g.throw(ValueError))  # 已捕获 ValueError
```

生成器在生命周期中有四种状态，可以用 `inspect.getgeneratorstate()` 观察：

[width(21,79)]

| 状态            | 含义                                          |
| :-------------- | :-------------------------------------------- |
| `GEN_CREATED`   | 已创建，尚未开始执行。                        |
| `GEN_RUNNING`   | 正在执行，通常只在生成器内部或别的线程可见。  |
| `GEN_SUSPENDED` | 停在 `yield` 处，等待下一次 `next` / `send`。 |
| `GEN_CLOSED`    | 已正常结束、抛异常结束或被 `close()`。        |

```python
import inspect

def demo():
    yield 1

g = demo()
print(inspect.getgeneratorstate(g))  # GEN_CREATED
next(g)
print(inspect.getgeneratorstate(g))  # GEN_SUSPENDED
g.close()
print(inspect.getgeneratorstate(g))  # GEN_CLOSED
```

## 4. yield from 与返回值

`yield from` 把一个子生成器完全委托出去：产出的值原样透传，`send()` / `throw()` 也会转发给子生成器，子生成器的 `return` 值成为 `yield from` 表达式的结果。

```python
def inner():
    yield 1
    yield 2
    return 'inner 完成'

def outer():
    result = yield from inner()
    print('子生成器返回:', result)
    yield 3

print(list(outer()))
# 子生成器返回: inner 完成
# [1, 2, 3]
```

生成器里的 `return value` 不会把值交给 `for` 循环，而是放进 `StopIteration.value`。正常 `for` 遍历会吞掉这个异常，所以返回值被忽略；想拿到它，需要手动 `next()` 并捕获 `StopIteration`。

```python
def search(lines, keyword):
    for number, line in enumerate(lines, start=1):
        if keyword in line:
            return number
    return None

gen = search(['a', 'b'], 'b')
try:
    next(gen)
except StopIteration as exc:
    print(exc.value)  # 2
```

`yield from` 也适合串接一层嵌套的可迭代对象：`for item in items: yield from item` 比手写内层循环更短，且保留完整的转发语义。

## 5. 生成器管道

多个生成器可以首尾相接，形成流式管道：每个阶段只处理当前元素，不会把中间结果整体物化。

```python
def read_numbers(lines):
    for line in lines:
        line = line.strip()
        if line:
            yield int(line)

def keep_even(numbers):
    for n in numbers:
        if n % 2 == 0:
            yield n

def running_total(numbers):
    total = 0
    for n in numbers:
        total += n
        yield total

lines = ['1', '2', '3', '4', '5', '6']
pipeline = running_total(keep_even(read_numbers(lines)))
print(list(pipeline))  # [2, 6, 12]
```

管道是“拉”模型：最下游的 `next()` 触发上游逐级推进。它的优点是内存平稳、阶段可复用；代价是异常会在消费时才暴露，栈追踪里会看到多层生成器，定位问题时需要顺着管道往上游找。

## 6. contextmanager 与异步生成器

`contextlib.contextmanager` 把生成器变成上下文管理器：`yield` 之前是进入逻辑，`yield` 之后是退出逻辑，`try/finally` 保证异常时也能清理。完整的 `with` 协议见 [上下文管理器](/pythonBasics/functions/contextManagers)。

```python
from contextlib import contextmanager
import time

@contextmanager
def timer(label):
    start = time.perf_counter()
    try:
        yield
    finally:
        print(f'{label}: {time.perf_counter() - start:.4f}s')

with timer('累加'):
    sum(range(100_000))
```

`async def` 加 `yield` 得到异步生成器，它实现异步迭代协议，只能用 `async for` 消费，并且内部可以 `await`：

```python
import asyncio

async def ticker(n):
    for i in range(n):
        await asyncio.sleep(0)
        yield i

async def main():
    async for value in ticker(3):
        print(value)  # 0 1 2

asyncio.run(main())
```

异步生成器不能放进普通的 `for`，也不能直接 `list()`；需要收集时用 `[value async for value in agen]`。

## 7. 常见陷阱

**生成器只能消费一次。** 遍历完或 `list()` 之后，生成器已关闭，再遍历得到空结果。需要多轮时，重新调用生成器函数，或者先把结果物化成列表。

**副作用发生在消费时。** 生成器函数调用时什么都不做；下面这段代码在 `list()` 之前不会往 `seen` 里追加任何东西。

```python
seen = []

def track(items):
    for item in items:
        seen.append(item)  # 只有被消费时才执行
        yield item

gen = track([1, 2, 3])
print(seen)   # []
print(list(gen), seen)  # [1, 2, 3] [1, 2, 3]
```

**忘记关闭资源。** 生成器被提前丢弃时，`finally` 不一定会立刻执行。打开文件、锁、连接这类资源，应该把 `with` 写在生成器内部，或者用 `try/finally` 兜底：

```python
def read_lines(path):
    with open(path, encoding='utf-8') as f:
        for line in f:
            yield line.rstrip('\n')
```

**生成器表达式延迟绑定外部变量。** 生成器表达式捕获的是变量，不是创建时的值；变量后来变了，消费时看到的是新值：

```python
x = 10
gen = (x for _ in range(3))
x = 20
print(list(gen))  # [20, 20, 20]
```

需要固定当前值时，先把它绑定到不会再变的局部变量，或者改用带默认参数的生成器函数。

**`StopIteration` 泄漏。** 在生成器内部手动 `next()` 时，要把 `StopIteration` 转成 `return` 或捕获；直接泄漏会被 PEP 479 转成 `RuntimeError`，细节见 [迭代器与可迭代对象](/pythonBasics/functions/iterators)。

## 8. 小结

[width(22,78)]

| 关键点       | 说明                                                           |
| :----------- | :------------------------------------------------------------- |
| 创建         | 函数体含 `yield`；调用返回生成器，函数体暂不执行。             |
| 驱动         | `next()` / `send()` 推进，`throw()` 注入异常，`close()` 清理。 |
| 状态         | CREATED → RUNNING → SUSPENDED → CLOSED，同一时刻只停在一个点。 |
| `yield from` | 委托子生成器，透传 send/throw，并接收其 `return` 值。          |
| 返回值       | 生成器的 `return value` 放在 `StopIteration.value` 里。        |
| 惰性         | 内存平稳，适合大文件和无限流；小数据多次遍历未必更快。         |
| 常见陷阱     | 只能消费一次、副作用延迟、资源未关、表达式延迟绑定。           |

**一句话理解**：生成器是一台可以随时暂停的取值机器，`yield` 交出当前值并记住现场，下次 `next()` 从原地继续；它的力量和它的坑都来自“只在被消费时才执行”。

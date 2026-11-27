---
outline: [2, 3]
---

# 上下文管理器 (Context Managers)

`with` 语句保证一段代码无论在正常结束还是抛异常时，都能执行清理动作。文件、锁、数据库事务、临时目录、计时器，凡是“用完必须收尾”的资源，都适合包成上下文管理器。

> [!TIP] 相关阅读
> 基于生成器写上下文管理器，先看 [生成器](/pythonBasics/functions/generators)；异常类型与 `try/except/finally` 的基础见 [异常处理](/pythonBasics/basic/exceptions)；用类实现协议的整体思路见 [类与实例](/pythonBasics/oop/classesAndInstances)；属性访问协议见 [属性与描述符](/pythonBasics/oop/propertiesAndDescriptors)。

## 1. with 的价值

不用 `with` 时，资源释放要自己写 `try/finally`；一旦漏掉，文件可能一直不关闭，锁可能一直不释放。`with` 把“进入”和“退出”绑定在一起，退出逻辑由协议保证执行。

```python
f = open('data.txt', 'w')
try:
    f.write('hello')
finally:
    f.close()

with open('data.txt', 'w') as f:
    f.write('hello')  # 离开 with 时自动 close，异常时也一样
```

[width(22,34,44)]

| 方面     | 手动 try/finally           | with                                |
| :------- | :------------------------- | :---------------------------------- |
| 释放时机 | 取决于你是否写了 finally。 | 由协议保证，离开代码块就执行。      |
| 可读性   | 进入、业务、清理混在一起。 | 进入和清理收在资源对象里。          |
| 异常安全 | 容易漏写或写错。           | 进入成功后，`__exit__` 一定被调用。 |

> [!NOTE]
> “一定”有前提：资源必须成功进入。如果 `__enter__` 本身抛异常，`__exit__` 不会被调用，所以获取资源的动作要放在 `__enter__` 里，并保证失败时不留半成品。

## 2. 协议：`__enter__` 与 `__exit__`

只要对象实现了这两个方法，就能用在 `with` 里：

[width(42,58)]

| 方法                                | 说明                                                      |
| :---------------------------------- | :-------------------------------------------------------- |
| `__enter__(self)`                   | 进入时调用，返回值绑定到 `as`；不写 `as` 时返回值被忽略。 |
| `__exit__(self, exc_type, exc, tb)` | 退出时调用；正常退出三个参数都是 `None`。                 |

`__exit__` 的返回值决定异常是否继续传播：返回 `None` 或 `False`，异常照常抛出；返回 `True`，异常被吞掉。这个开关很危险，除非明确就是要抑制某类异常。

```python
class Tracer:
    def __init__(self, label):
        self.label = label
    def __enter__(self):
        print(f'进入 {self.label}')
        return self
    def __exit__(self, exc_type, exc, tb):
        print(f'离开 {self.label}')
        return False

with Tracer('区块') as t:
    print('执行中')
# 进入 区块
# 执行中
# 离开 区块
```

`__exit__` 里的 `exc` 是异常实例，`tb` 是 traceback；可以在这里记录日志、回滚事务，但记录完通常应返回 `False`，让上层知道出过错。

## 3. 用类实现上下文管理器

**文件**：`__init__` 只保存参数，真正打开文件放在 `__enter__`。这样打开失败时不会留下“构造了一半”的对象。

```python
class ManagedFile:
    def __init__(self, path, mode='r'):
        self.path, self.mode, self.file = path, mode, None
    def __enter__(self):
        self.file = open(self.path, self.mode, encoding='utf-8')
        return self.file
    def __exit__(self, exc_type, exc, tb):
        if self.file is not None:
            self.file.close()
        return False
```

**锁**：`threading.Lock` 本身就是一个实现了协议的类，进入时加锁、退出时释放，临界区抛异常也不会死锁。

```python
import threading

lock = threading.Lock()
with lock:
    shared_value += 1  # 临界区
```

**事务**：正常结束提交，异常时回滚，并且不吞掉异常。下面假设进入前已经开启了事务。

```python
class Transaction:
    def __init__(self, connection):
        self.connection = connection
    def __enter__(self):
        return self.connection
    def __exit__(self, exc_type, exc, tb):
        if exc_type is None:
            self.connection.commit()
        else:
            self.connection.rollback()
        return False
```

**计时器**：开始时间放在 `__enter__`，结束时间放在 `__exit__`，即使代码抛异常也能记录。

```python
import time

class Timer:
    def __init__(self, label='耗时'):
        self.label = label
    def __enter__(self):
        self.start = time.perf_counter()
        return self
    def __exit__(self, exc_type, exc, tb):
        self.elapsed = time.perf_counter() - self.start
        print(f'{self.label}: {self.elapsed:.4f}s')
        return False

# with Timer('排序'): ...
```

## 4. contextlib.contextmanager

大多数上下文管理器不需要写类。`@contextmanager` 接收一个生成器函数：`yield` 之前是进入逻辑，`yield` 的值绑定到 `as`，`yield` 之后是退出逻辑。

```python
from contextlib import contextmanager

@contextmanager
def tag(name):
    print(f'<{name}>')
    try:
        yield name
    finally:
        print(f'</{name}>')

with tag('div') as name:
    print('内容')  # 输出 <div>、内容、</div>
```

**退出逻辑必须放在 `try/finally` 里。** 代码块抛异常时，异常会在 `yield` 处被重新抛进生成器；没有 `try/finally`，`yield` 后面的清理代码根本不会执行：

```python
@contextmanager
def broken():
    print('进入')
    yield
    print('离开')  # 代码块抛异常时不会执行

try:
    with broken():
        raise ValueError('boom')
except ValueError:
    print('捕获')  # 输出：进入，然后捕获
```

生成器必须恰好 `yield` 一次：一次都不 `yield` 会报 `RuntimeError: generator didn't yield`，两次会报 `RuntimeError: generator didn't stop`。把可能失败的初始化放在 `yield` 之前，把清理放在 `finally` 里，是最稳妥的结构。

## 5. 同时管理多个资源

一行写多个 `with`，进入顺序从左到右，退出顺序从右到左（后进先出）。这等价于嵌套的 `with`，但层级更浅：

```python
with open('a.txt') as src, open('b.txt', 'w') as dst:
    dst.write(src.read())
```

资源数量在运行时才确定时，用 `contextlib.ExitStack` 动态进入。任何一步失败，已进入的资源都会按 LIFO 顺序退出：

```python
from contextlib import ExitStack

def copy_all(paths, target):
    with ExitStack() as stack:
        files = [stack.enter_context(open(p, encoding='utf-8')) for p in paths]
        with open(target, 'w', encoding='utf-8') as out:
            for f in files:
                out.write(f.read())
```

`stack.callback(func, *args)` 还能注册任意清理函数，同样逆序执行。`ExitStack` 是一次性的：离开 `with` 后不能再 `enter_context`。

## 6. contextlib 工具箱

[width(30,70)]

| 工具                    | 用途                                                              |
| :---------------------- | :---------------------------------------------------------------- |
| `suppress(*exceptions)` | 忽略指定异常，相当于只针对这些类型的 `try/except: pass`。         |
| `closing(obj)`          | 退出时调用 `obj.close()`，适合有 `close()` 但没有 `with` 的对象。 |
| `nullcontext(value)`    | 什么都不做的上下文管理器，用于可选资源的占位。                    |

```python
import os
from contextlib import suppress

with suppress(FileNotFoundError):
    os.remove('missing.txt')
print('继续执行')  # 文件不存在也不会中断
```

```python
from contextlib import closing

class Connection:
    def __init__(self):
        self.opened = True
    def close(self):
        self.opened = False

conn = Connection()
with closing(conn):
    print(conn.opened)  # True
print(conn.opened)  # False
```

`nullcontext` 适合“有时需要锁、有时不需要”这类可选场景，避免写两套代码：`cm = lock if lock else nullcontext()`，之后统一 `with cm:` 即可。

## 7. 异常语义、异步与陷阱

`__exit__` 返回 `True` 会静默吞掉异常，调用方完全不知道出过错。下面的代码执行完会打印“继续”，`ValueError` 消失得无影无踪：

```python
class Swallow:
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc, tb):
        return True

with Swallow():
    raise ValueError('看不见')
print('继续')
```

只在你**明确要抑制**某类异常时返回 `True`，并且尽量收窄条件，例如 `return exc_type is FileNotFoundError`。清理逻辑本身抛出的异常会替换原异常，原异常挂在 `__context__` 上。

**在 `__init__` 里做可能失败的操作。** 如果构造函数打开文件、连数据库，失败时对象没有构造完成，`__exit__` 不会被调用；如果前面已经打开了别的资源，就会泄漏。正确做法是构造函数只保存配置，获取资源放到 `__enter__`。

**复用已经退出的上下文管理器。** 生成器版上下文管理器只能进入一次，第二次进入时生成器已耗尽：

```python
from contextlib import contextmanager

@contextmanager
def once():
    yield

cm = once()
with cm:
    pass
with cm:
    pass  # 第二次进入会报错（3.12 下是 AttributeError）
```

需要反复使用时，每次新建一个上下文管理器对象，而不是复用一个实例。

**异步上下文管理器。** `async with` 要求对象实现 `__aenter__` / `__aexit__`，两者都是协程，内部可以 `await`；也可以用 `contextlib.asynccontextmanager` 装饰异步生成器：

```python
import asyncio
from contextlib import asynccontextmanager

@asynccontextmanager
async def resource():
    await asyncio.sleep(0)
    yield 'res'

async def main():
    async with resource() as value:
        print(value)  # res

asyncio.run(main())
```

## 8. 小结

[width(22,78)]

| 关键点     | 说明                                                                  |
| :--------- | :-------------------------------------------------------------------- |
| 价值       | 确定性清理：正常结束和异常退出都执行 `__exit__`。                     |
| 协议       | `__enter__` 返回值给 `as`；`__exit__` 返回 `True` 才吞异常。          |
| 类实现     | `__init__` 只存配置，资源在 `__enter__` 获取，`__exit__` 释放。       |
| 生成器实现 | `@contextmanager`，`yield` 前进入，`yield` 后清理，清理放 `finally`。 |
| 多资源     | 一行多个 `with` 或 `ExitStack`，退出顺序 LIFO。                       |
| 工具箱     | `suppress` 忽略指定异常，`closing` 调 `close()`，`nullcontext` 占位。 |
| 异步       | `async with` 需要 `__aenter__` / `__aexit__`。                        |

**一句话理解**：上下文管理器把“进入时准备、离开时收尾”写进对象协议，`with` 负责保证收尾一定发生；真正要守住的两条底线是——清理逻辑别吞异常，获取资源别放在 `__init__`。

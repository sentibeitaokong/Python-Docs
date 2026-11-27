---
outline: [2, 3]
---

# 装饰器 (Decorators)

装饰器是“接收函数、返回新函数”的高阶函数，`@` 只是它的语法糖。它让你在不改动原函数代码的前提下，加上计时、日志、缓存、权限等横切逻辑。

> [!TIP] 相关阅读
> 装饰器依赖闭包保存原函数和配置，先看 [作用域与闭包](/pythonBasics/functions/closures)；被装饰函数的参数写法见 [函数基础与参数模型](/pythonBasics/functions/functionBasics)；类方法上的装饰器涉及 [类与实例](/pythonBasics/oop/classesAndInstances)；属性装饰器见 [属性与描述符](/pythonBasics/oop/propertiesAndDescriptors)。

## 1. 本质与等价写法

装饰器是一个可调用对象，它接收被装饰的函数，返回一个替代函数。`@decorator` 放在 `def` 上方，等价于在函数定义之后执行 `func = decorator(func)`。

```python
def announce(func):
    def wrapper():
        print(f'调用 {func.__name__}')
        return func()
    return wrapper

def hello():
    return 'hello'

hello = announce(hello)
print(hello())  # 先打印“调用 hello”，再打印 hello
```

[width(36,64)]

| 写法                            | 等价于                    |
| :------------------------------ | :------------------------ |
| `@deco` 加在 `def f` 上方       | `f = deco(f)`             |
| `@a` 在 `@b` 上方               | `f = a(b(f))`，`b` 先应用 |
| `@deco(args)` 加在 `def f` 上方 | `f = deco(args)(f)`       |

关键点：装饰器在**函数定义时**执行（模块级函数就是导入时）；包装函数 `wrapper` 才是每次调用时执行的部分。这个区别决定了副作用该放在哪一层。

## 2. 最简装饰器与 functools.wraps

最简装饰器就是一个返回 `wrapper` 的函数，最常见的用途是日志和调用追踪。`wrapper` 用 `*args, **kwargs` 接收任意参数，再原样转给原函数，这样同一个装饰器既能装饰无参函数，也能装饰带参函数。

```python
import functools

def logged(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print(f'调用 {func.__name__}{args}')
        return func(*args, **kwargs)
    return wrapper

@logged
def add(a, b):
    """返回两数之和。"""
    return a + b

print(add(1, 2))              # 调用 add(1, 2) 换行 3
print(add.__name__)           # add
print(add.__doc__)            # 返回两数之和。
```

去掉 `@functools.wraps(func)`，`add.__name__` 会变成 `wrapper`，`__doc__` 会变成 `None`。`wraps` 复制 `__module__`、`__name__`、`__qualname__`、`__doc__`、`__dict__`，并设置 `__wrapped__` 指回原函数；`inspect.signature()` 会顺着 `__wrapped__` 找到真实签名。

> [!WARNING]
> 忘记 `wraps` 不只是“名字不好看”。依赖签名或注解的框架（FastAPI、pytest fixture、`functools.singledispatch`）会因此拿不到真实参数，报错往往离装饰器很远。

## 3. 带参数的装饰器

装饰器本身要接收参数时，需要多一层函数：最外层收配置，中间层收被装饰的函数，最内层是真正的包装函数。

```python
import functools
import time

def retry(times=3, delay=0.1):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except Exception:
                    if attempt == times:
                        raise
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(times=2, delay=0)
def unstable():
    print('尝试一次')
    raise ValueError('失败')

# unstable()  # 打印两次“尝试一次”，然后抛出 ValueError
```

调用链是 `retry(times=2, delay=0)` 先返回 `decorator`，`decorator(unstable)` 再返回 `wrapper`。写成 `@retry` 而不加括号，`unstable` 会被当成 `times` 传进去，函数名随即被替换成 `decorator`，调用时会报参数错误。

`@decorator` 与 `@decorator()` 是两种不同形态：前者直接装饰，后者先调用工厂再装饰。设计 API 时要明确选一种，不要指望同一个装饰器两种都能用。

## 4. 叠加顺序、类装饰器与方法

多个装饰器从下往上应用，从上往下执行。下面的 `text` 先被 `wrap('i')` 包一层，再被 `wrap('b')` 包一层，所以输出是粗体在外、斜体在内：

```python
def wrap(tag):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return f'<{tag}>{func(*args, **kwargs)}</{tag}>'
        return wrapper
    return decorator

@wrap('b')
@wrap('i')
def text():
    return 'hi'

print(text())  # <b><i>hi</i></b>
```

装饰方法时，`wrapper` 的第一个参数是 `self`。如果写成 `def wrapper(self, *args, **kwargs)`，就只能装饰实例方法；写成 `def wrapper(*args, **kwargs)` 更通用，但可读性稍差。

```python
def log_call(func):
    @functools.wraps(func)
    def wrapper(self, *args, **kwargs):
        print(f'{type(self).__name__}.{func.__name__}')
        return func(self, *args, **kwargs)
    return wrapper

class Service:
    @log_call
    def run(self, task):
        return f'run {task}'

print(Service().run('sync'))  # 先打印 Service.run，再打印 run sync
```

类也可以被装饰：类装饰器接收类对象，修改后返回它。常见用途是注册、补充方法或校验接口。

```python
REGISTRY = {}

def register(cls):
    REGISTRY[cls.__name__] = cls
    return cls

@register
class JSONParser:
    pass

print(list(REGISTRY))  # ['JSONParser']
```

## 5. 常见实战

**计时**：用 `try/finally` 保证函数抛异常时也能记录耗时，同时不要吞掉异常。

```python
import functools
import time

def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            elapsed = time.perf_counter() - start
            print(f'{func.__name__} 耗时 {elapsed:.4f}s')
    return wrapper

@timer
def work():
    return sum(range(100_000))

print(work())
```

**缓存**：`functools.lru_cache` 按参数缓存返回值，`functools.cache`（3.9+）是不限容量的简写。参数必须可哈希；装饰实例方法时缓存会持有 `self`，长生命周期的对象容易泄漏内存。

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(40))                # 102334155
print(fib.cache_info().hits)  # 大于 0，说明命中过缓存
```

**权限校验**：把角色或权限名作为装饰器参数，在调用原函数之前检查，不通过就抛异常。

```python
def require(role):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(user, *args, **kwargs):
            if role not in user['roles']:
                raise PermissionError(f'需要 {role} 权限')
            return func(user, *args, **kwargs)
        return wrapper
    return decorator

@require('admin')
def delete(user, item_id):
    return f'删除 {item_id}'

print(delete({'roles': {'admin'}}, 7))  # 删除 7
# delete({'roles': {'guest'}}, 7)      # PermissionError
```

参数校验也是同样的位置：在调用原函数前检查 `args` / `kwargs`，不合法就抛 `ValueError` 或 `TypeError`。校验逻辑要尽量简单，复杂的业务校验更适合放在函数体内或单独的校验层。

## 6. 签名与内置装饰器

`functools.wraps` 保留了 `__wrapped__`，所以 `inspect.signature(add)` 仍然显示 `(a, b)`，而不是 `(*args, **kwargs)`。这对自动生成文档、依赖注入、参数校验都至关重要；如果确实要修改签名，可以用 `functools.wraps` 之后再显式设置 `__signature__`。

[width(21,43,36)]

| 装饰器          | 作用                                   | 说明                                                              |
| :-------------- | :------------------------------------- | :---------------------------------------------------------------- |
| `@staticmethod` | 定义静态方法，不接收 `self` 或 `cls`。 | 逻辑上属于类，但不访问实例状态。                                  |
| `@classmethod`  | 第一个参数是 `cls`，常用于替代构造器。 | `cls(...)` 可让子类返回自己的实例。                               |
| `@property`     | 把方法变成属性访问。                   | 详见 [属性与描述符](/pythonBasics/oop/propertiesAndDescriptors)。 |

`functools.singledispatch` 按第一个参数的类型分派，避免写一长串 `isinstance`：

```python
from functools import singledispatch

@singledispatch
def render(value):
    return str(value)

@render.register
def _(value: int):
    return f'整数 {value}'

@render.register
def _(value: list):
    return '[' + ', '.join(map(str, value)) + ']'

print(render(3), render([1, 2]), render('x'))  # 整数 3 [1, 2] x
```

## 7. 异步装饰器与常见陷阱

装饰 `async def` 函数时，包装函数也必须是 `async def` 并且 `await` 原函数。如果 wrapper 是普通函数，它返回的是协程对象，调用方拿到后还得再 await，语义就乱了。

```python
def async_timer(func):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return await func(*args, **kwargs)
        finally:
            print(f'{func.__name__} 耗时 {time.perf_counter() - start:.4f}s')
    return wrapper
```

**忘记 `wraps`**：元数据和签名丢失，调试和框架集成都受影响。**参数化装饰器少写一层**：`@retry` 与 `@retry()` 选错，错误会延迟到调用时才暴露。**在装饰器里吞异常**：下面这种写法让调用方无法区分“失败”和“合法返回 None”，排障时非常痛苦。

```python
def safe(func):
    @functools.wraps(func)
    def wrapper(*a, **kw):
        try:
            return func(*a, **kw)
        except Exception:
            return None  # 静默失败，调用方无从判断
    return wrapper
```

**装饰器在导入时执行**：模块级装饰器的函数体（不是 wrapper）在导入时就运行，别在里面读文件、连数据库、发网络请求。需要初始化时，把动作推迟到 wrapper 的第一次调用，或用显式的 `setup()`。

> [!NOTE]
> 多个装饰器叠加时，顺序会改变语义。例如 `@lru_cache` 放在 `@retry` 外面，缓存命中时不会重试；放在里面，每次重试都会经过缓存。写之前先想清楚“谁包谁”。

## 8. 小结

[width(22,78)]

| 关键点   | 说明                                                             |
| :------- | :--------------------------------------------------------------- |
| 本质     | 接收函数、返回函数的高阶函数；`@deco` 等价于 `f = deco(f)`。     |
| 元数据   | 一律加 `@functools.wraps(func)`，保留名字、文档和签名。          |
| 带参数   | 三层结构：配置层 → 装饰器层 → wrapper 层。                       |
| 叠加顺序 | 从下往上应用，从上往下执行。                                     |
| 实战     | 计时用 `try/finally`，缓存用 `lru_cache`，权限和校验在调用前做。 |
| 异步     | 装饰 `async def` 时 wrapper 也要 `async` 并 `await`。            |
| 常见错误 | 忘 `wraps`、少一层、吞异常、导入时做重活。                       |

**一句话理解**：装饰器就是把原函数塞进闭包再返回一个同签名的新函数，`@` 只是让这件事看起来像声明；真正要小心的是元数据、层次和异常传播。

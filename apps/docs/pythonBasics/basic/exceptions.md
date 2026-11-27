---
outline: [2, 3]
---

# 异常处理 (Exceptions)

异常是 Python 报告错误的统一机制：出错时抛出，调用栈逐层向上找处理器，没人接就终止程序并打印 traceback。这一页讲清 `try/except/else/finally` 的执行顺序、该捕获什么、如何保留原始错误，以及 3.11 的异常组。

> [!TIP] 相关阅读
> 异常的来源之一是类型转换失败，见 [数据类型](/pythonBasics/basic/dataTypes)；条件分支与循环见 [运算符与流程控制](/pythonBasics/basic/operatorsAndControlFlow)；资源清理通常用上下文管理器；跨模块定义异常基类见 [模块与包](/pythonBasics/basic/modulesAndPackages)。

## 1. 异常层次结构

所有异常都继承自 `BaseException`。日常业务只该捕获 `Exception` 及其子类；`SystemExit`、`KeyboardInterrupt`、`GeneratorExit` 是“让程序退出/中断”的信号，不应该被业务代码吞掉。

```text
BaseException
├── SystemExit
├── KeyboardInterrupt
├── GeneratorExit
└── Exception
    ├── ArithmeticError
    │   ├── ZeroDivisionError
    │   └── OverflowError
    ├── LookupError
    │   ├── IndexError
    │   └── KeyError
    ├── ValueError
    │   └── UnicodeError（含 UnicodeDecodeError / UnicodeEncodeError）
    ├── TypeError
    ├── NameError
    ├── AttributeError
    ├── OSError
    │   ├── FileNotFoundError
    │   └── PermissionError
    ├── RuntimeError
    │   └── RecursionError
    ├── StopIteration
    ├── ImportError
    │   └── ModuleNotFoundError
    └── AssertionError
```

`BaseExceptionGroup` 和 `ExceptionGroup` 是 3.11 新增的分支，见第 7 节。

## 2. try/except/else/finally 的执行顺序

四个子句的分工：

[width(16,84)]

| 子句      | 何时执行                                                                  |
| :-------- | :------------------------------------------------------------------------ |
| `try`     | 总是先执行；其中抛出的异常进入匹配流程。                                  |
| `except`  | `try` 中抛出且类型匹配时执行；按书写顺序匹配，命中一个即止。              |
| `else`    | `try` **正常走完**、没有异常、也没有 `return`/`break`/`continue` 时执行。 |
| `finally` | 无论是否异常、是否 `return`，都执行；用于清理资源。                       |

```python
try:
    print('1 try')
except ValueError:
    print('2 except')
else:
    print('3 else')      # 没有异常才执行
finally:
    print('4 finally')   # 无论如何都执行

# 输出：1 try / 3 else / 4 finally
```

`finally` 在 `return` 时也会执行，而且如果 `finally` 里自己 `return`，会覆盖原来的返回值并吞掉异常——这是明确的反模式：

```python
def read_flag():
    try:
        return 'try 的返回值'
    finally:
        print('finally 仍会执行')


print(read_flag())  # 先打印 finally，再输出 try 的返回值
```

> [!WARNING]
> `else` 中抛出的异常**不会**被同一个 `try` 的 `except` 捕获，它只会走 `finally` 然后继续向上冒泡。不要把可能失败的逻辑塞进 `else` 还指望前面的 `except` 兜底。

资源清理优先用 `with`，它等价于精心写好的 `try/finally`，而且能正确处理多个资源：

```python
with open('data.txt', encoding='utf-8') as f:
    content = f.read()
# 离开 with 时自动关闭文件，即使 read 抛异常
```

## 3. 捕获的粒度

### 3.1 捕获具体异常

`except` 后面写异常类，匹配该类及其子类。多个类型用元组；从上到下匹配，所以子类要写在父类前面。

```python
try:
    value = int(user_input)
except (ValueError, TypeError) as e:
    print(f'输入不合法：{e}')
```

裸 `except:` 会捕获包括 `KeyboardInterrupt` 在内的所有 `BaseException`，几乎总是错的。至少限定为 `except Exception:`；更好的做法是列出你真正能处理的类型。

```python
try:
    int('abc')
except Exception as e:  # 兜底也要记录，不要静默 pass
    print(f'记录错误：{e}')
    raise
```

### 3.2 as e 的作用域

`except ... as e` 里的名字在块结束时会被删除，避免异常对象和 traceback 形成引用环：

```python
try:
    1 / 0
except ZeroDivisionError as e:
    saved = e

# print(e)  # NameError: name 'e' is not defined
print(saved)  # 仍然可以访问
```

不要在 `except` 里 `pass` 了事。要么恢复到一个明确状态，要么补充上下文后重新抛出，要么在最外层记录日志。捕获了却什么都不做，会让真正的 bug 变成“程序静默给出了错误结果”。

## 4. raise 与异常链

`raise` 主动抛出异常；在 `except` 块里写裸 `raise` 表示重新抛出当前异常，保留原始 traceback。

```python
def parse_port(text):
    try:
        port = int(text)
    except ValueError as e:
        raise ValueError(f'端口必须是整数：{text!r}') from e
    if not 0 < port < 65536:
        raise ValueError(f'端口超出范围：{port}')
    return port
```

`raise ... from e` 建立**显式因果链**，新异常的 `__cause__` 指向 `e`，traceback 会显示 “The above exception was the direct cause...”。不写 `from` 时，在 `except` 里抛出的新异常会自动把原异常放进 `__context__`，显示为 “During handling of the above exception...”。

```python
try:
    {}['missing']
except KeyError:
    raise RuntimeError('配置读取失败')  # __context__ 自动指向 KeyError

# 想刻意隐藏原异常时
try:
    int('x')
except ValueError:
    raise RuntimeError('解析失败') from None  # 设置 __suppress_context__
```

包装底层异常时优先用 `from e`：调用方既能看到你补充的业务语义，也能顺着链看到根因。`from None` 只适合原异常纯属实现细节、暴露出来只会干扰排查的场合。

## 5. 自定义异常

自定义异常让调用方按业务语义捕获，而不是靠解析错误消息。继承 `Exception`（或项目自己的基类），不要继承 `BaseException`。

```python
class AppError(Exception):
    """应用异常基类，便于统一捕获。"""


class ValidationError(AppError):
    def __init__(self, field, message):
        super().__init__(f'{field}: {message}')
        self.field = field


try:
    raise ValidationError('email', '格式不正确')
except AppError as e:
    print(e)          # email: 格式不正确
    print(e.field)    # email
```

约定：

- 一个项目一个基类（如 `AppError`），业务异常都继承它，边界处只捕获基类即可。
- 异常类名以 `Error` 结尾，消息写“发生了什么 + 关键上下文”，不要只写“失败”。
- 需要携带结构化信息（字段名、错误码）时，在 `__init__` 里保存属性，但记得调用 `super().__init__(message)`。
- 不要用异常做普通控制流；能用返回值表达的“未找到”，优先 `None` 或 `dict.get()`。

## 6. EAFP、assert 与 warnings

### 6.1 EAFP 与 LBYL

LBYL（Look Before You Leap）先检查再操作；EAFP（Easier to Ask Forgiveness than Permission）先做，出错再处理。Python 社区总体偏 EAFP，因为检查和使用之间可能存在竞态，而且鸭子类型下“能不能用”很难提前枚举。

```python
d = {'a': 1}

# LBYL：检查与使用是两步
if 'b' in d:
    value = d['b']
else:
    value = 0

# EAFP：直接尝试
try:
    value = d['b']
except KeyError:
    value = 0

# 这个场景其实有更简单的写法
value = d.get('b', 0)
```

文件操作是 EAFP 的典型：先 `os.path.exists()` 再 `open()` 仍可能在两步之间被删掉，不如直接 `open()` 并捕获 `FileNotFoundError`。反过来，如果检查很便宜、失败很常见（比如参数校验），LBYL 更直观。

捕获的原则：**只有当你确实能处理、能恢复、或能补充上下文时才捕获**；否则让它冒泡到知道怎么处理的层。最外层（CLI、Web 请求入口、任务调度器）负责记录日志并转成用户可读的错误。

### 6.2 assert 只用于内部不变量

`assert 条件, 消息` 在条件为假时抛 `AssertionError`。它面向“程序员认为不可能发生”的内部一致性检查，不适合校验用户输入或做安全检查：

```python
def average(nums):
    assert nums, 'nums 不能为空'  # 内部调用约定
    return sum(nums) / len(nums)
```

`python -O` 会移除所有 `assert`，依赖它做业务校验会在优化模式下失效。外部输入请显式判断并抛 `ValueError`。

### 6.3 warnings

`warnings` 用来提示“还能用但将来会变”的情况，不中断程序：

```python
import warnings

warnings.warn('old_api 即将废弃，请改用 new_api', DeprecationWarning, stacklevel=2)
```

`stacklevel=2` 让警告指向调用方而不是库内部。测试里常用 `warnings.filterwarnings('error', category=DeprecationWarning)` 把特定警告升级为异常，提前发现依赖的废弃接口。

## 7. 内置异常速查与异常组

### 7.1 常见内置异常

[width(27,24,49)]

| 异常                  | 典型触发场景                      | 处理建议                              |
| :-------------------- | :-------------------------------- | :------------------------------------ |
| `ValueError`          | 类型对但值不合法，如 `int('abc')` | 校验输入，给出可读提示。              |
| `TypeError`           | 类型不支持该操作，如 `'a' + 1`    | 修代码或显式转换，通常不捕获。        |
| `KeyError`            | 字典键不存在                      | 用 `get()`/`setdefault()` 或捕获。    |
| `IndexError`          | 序列下标越界                      | 先判长度或用切片。                    |
| `AttributeError`      | 对象没有该属性                    | 检查对象类型，或用 `getattr` 默认值。 |
| `FileNotFoundError`   | 文件或目录不存在                  | 捕获后提示路径或创建默认文件。        |
| `ZeroDivisionError`   | 除数为零                          | 运算前判断，或按业务定义零值。        |
| `ModuleNotFoundError` | 导入的模块不存在                  | 检查依赖安装与虚拟环境。              |
| `UnicodeDecodeError`  | 用错编码解码字节                  | 确认编码，必要时指定 `errors`。       |
| `AssertionError`      | `assert` 失败                     | 内部 bug，修复不变量。                |

### 7.2 异常组与 except*（3.11+）

并发任务或批量校验可能同时产生多个独立错误。3.11 用 `ExceptionGroup` 把它们打包，用 `except*` 按类型拆分处理：

```python
try:
    raise ExceptionGroup(
        '批量处理失败',
        [ValueError('第一项不合法'), TypeError('第二项类型错误')],
    )
except* ValueError as eg:
    print('值错误', len(eg.exceptions))  # 值错误 1
except* TypeError as eg:
    print('类型错误', len(eg.exceptions))  # 类型错误 1
```

`except*` 会把组里匹配该类型的子异常取出来处理，剩余的继续匹配后面的分支；没被处理的会重新组合并向外抛出。同一个 `try` 里不能混用 `except` 和 `except*`。`asyncio.TaskGroup` 在子任务失败时就抛 `ExceptionGroup`，这是它最常见的来源。

## 8. 小结

[width(22,78)]

| 关键点     | 说明                                                                     |
| :--------- | :----------------------------------------------------------------------- |
| 层次       | 业务只捕获 `Exception` 及子类；`KeyboardInterrupt`/`SystemExit` 应放行。 |
| 执行顺序   | `try` → `except` 或 `else` → `finally`；`finally` 必执行。               |
| 捕获粒度   | 捕获具体类型，多个用元组；避免裸 `except` 和静默 `pass`。                |
| 异常链     | 包装时用 `raise ... from e` 保留根因；`from None` 仅在确需隐藏时用。     |
| 自定义异常 | 继承项目基类，携带结构化属性，消息写清上下文。                           |
| EAFP       | 能处理才捕获；文件、字典等优先“先做再兜底”，外部输入显式校验。           |
| 异常组     | 3.11+ 用 `ExceptionGroup` + `except*` 处理批量/并发错误。                |

**一句话理解**：异常处理的目标不是“让程序不崩”，而是让错误在正确的层被正确的人处理——捕获要具体，包装要保留因果，清理放 `finally` 或 `with`。

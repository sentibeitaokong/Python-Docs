---
outline: [2, 3]
---

# 模块与包 (Modules and Packages)

一个 `.py` 文件就是一个模块，一个带 `__init__.py` 的目录就是一个包。`import` 把代码拆成可复用的命名空间，也带来了搜索路径、相对导入、循环导入这些工程问题。这一页从单文件模块讲到 `src` 布局、打包和虚拟环境。

> [!TIP] 相关阅读
> 模块里的顶层代码与名字绑定见 [语法与变量](/pythonBasics/basic/syntaxAndVariables)；导入失败会抛异常，见 [异常处理](/pythonBasics/basic/exceptions)；包内的类与命名空间见 [类与实例](/pythonBasics/oop/classesAndInstances)。

## 1. 模块与 import 的几种写法

模块是 Python 的代码复用单位。导入时解释器执行模块顶层代码，把结果放进一个独立的命名空间；模块对象缓存在 `sys.modules`，同一进程里重复 `import` 不会再次执行。

[width(30,24,46)]

| 写法                    | 绑定到当前命名空间 | 说明                                     |
| :---------------------- | :----------------- | :--------------------------------------- |
| `import math`           | `math`             | 通过 `math.sqrt` 访问，命名冲突最少。    |
| `import numpy as np`    | `np`               | 起别名，长模块名常用。                   |
| `from math import sqrt` | `sqrt`             | 直接把名字拿进来，短但可能撞名。         |
| `from math import *`    | 所有公开名字       | 污染命名空间，只适合交互式探索。         |
| `import pkg.sub`        | `pkg`              | 需要再写 `pkg.sub`；子模块不会单独绑定。 |
| `import pkg.sub as sub` | `sub`              | 直接绑定子模块。                         |

```python
import math
from pathlib import Path
import json as js

print(math.sqrt(16))          # 4.0
print(Path('a.txt').suffix)   # .txt
print(js.dumps({'a': 1}))     # {"a": 1}
```

`from module import name` 会把名字**复制**到当前命名空间。之后模块内部重新绑定同名对象，不会影响已经导入的名字；但导入的是可变对象时，双方仍共享同一个对象。

```python
import math
from math import sqrt

math.sqrt = lambda x: -1  # 修改模块属性
print(sqrt(4))            # 2.0，from 导入早已绑定原函数
```

> [!WARNING]
> `from x import *` 会跳过以下划线开头的名字（除非 `__all__` 显式包含），但你无法一眼看出某个名字来自哪里。生产代码里禁用星号导入。

## 2. 包、搜索路径与 `__pycache__`

包是带 `__init__.py` 的目录，可以嵌套子包。`__init__.py` 在包第一次被导入时执行，常用来做初始化或导出公开 API；空的也可以。没有 `__init__.py` 的目录在 Python 3 中可能被当作“命名空间包”，但常规项目建议保留该文件，行为更可预期。

```text
shop/
├── __init__.py
├── models.py
├── cli.py
└── utils/
    ├── __init__.py
    └── money.py
```

导入时，Python 按 `sys.path` 的顺序查找模块。列表通常包括：脚本所在目录（`python script.py`）或当前目录（`python -m`）、`PYTHONPATH` 中的目录、标准库、`site-packages`。

```python
import sys

print(sys.path[0])  # 通常是最先搜索的目录
print(sys.modules['sys'] is sys)  # True，模块只加载一次
```

不要把项目路径硬编码进 `sys.path`。更稳的做法是从项目根目录运行 `python -m shop.cli`，或把包安装进当前环境（`pip install -e .`），让导入走正常的包解析。

`__pycache__/` 存放编译后的 `.pyc` 字节码，按解释器版本区分。它可以安全删除，下次运行会自动重建；设置环境变量 `PYTHONDONTWRITEBYTECODE=1` 或运行 `python -B` 可以禁用生成。不要把 `__pycache__` 提交到版本库。

## 3. `__name__` 与主程序入口

每个模块都有 `__name__`。被别的模块导入时，它是模块的点分全名（如 `shop.models`）；被直接运行时，它是字符串 `'__main__'`。

```python
# greet.py
def main():
    print('hello from greet')


if __name__ == '__main__':
    main()
```

直接 `python greet.py` 会打印；`import greet` 只定义函数，不会产生副作用。顶层代码不要放耗时操作或有副作用的逻辑，把它们收进函数并由这个守卫调用。

`python -m shop.cli` 同样把 `shop.cli` 当作 `__main__` 执行，但它会先按包规则导入 `shop`，因此相对导入可用；直接 `python shop/cli.py` 则没有包上下文。这也是“模块化项目优先用 `-m` 启动”的原因。

## 4. 导入的坑：绝对、相对与循环

### 4.1 绝对导入与相对导入

绝对导入从项目根或已安装包的顶层写起，最清晰：

```python
from shop.models import Order
from shop.utils.money import format_price
```

相对导入用前导点表示当前包，两个点表示上一级，只在包内部有效：

```python
# shop/cli.py
from . import models
from .utils.money import format_price
```

相对导入不能用于直接运行的脚本。`python shop/cli.py` 会报 `ImportError: attempted relative import with no known parent package`；改用 `python -m shop.cli`。库代码里两种都常见，应用入口用绝对导入，包内部耦合较紧时用相对导入。

### 4.2 命名冲突与“复制绑定”

```python
from a import process  # 第一个 process
from b import process  # 覆盖前一个，前面的完全丢失

# 解决：模块限定或别名
import a
import b as other
a.process()
other.process()
```

另一个容易忽略的点：`from module import CONFIG` 拿的是当时的值。模块后来执行 `CONFIG = {...}` 重新绑定，导入方仍指向旧对象。需要始终读最新值，就 `import module` 再 `module.CONFIG`。

### 4.3 循环导入

`a.py` 顶层导入 `b`，`b.py` 顶层又导入 `a`，导入到一半的模块还没执行完，另一头就来取名字，于是报 `ImportError: cannot import name ... from partially initialized module ... (most likely due to a circular import)`。

三种常用解法：

1. **抽公共模块**：把双方都依赖的部分移到 `common.py`，让依赖方向变成单向。
2. **延迟导入**：把 `import` 放进函数体，调用时才执行，此时模块已初始化完毕。
3. **只导入模块或仅用于类型**：`import b` 而不是 `from b import X`；类型注解用 `TYPE_CHECKING` 守卫。

```python
# a.py：延迟导入，打破顶层循环
def build():
    from b import helper  # 调用时才导入
    return helper()
```

```python
from typing import TYPE_CHECKING

if TYPE_CHECKING:  # 只给类型检查器看，运行时不导入
    from shop.models import Order


def ship(order: 'Order') -> None:
    ...
```

> [!NOTE]
> 循环导入往往说明模块职责划分有问题。优先调整依赖方向，延迟导入是止血手段，不是长期架构。

## 5. 导出约定：`__all__` 与私有命名

`__all__` 是一个字符串列表，决定 `from module import *` 导出哪些名字，也向读者声明公开 API。它**不阻止**直接访问其他名字。

```python
# shop/utils/money.py
__all__ = ['format_price']


def format_price(amount: int) -> str:
    return f'¥{_round(amount)}'


def _round(amount: int) -> int:  # 单下划线：内部使用
    return round(amount)
```

单下划线前缀是“别在外部依赖我”的约定，星号导入会跳过它；但它仍然可以被显式导入。双下划线在**类**里触发名称改写（name mangling）：`self.__x` 实际存为 `self._ClassName__x`，目的是避免子类意外覆盖，不是访问控制。

包的 `__init__.py` 里也常写 `__all__`，把子模块的公开名字收拢成稳定入口，这样调用方不必知道内部文件结构。

## 6. 工程结构、打包与依赖管理

### 6.1 src 布局

小而简单的项目可以把包放在仓库根目录；需要发布或团队协作时，更推荐 `src` 布局：

```text
myproject/
├── pyproject.toml
├── README.md
├── src/
│   └── mypkg/
│       ├── __init__.py
│       ├── core.py
│       └── cli.py
└── tests/
```

`src` 布局的好处是：不安装就无法从仓库根目录误导入，测试跑的是“安装后的包”，更接近用户环境。

### 6.2 pyproject.toml 与入口点

`pyproject.toml` 是现代 Python 项目的统一配置：构建后端、元数据、依赖、工具配置都在这里。

```text
[build-system]
requires = ["setuptools>=61"]
build-backend = "setuptools.build_meta"

[project]
name = "mypkg"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = ["requests>=2.31"]

[project.optional-dependencies]
dev = ["pytest", "ruff"]

[project.scripts]
mypkg = "mypkg.cli:main"
```

`[project.scripts]` 定义控制台入口点：安装后执行 `mypkg` 命令，等价于调用 `mypkg.cli` 模块里的 `main()`。`pip install -e .` 以可编辑模式安装当前项目，改代码立即生效；`python -m build` 生成可发布的 wheel 和 sdist。

### 6.3 虚拟环境与依赖

每个项目使用独立虚拟环境，避免依赖互相污染：

```bash
python -m venv .venv
source .venv/bin/activate        # Windows 用 .venv\Scripts\activate
python -m pip install --upgrade pip
pip install requests
pip freeze > requirements.txt
pip install -r requirements.txt
pip install -e ".[dev]"          # 安装项目及 dev 可选依赖
deactivate
```

`requirements.txt` 适合锁定完整依赖树，常见于部署；`pyproject.toml` 的 `dependencies` 描述包的兼容范围。两者可以并存：库声明宽松范围，应用用锁文件固定版本。不要把 `.venv` 提交到版本库。

## 7. 标准库模块地图

不必背 API，先记住“哪类问题去哪个模块找”：

[width(15,85)]

| 领域       | 常用模块                                                                   |
| :--------- | :------------------------------------------------------------------------- |
| 系统与路径 | `os`、`sys`、`pathlib`、`shutil`、`glob`、`tempfile`                       |
| 时间日期   | `datetime`、`time`、`zoneinfo`、`calendar`                                 |
| 数据格式   | `json`、`csv`、`tomllib`（3.11+）、`configparser`、`xml.etree.ElementTree` |
| 文本与模式 | `re`、`string`、`textwrap`、`difflib`                                      |
| 容器与算法 | `collections`、`heapq`、`bisect`、`itertools`、`functools`                 |
| 数学与随机 | `math`、`statistics`、`random`、`decimal`、`fractions`                     |
| 并发       | `threading`、`multiprocessing`、`concurrent.futures`、`asyncio`            |
| 网络       | `urllib.request`、`http.client`、`socket`、`ssl`                           |
| 进程与文件 | `subprocess`、`signal`、`io`、`mmap`                                       |
| 日志与调试 | `logging`、`traceback`、`pdb`、`timeit`、`unittest`                        |
| 命令行     | `argparse`、`shlex`、`getopt`                                              |
| 类型与建模 | `typing`、`dataclasses`、`enum`、`abc`、`collections.abc`                  |

第三方库通常在这些标准库之上补足能力：`requests` 替代 `urllib`，`pydantic` 做数据校验，`pytest` 替代 `unittest`。先查标准库，确认不够再引入依赖。

## 8. 小结

[width(22,78)]

| 关键点    | 说明                                                                    |
| :-------- | :---------------------------------------------------------------------- |
| 模块      | 一个 `.py` 文件，拥有独立命名空间；导入后缓存在 `sys.modules`。         |
| 包        | 带 `__init__.py` 的目录；导入时执行 `__init__.py`，可嵌套子包。         |
| 搜索路径  | 按 `sys.path` 查找；优先 `python -m` 或可编辑安装，别硬改 `sys.path`。  |
| 主入口    | `if __name__ == '__main__':` 防止导入时产生副作用。                     |
| 绝对/相对 | 入口用绝对导入；包内部可用相对导入，但不能直接运行该文件。              |
| 循环导入  | 抽公共模块、延迟导入、`TYPE_CHECKING`；根因通常是职责划分。             |
| 导出      | `__all__` 控制星号导出；单下划线是私有约定，双下划线做名称改写。        |
| 工程化    | `src` 布局 + `pyproject.toml` + 虚拟环境 + 入口点，是可发布项目的基线。 |

**一句话理解**：模块是命名空间，包是命名空间的目录树；导入的路径、时机和导出边界想清楚，循环导入和“找不到模块”大多能提前避免。

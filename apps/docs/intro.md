# Python 3 知识体系

这是一份按主题整理的 Python 3 学习文档。内容不追求覆盖语言的全部细节，而是把日常开发最常打交道的语法、容器、对象模型和迭代机制讲清楚：每个结论尽量配可运行的代码，每个选择尽量说明取舍。

站点按模块组织，当前上线的是 **Python 基础语法** 模块，入口见 [语法与变量](/pythonBasics/basic/syntaxAndVariables)。框架、异步、工程实践等内容会作为后续模块加入。

## 1. 推荐阅读顺序

本模块内的四个分类之间有依赖关系，建议按下面的顺序读；已经熟悉的部分可以直接跳到具体页面当手册查。

[width(13,17,17,53)]

| 阶段   | 分类       | 建议入口                                             | 这一阶段解决什么问题                           |
| :----- | :--------- | :--------------------------------------------------- | :--------------------------------------------- |
| 第一步 | 语言基础   | [语法与变量](/pythonBasics/basic/syntaxAndVariables) | 会写、会读 Python 代码，理解名字与对象的关系。 |
| 第二步 | 数据结构   | [列表](/pythonBasics/dataStructures/list)            | 知道什么时候用 list / tuple / dict / set。     |
| 第三步 | 面向对象   | [类与实例](/pythonBasics/oop/classesAndInstances)    | 会用类组织状态与行为，理解 Python 的对象协议。 |
| 第四步 | 函数与迭代 | [函数基础](/pythonBasics/functions/functionBasics)   | 写出可复用、可组合、惰性求值的代码。           |

> [!TIP] 学习方式建议
> 第一遍通读时不必记住所有 API，重点记住“**什么场景该选什么**”。需要查具体方法时，回到对应页面看表格即可。

## 2. 分类导航

### 2.1 Python 语言基础

先把语法骨架和内置类型建立起来，后面的容器、类、函数都建立在这一层之上。

- [语法与变量](/pythonBasics/basic/syntaxAndVariables)：缩进、命名、赋值、名字与对象的绑定关系。
- [数据类型](/pythonBasics/basic/dataTypes)：数值、布尔、字符串、字节串、None，以及可变与不可变。
- [运算符与流程控制](/pythonBasics/basic/operatorsAndControlFlow)：算术、比较、逻辑运算，`if` / `while` / `for` / `match`。
- [字符串](/pythonBasics/basic/strings)：不可变文本、编码解码、常用方法与 f-string 格式化。
- [异常处理](/pythonBasics/basic/exceptions)：`try/except/else/finally`、异常链与自定义异常。
- [模块与包](/pythonBasics/basic/modulesAndPackages)：导入机制、包结构、`__main__`、虚拟环境与依赖管理。

### 2.2 数据结构

Python 的内置容器各有明确的适用场景，选错容器往往是性能问题的根源。

- [列表](/pythonBasics/dataStructures/list)：有序可变序列，按下标访问与尾部增删的主场。
- [元组](/pythonBasics/dataStructures/tuple)：不可变序列，可哈希、可解包，适合表达固定记录。
- [字典](/pythonBasics/dataStructures/dict)：键值映射，平均 $O(1)$ 查找，插入有序。
- [集合](/pythonBasics/dataStructures/set)：去重与成员判断，支持交并差运算。
- [推导式](/pythonBasics/dataStructures/comprehensions)：列表 / 字典 / 集合推导式与生成器表达式。

### 2.3 面向对象

Python 的面向对象比语法层面看到的更深：属性查找、描述符、魔术方法共同构成了对象协议。

- [类与实例](/pythonBasics/oop/classesAndInstances)：类属性与实例属性、`self`、构造与初始化。
- [继承与多态](/pythonBasics/oop/inheritance)：MRO、`super()`、mixin、组合优于继承。
- [魔术方法](/pythonBasics/oop/magicMethods)：容器协议、比较协议、算术协议、属性访问协议。
- [属性管理与描述符](/pythonBasics/oop/propertiesAndDescriptors)：`property`、`classmethod`、描述符协议。
- [抽象基类与协议](/pythonBasics/oop/abcAndProtocols)：ABC、`collections.abc`、`typing.Protocol` 与结构类型。

### 2.4 函数与迭代

函数是 Python 的一等对象；迭代协议则是 `for`、推导式、生成器、`itertools` 共同的底座。

- [函数基础与参数模型](/pythonBasics/functions/functionBasics)：五类参数、仅限位置 / 仅限关键字参数、可变默认值陷阱。
- [作用域与闭包](/pythonBasics/functions/closures)：LEGB、`nonlocal`、闭包捕获变量而非值。
- [装饰器](/pythonBasics/functions/decorators)：高阶函数、`functools.wraps`、带参数装饰器与常见实战。
- [迭代器与可迭代对象](/pythonBasics/functions/iterators)：`__iter__` / `__next__`、`itertools` 常用工具。
- [生成器](/pythonBasics/functions/generators)：`yield`、`send`、`yield from`、生成器管道。
- [上下文管理器](/pythonBasics/functions/contextManagers)：`with` 协议、`contextlib`、`ExitStack`。

## 3. 目录结构

站点按「模块 → 分类 → 页面」三级组织，所有页面放在 `apps/docs` 下：

```text
apps/docs
├── index.md                      # 首页（layout: home）
├── intro.md                      # 本页
├── pythonBasics/                 # 模块：Python 基础语法
│   ├── basic/                    # 分类：语言基础
│   ├── dataStructures/           # 分类：数据结构
│   ├── oop/                      # 分类：面向对象
│   └── functions/                # 分类：函数与迭代
└── ...                           # 后续模块，如 frameworks/、advanced/、practice/
```

## 4. 新增一篇文档

- 在模块对应的分类目录下新建 `.md` 文件，文件名用 camelCase，例如 `apps/docs/pythonBasics/basic/variables.md`。
- 在 `apps/docs/.vitepress/config.mts` 的 `sidebar` 中登记标题和链接 `/pythonBasics/basic/variables`。
- 运行 `pnpm docs:dev` 预览，`pnpm docs:build` 检查构建。

## 5. 可用的 Markdown 能力

[width(23,77)]

| 能力               | 写法                                    |
| :----------------- | :-------------------------------------- |
| 可运行 Python 代码 | 任意 ` ```python ` 代码块               |
| 代码组标签页       | `:::code-group`                         |
| 提示容器           | `::: tip`、`::: warning`、`::: danger`  |
| GitHub 提示块      | `> [!NOTE]`、`> [!TIP]`、`> [!WARNING]` |
| Mermaid 流程图     | ` ```mermaid `                          |
| 任务列表           | `- [ ]`、`- [x]`                        |
| 脚注               | `[^1]`                                  |
| 表格列宽           | AnyBlock 的 `[width(30,70)]`            |

所有 `python` 代码块都会自动渲染成可编辑、可运行的编辑器：点击「运行」后在浏览器里执行，首次需要加载约 12 MB 的 Pyodide 运行时，之后会使用浏览器缓存。`bash`、`text` 等非 Python 代码块保持普通代码展示。

表格列宽会在提交时由 `table-width` 脚本自动测量并回写；文档链接、代码块语法和中文引号由 `docs-check` 在提交前检查。

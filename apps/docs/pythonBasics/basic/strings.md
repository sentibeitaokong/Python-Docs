---
outline: [2, 3]
---

# 字符串 (Strings)

字符串是 Python 里最常用的不可变序列：所有“修改”都会产生新对象，索引和切片按字符而不是字节工作。这一页从字面量、编码讲到方法、f-string 格式化，最后给出清洗、切分、拼接的常用套路和性能取舍。

> [!TIP] 相关阅读
> 字符串与字节的区别在 [数据类型](/pythonBasics/basic/dataTypes) 里有整体视角；索引与切片的通用规则见 [列表](/pythonBasics/dataStructures/list)；正则表达式相关模块见 [模块与包](/pythonBasics/basic/modulesAndPackages)；格式化输出常与 [异常处理](/pythonBasics/basic/exceptions) 一起出现在输入校验里。

## 1. 不可变性与字面量写法

字符串一旦创建就不能改：`s[0] = 'H'` 会抛 `TypeError`，所有方法都返回**新字符串**。这让字符串可以安全地共享、当字典键，也意味着循环里反复拼接要付出额外代价。

```python
s = 'hello'
# s[0] = 'H'  # TypeError: 'str' object does not support item assignment

t = s.upper()  # 新对象，s 本身不变
print(s, t)    # hello HELLO
```

单引号和双引号完全等价，选一种能少转义的即可；三引号保留换行，常用于多行文本和文档字符串。

```python
a = 'single'
b = "it's easier"       # 内容有单引号时用双引号
c = '''第一行
第二行'''
d = """也可用于 docstring"""

print(repr(c))  # '第一行\n第二行'
```

转义序列用反斜杠：`\n` 换行、`\t` 制表、`\\` 反斜杠、`\'` 单引号、`\u4f60` Unicode 码点。原始字符串在引号前加 `r`，反斜杠不再转义，写正则和 Windows 路径很方便；但它不能以奇数个反斜杠结尾。

```python
print('C:\\Users\\Ada')  # C:\Users\Ada
print(r'C:\Users\Ada')   # C:\Users\Ada，原始字符串
print(r'\d+')            # \d+，正则里常用

# 相邻的字面量会自动拼接，只能用于字面量，不能用于变量
message = 'hello ' 'world'
print(message)  # hello world
```

## 2. Unicode 与编码

Python 3 的 `str` 是 Unicode 码点序列，不是字节数组。`len('你好')` 是 2（两个字符），`len('你好'.encode('utf-8'))` 是 6（每个汉字 3 字节）。两者之间必须显式转换：

```python
text = '你好'
raw = text.encode('utf-8')    # b'\xe4\xbd\xa0\xe5\xa5\xbd'
print(len(text), len(raw))    # 2 6
print(raw.decode('utf-8'))    # 你好

print(ord('你'), chr(20320))  # 20320 你
```

编码和解码必须使用同一套编码。用错编码会抛 `UnicodeDecodeError`（解码）或 `UnicodeEncodeError`（编码）；处理不可控数据时可以指定 `errors='replace'` 或 `'ignore'`，但要知道这会丢信息。

```python
try:
    raw.decode('ascii')
except UnicodeDecodeError as e:
    print(type(e).__name__)  # UnicodeDecodeError

print('café'.encode('ascii', errors='replace'))  # b'caf?'
print(b'abc'.decode('utf-8'))  # abc
```

读写文件时显式传 `encoding='utf-8'`，不要依赖操作系统的默认编码；处理带 BOM 的 Windows 文件可以用 `utf-8-sig`。`bytes` 字面量只能写 ASCII，非 ASCII 内容必须 `encode()` 或写转义。

> [!WARNING]
> `str` 和 `bytes` 不能直接拼接或比较：`'a' + b'b'` 会抛 `TypeError`。看到 “can't concat str to bytes” 时，先确认数据在哪一层应该编码或解码。

## 3. 索引、切片与遍历

字符串是序列，支持下标、负下标、切片和成员判断：

```python
s = 'Python'
print(s[0], s[-1])   # P n
print(s[1:4])        # yth，左闭右开
print(s[:3], s[3:])  # Pyt hon
print(s[::2])        # Pto
print(s[::-1])       # nohtyP
print(len(s))        # 6
print('th' in s)     # True，子串判断
```

下标越界抛 `IndexError`，切片越界则自动截断，不会报错。遍历字符串得到的是单个字符：

```python
for i, ch in enumerate('abc', start=1):
    print(i, ch)  # 1 a / 2 b / 3 c
```

`in` 做的是子串查找，复杂度与文本长度相关；需要频繁判断大量候选词时，先把它们放进 `set` 再查。

## 4. 常用方法

[width(32,24,44)]

| 方法                                                  | 作用                              | 示例与结果                                 |
| :---------------------------------------------------- | :-------------------------------- | :----------------------------------------- |
| `strip()` / `lstrip()` / `rstrip()`                   | 去掉两端（或左/右）空白或指定字符 | `'  x  '.strip()` → `'x'`                  |
| `split(sep=None)`                                     | 按分隔符切分，默认按任意空白      | `'a,b'.split(',')` → `['a', 'b']`          |
| `rsplit(sep, maxsplit)`                               | 从右侧开始切分，限制次数          | `'a.b.c'.rsplit('.', 1)` → `['a.b', 'c']`  |
| `splitlines()`                                        | 按换行符切分                      | `'a\nb'.splitlines()` → `['a', 'b']`       |
| `join(iterable)`                                      | 用当前字符串连接可迭代对象        | `','.join(['a', 'b'])` → `'a,b'`           |
| `replace(old, new, count=-1)`                         | 替换子串，count 限制次数          | `'aaa'.replace('a', 'b', 2)` → `'bba'`     |
| `find(sub)` / `rfind(sub)`                            | 返回下标，找不到返回 `-1`         | `'abc'.find('z')` → `-1`                   |
| `index(sub)` / `rindex(sub)`                          | 返回下标，找不到抛 `ValueError`   | `'abc'.index('b')` → `1`                   |
| `startswith(prefix)` / `endswith(suffix)`             | 前后缀判断，可传元组              | `'a.py'.endswith(('.py', '.md'))` → `True` |
| `upper()` / `lower()`                                 | 转大写 / 小写                     | `'Ab'.lower()` → `'ab'`                    |
| `title()`                                             | 每个单词首字母大写                | `'hello world'.title()` → `'Hello World'`  |
| `casefold()`                                          | 更彻底的大小写折叠，适合比较      | `'Straße'.casefold()` → `'strasse'`        |
| `isalpha()` / `isdigit()` / `isalnum()` / `isspace()` | 字符类别判断                      | `'123'.isdigit()` → `True`                 |
| `count(sub)`                                          | 统计子串出现次数                  | `'banana'.count('an')` → `2`               |
| `center(w)` / `ljust(w)` / `rjust(w)`                 | 居中 / 左对齐 / 右对齐            | `'ab'.center(6, '-')` → `'--ab--'`         |
| `zfill(w)`                                            | 左侧补零到指定宽度                | `'42'.zfill(5)` → `'00042'`                |

```python
s = '  Hello, World  '
print(s.strip())                  # Hello, World
print('a,b,,c'.split(','))        # ['a', 'b', '', 'c']
print('a b  c'.split())           # ['a', 'b', 'c']，默认按任意空白且去空项
print(','.join(['a', 'b', 'c']))  # a,b,c
print('hello'.replace('l', 'L'))  # heLLo
print('file.txt'.removesuffix('.txt'))  # file，3.9+
```

`split()` 不传参数和传 `','` 行为不同：不传时连续空白算一个分隔符并丢弃空串；传入分隔符时，连续分隔符会产生空字符串。需要保留空字段就用显式分隔符。

> [!NOTE]
> `title()` 按单词边界转换，`"it's"` 会变成 `"It'S"`，并不适合做标题格式化。大小写不敏感的相等比较用 `casefold()`，不要只用 `lower()`。

## 5. f-string 格式化

f-string 在运行时求值，`{}` 里可以放表达式、方法调用、下标和条件表达式，后面接 `:格式说明符`：

```python
name = 'Ada'
score = 92.456

print(f'{name} 得了 {score:.2f} 分')  # Ada 得了 92.46 分
print(f'{name!r}')                    # 'Ada'，repr 形式
print(f'{name.upper():>8}')           #      ADA
print(f'{"yes" if score > 60 else "no"}')  # yes
```

格式说明符的常用部分：`[填充][对齐][符号][宽度][,][.精度][类型]`。对齐用 `<`（左）、`>`（右）、`^`（居中）、`=`（符号后补零），填充字符写在最前面。

```python
value = 42
print(f'{value:5d}|')      #    42|
print(f'{value:<5d}|')     # 42   |
print(f'{value:05d}')      # 00042
print(f'{value:+d}')       # +42
print(f'{1234567:,}')      # 1,234,567
print(f'{0.256:.1%}')      # 25.6%
print(f'{3.14159:.3f}')    # 3.142
print(f'{"hello":.3}')     # hel，字符串按精度截断
```

`=` 是调试专用写法，会同时打印表达式文本和值，等号两侧的空格原样保留：

```python
x = 3.14159
print(f'{x=}')        # x=3.14159
print(f'{x = :.2f}')  # x = 3.14
```

宽度和精度可以嵌套变量，日期时间也能直接格式化：

```python
from datetime import datetime

width, precision = 8, 3
print(f'{3.14159:{width}.{precision}f}')  #    3.142

dt = datetime(2026, 11, 27, 9, 5)
print(f'{dt:%Y-%m-%d %H:%M}')  # 2026-11-27 09:05
```

需要输出字面量花括号时，在 f-string 里把左右花括号各写两次：

```python
name = 'Ada'
print(f'{{name}}')  # {name}，不会被当成表达式
```

Python 3.12 之前，f-string 表达式里不能出现反斜杠，遇到复杂表达式先算到变量里。

## 6. 旧式格式化

`%` 格式化来自 C 风格，仍在日志和旧代码中大量存在：

```python
name, score = 'Ada', 92.5
print('%s 得了 %.1f 分' % (name, score))  # Ada 得了 92.5 分
print('%(name)s: %(score).1f' % {'name': name, 'score': score})
```

`str.format()` 用位置或名字占位，适合把格式串单独存放：

```python
print('{} 得了 {:.1f} 分'.format(name, score))       # Ada 得了 92.5 分
print('{n} 得了 {s:.1f} 分'.format(n=name, s=score))
print('{0!r}'.format(name))  # 'Ada'
```

新代码优先 f-string：变量就在眼前，可读性最好，也少了位置参数错位的风险。例外是日志：`logger.info('user %s', name)` 用 `%` 风格是**惰性**的，只有日志级别开启时才格式化；写成 f-string 会提前求值，白白消耗性能。

## 7. 文本处理套路与性能

### 7.1 清洗与归一化

```python
raw = '  Hello,   WORLD!  '

cleaned = raw.strip()                 # 去两端空白
normalized = ' '.join(cleaned.split())  # 连续空白压成一个空格
print(normalized)                     # Hello, WORLD!

key = normalized.casefold()           # 比较用的归一化
print(key == 'hello, world!')         # True

# 去掉标点：str.translate 比逐个 replace 快
table = str.maketrans('', '', '!,')
print(normalized.translate(table))    # Hello WORLD
```

切分与拼接是文本处理的主线：`split` 把文本变成列表，处理完再用 `join` 拼回去。解析结构化文本时优先用 `csv`、`json` 或正则，而不是手写多层 `split`。

### 7.2 循环拼接的性能

字符串不可变，循环里 `s += piece` 每次都可能新建对象，长度一大就是 $O(n^2)$ 的搬运：

```python
# 不推荐：大量小块拼接
result = ''
for i in range(10000):
    result += str(i)

# 推荐：先收集，再统一 join
parts = [str(i) for i in range(10000)]
result = ''.join(parts)
```

CPython 对“引用计数为 1 的字符串 +=”有局部优化，某些写法看起来不慢，但这是实现细节，换解释器或换上下文就失效。跨实现稳定的写法是 `''.join()`。

> [!TIP]
> `join` 只接受字符串元素。混合类型先转换：`','.join(map(str, numbers))`；生成器也可以直接传，`join` 会在内部物化。

## 8. 小结

[width(13,87)]

| 关键点   | 说明                                                                            |
| :------- | :------------------------------------------------------------------------------ |
| 不可变   | 所有“修改”都返回新字符串；共享安全，但循环拼接要付费。                          |
| 字面量   | 单双引号等价，三引号保留换行，`r''` 关闭转义，相邻字面量自动拼接。              |
| 编码     | `str` 是 Unicode 码点，`bytes` 是字节；跨边界必须 `encode()`/`decode()`。       |
| 序列操作 | 下标、切片、`len()`、`in`、遍历都按字符工作；切片越界不报错。                   |
| 常用方法 | 清洗 `strip`、切分 `split`、拼接 `join`、查找 `find`/`index`、归一 `casefold`。 |
| f-string | 表达式 + 格式说明符；宽度/对齐/精度/千分位/百分比/日期都能直接写。              |
| 性能     | 大量拼接用 `''.join()`，不要依赖 CPython 对 `+=` 的局部优化。                   |

**一句话理解**：把字符串当成“只读的字符序列”，转换边界用 `encode`/`decode`，批量拼接用 `join`，格式化优先 f-string，绝大多数文本处理就顺了。

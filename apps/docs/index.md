---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
hero:
  name: 'Python 3'
  text: '知识体系与学习笔记'
  tagline: 从语言基础、数据结构、面向对象到函数与迭代，整理一份可检索的 Python 3 文档。
  image:
    src: /img/xunbei.svg
    alt: Python Docs
  actions:
    - theme: brand
      text: 开始阅读
      link: /intro

features:
  - title: 语言基础
    details: 语法与变量、数据类型、运算符、流程控制、字符串、异常与模块。
    link: /pythonBasics/basic/syntaxAndVariables

  - title: 数据结构
    details: 列表、元组、字典、集合与推导式，含复杂度与底层实现。
    link: /pythonBasics/dataStructures/list

  - title: 面向对象
    details: 类与实例、继承与多态、魔术方法、属性描述符与抽象基类。
    link: /pythonBasics/oop/classesAndInstances

  - title: 函数与迭代
    details: 参数模型、闭包、装饰器、迭代器、生成器与上下文管理器。
    link: /pythonBasics/functions/functionBasics

  - title: 字符串与文本
    details: 不可变字符串、编码解码、格式化与常用文本处理方法。
    link: /pythonBasics/basic/strings

  - title: 异常与模块化
    details: 异常捕获与自定义异常、模块导入、包组织与虚拟环境。
    link: /pythonBasics/basic/exceptions
---

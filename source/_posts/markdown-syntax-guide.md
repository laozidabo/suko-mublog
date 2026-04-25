---
title: Markdown 语法测试
date: 2025-03-15 10:00:00
tags:
  - Markdown
  - 测试
categories:
  - 技术
---

这篇文章用来测试博客主题对各种 Markdown 语法的渲染效果。

## 基础语法

### 标题

H1 到 H6 的标题层级。

### 段落与换行

这是第一段。

这是第二段，中间有空行分隔。

### 强调

- **粗体文本**
- *斜体文本*
- ***粗斜体***
- ~~删除线~~

### 列表

无序列表：
- 项目一
- 项目二
  - 子项目 A
  - 子项目 B
- 项目三

有序列表：
1. 第一步
2. 第二步
3. 第三步

### 链接和图片

[这是链接](https://suko.online)

### 引用

> "I'll live twice as much in half the time."
> — David Martinez

### 代码

行内代码：`console.log('Night City')`

代码块：

```javascript
function edgerunner(name) {
  console.log(`Welcome to the edge, ${name}`);
  return {
    status: 'alive',
    city: 'Night City'
  };
}
```

### 表格

| 角色 | 势力 | 状态 |
|------|------|------|
| David | Edgerunners | 已故 |
| Lucy | Edgerunners | 存活 |
| Rebecca | Edgerunners | 已故 |
| Maine | Edgerunners | 已故 |

### 分割线

---

## 高级语法

### 脚注

这是一个脚注的例子[^1]。

[^1]: 脚注内容在这里。

### 任务列表

- [x] 搭建博客
- [x] 设计主题
- [ ] 写更多文章
- [ ] 部署上线

### 数学公式（如果支持）

行内公式：$E = mc^2$

### 高亮

==这是高亮文本==（部分渲染器支持）

---

以上就是常用的 Markdown 语法测试，确保主题能正确渲染所有元素。

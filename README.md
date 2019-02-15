<h1 align="center">
  <img width="180"  alt="logo" src="https://user-images.githubusercontent.com/7939566/35442502-6ff6b7b8-02e2-11e8-8bb7-02156389054a.png">
  <br>Nice Mail
</h1>

<p align="center">
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D8.9.0-green.svg" alt="Node.js Version"></a>
  <a href="https://circleci.com/gh/chuangker/nice-mail/tree/master"><img src="https://img.shields.io/circleci/project/chuangker/nice-mail/master.svg" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/@chuangker/nice-mail"><img src="https://img.shields.io/npm/v/@chuangker/nice-mail.svg" alt="npm version"></a>
  <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="Standard - JavaScript Style Guide"></a>
</p>

:love_letter: Nice Mail 是一款以 Markdown 为基础的邮件编辑器。如果你厌倦了平淡无奇的传统邮件格式，那么 Nice Mail 的主题一定能让你眼前一亮。

**:bulb: TIP：主题持续完善中哦！欢迎提 PR。** 

![预览图](https://user-images.githubusercontent.com/7939566/36651196-86a79bf4-1ae2-11e8-864f-7a854598a228.png)

## 特性

- 支持主题 & 字段配置
- 支持自定义主题
- 支持历史邮件保存
- 支持保存为草稿
- 支持实时预览
- 支持往编辑器中拖拽上传图片
- 支持 HTML
- 支持 Markdown
- 支持保存为 PDF

## 安装

> 安装前，请确认已经安装 [Node.js](https://nodejs.org/en/)（>= v8.9.0）

```shell
$ npm install -g @chuangker/nice-mail
```

## 配置文件

默认情况下，所有的数据都被存放在 Nice Mail 安装的目录下。为了防止升级所造成的数据清空，那么就需要在 **第一次使用前完成以下配置**。

```shell
# 获取帮助
$ nice-mail config -h

# 配置缓存数据的目录地址，一般用来缓存发件人等信息
$ nice-mail config --db <dir>

# 配置上传文件的目录地址
$ nice-mail config --upload <dir>
```

## 快速开始

```shell
# 默认使用 7500 端口
$ nice-mail start

# 如果需要自定义端口，请使用
$ nice-mail start -p <端口号>
```

- 打开浏览器（建议使用 Chrome 以获得最佳体验）
- 访问 http://127.0.0.1:7500 （如果是自定义端口，需替换端口号）
- 尽情享受吧！

## 自定义主题

> 后续完善。

参考 [nice-mail](https://github.com/chuangker/nice-mail/blob/master/templates/nice-mail) 主题模板。

## License

MIT

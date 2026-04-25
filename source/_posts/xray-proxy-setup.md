---
title: Xray VLESS+Reality 代理搭建记录
date: 2025-04-20 14:30:00
tags:
  - 代理
  - VPS
  - 网络
  - Xray
categories:
  - 技术
---

记录一下最近在 Vultr VPS 上搭建 Xray VLESS+Reality 代理的全过程。

## 为什么选择 VLESS+Reality

传统的 VMess+WS 方案已经被识别得差不多了，Reality 协议的优势在于：
- 不需要域名和证书
- 伪装成正常 HTTPS 流量
- 指纹识别难度极高

## 环境信息

- **VPS**: Vultr Ubuntu 24.04
- **IP**: 202.182.103.180
- **端口**: 443

## 安装过程

```bash
# 下载安装脚本
bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install

# 生成 UUID 和密钥对
xray uuid
xray x25519
```

## 客户端配置要点

- 协议: VLESS
- 传输: TCP
- 安全: Reality
- SNI: www.microsoft.com (或其他目标网站)
- Flow: xtls-rprx-vision

## 防断连措施

- 设置了 watchdog 脚本每 5 分钟检查一次
- systemd 服务配置 Restart=always
- 定期更新 geoip 和 geosite 数据库

目前运行稳定，分享给有需要的朋友。

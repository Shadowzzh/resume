---
id: security-baseline-agent
title: 跨平台基线检测工具
company: 杭州奇盾
featured: true
status: completed
start: 2026-05
end: 2026-06
role: Go 工具开发
category:
  - 主机基线
  - Go 工具
stack:
  - Go
  - PowerShell
  - YAML
  - Makefile
summary:
  - 负责 Linux、Windows 主机与 DM8 数据库基线检查能力建设，将不同平台场景接入统一规则与采集框架。
  - 完善规则执行、平台专项采集、多实例识别、异常处理、日志脱敏和测试验证能力。
  - 维护 Linux amd64/arm64 与 Windows amd64 构建、校验和版本化交付。
impact:
  - 形成覆盖 Linux、Windows 主机与 DM8 数据库的跨平台基线检测能力，扩大产品在异构系统和国产数据库环境中的覆盖范围。
  - 形成可回归验证、可跨平台构建、可追溯发布的交付链路，提升私有化部署效率。
problem:
  - 需要在统一工具中覆盖 Linux、Windows 与国产数据库场景，并兼顾不同系统、架构和私有化环境的交付。
  - 采集过程涉及平台差异、外部命令和敏感数据，需要保证规则结果稳定、可复测并可安全发布。
responsibility:
  - 负责 Linux、Windows 主机与 DM8 数据库基线检查开发，接入统一规则与采集框架。
  - 完善规则验证、平台专项采集、多实例识别、异常处理和日志脱敏。
  - 维护多平台构建、发布包校验和版本化交付流程。
links: []
---

## 背景

该工具面向主机与数据库合规检查，统一采集 Linux、Windows 与 DM8 配置，并输出基线判定结果。

## 我负责的部分

负责 Linux、Windows 主机与 DM8 数据库基线检查开发，并完成规则验证、异常处理、日志脱敏和多平台交付。

## 结果

形成覆盖 Linux、Windows 主机与 DM8 数据库的基线检测能力，以及可回归验证、可跨平台构建、可追溯发布的交付链路。

# Resume TODO（本地工作清单）

> 仅本地跟踪，不入 git。记录简历内容与站点未决问题，处理完逐条勾选。

## 内容文案

- [ ] **CNAPP 项目介绍重写**（最初诉求，一直未落地）
  - 现状：首页"核心项目经历"卡片仍是旧版笼统文案（"[项目背景] 平台面向使用容器和 Kubernetes…集群审计、CIS 基线…"）
  - 待决策：A = 彻底弱化；B = 保留项目位、只写不可替代的点（多年多版本交付 + 多标签页/复杂状态管理 + 微隔离策略编辑器 + 授权安全）
- [ ] **skills.yaml 的 delivery（部署与交付）域收敛**
  - 建议：去掉 `Kubernetes` 关键词；narrative 从运维口吻改短为"能独立完成容器化部署、发布回滚与日志排查"
- [ ] **summary.short 同步**（profile + 两个 variant；当前无渲染器消费，历史遗留）
- [ ] **DM8 一致性**：简介已删 DM8，`content/experience.yaml` 奇盾 bullet 仍写"及 DM8 数据库"，决定是否同步删除

## 变体一致性

- [ ] **fullstack（AI 应用版）定位是否跟随**
  - frontend + profile 已是"全栈工程师偏前端"；fullstack 仍为"AI 应用工程师 / 高级前端工程师"，待确认是否调整
- [ ] **Java/admin-server 经历落笔方式**
  - 调研结论：若依框架上增量迭代（CDP 测试接口、nginx 等），分量轻，建议只写"参与/迭代接口开发"；确认是否单独体现

## 事实口径

- [ ] **时间线核对**
  - experience.yaml 奇盾 2024-03 起 vs cnapp 提交约 2025-04 才见；auto-pentest start 2025-12；CNAPP start 2024-03

## 动作

- [ ] **推送 origin/main**（当前领先 3 个提交：c9e8e10 / 9c8d867 / eba24f4；推送触发 GitHub Pages 部署）

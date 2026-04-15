.DEFAULT_GOAL := help

SHELL := /bin/bash

VERSION ?= patch
PREPARE_COMMIT_MESSAGE ?= chore: prepare release
DEPLOY_COMMIT_MESSAGE ?= chore: deploy pages

.PHONY: help build prepare-release deploy-pages publish-npm publish-npm-patch publish-npm-minor publish-npm-major full full-patch full-minor full-major guard-main commit-release-state

# 显示可用命令和中文说明。
help:
	@echo "可用命令："
	@echo "  make build                  # 执行 test、validate 和 build:full"
	@echo "  make deploy-pages           # 构建、提交当前改动并推送 main"
	@echo "  make publish-npm-patch      # 构建、提交当前改动、升级 patch 版本并推送 main 和 tag"
	@echo "  make publish-npm-minor      # 构建、提交当前改动、升级 minor 版本并推送 main 和 tag"
	@echo "  make publish-npm-major      # 构建、提交当前改动、升级 major 版本并推送 main 和 tag"
	@echo "  make full-patch             # 一次完成 Pages 部署和 npm patch 发布"
	@echo "  make full-minor             # 一次完成 Pages 部署和 npm minor 发布"
	@echo "  make full-major             # 一次完成 Pages 部署和 npm major 发布"
	@echo "  make full VERSION=patch     # 通用全量发布命令"

# 检查当前分支是否为 main，避免在错误分支执行发布。
guard-main:
	@branch=$$(git branch --show-current); \
	if [ "$$branch" != "main" ]; then \
		echo "Current branch must be main, got: $$branch"; \
		exit 1; \
	fi

# 执行完整本地构建流程，包括测试、校验和完整产物构建。
build:
	npm test
	npm run validate
	npm run build:full

# 提交当前工作区改动，作为发版前的准备提交。
commit-release-state:
	git add -A
	@if git diff --cached --quiet; then \
		echo "No local changes to commit."; \
	else \
		git commit -m "$(PREPARE_COMMIT_MESSAGE)"; \
	fi

# 串联主分支检查、构建和发版前提交。
prepare-release: guard-main build commit-release-state

# 仅部署 GitHub Pages：构建、提交当前改动并推送 main。
deploy-pages: guard-main build
	git add -A
	@if git diff --cached --quiet; then \
		echo "No local changes to commit before deploy."; \
	else \
		git commit -m "$(DEPLOY_COMMIT_MESSAGE)"; \
	fi
	git push origin main

# 仅发布 npm：构建、提交、升级版本并推送 main 和 tag。
publish-npm: guard-main prepare-release
	npm version $(VERSION)
	git push origin main --follow-tags

# 发布 npm patch 版本。
publish-npm-patch:
	$(MAKE) publish-npm VERSION=patch

# 发布 npm minor 版本。
publish-npm-minor:
	$(MAKE) publish-npm VERSION=minor

# 发布 npm major 版本。
publish-npm-major:
	$(MAKE) publish-npm VERSION=major

# 全量发布：构建、提交、升级版本并推送 main 和 tag，触发 Pages 和 npm。
full: guard-main prepare-release
	npm version $(VERSION)
	git push origin main --follow-tags

# 执行全量 patch 发布。
full-patch:
	$(MAKE) full VERSION=patch

# 执行全量 minor 发布。
full-minor:
	$(MAKE) full VERSION=minor

# 执行全量 major 发布。
full-major:
	$(MAKE) full VERSION=major

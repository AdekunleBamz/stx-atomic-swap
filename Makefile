# STX Atomic Swap Development Makefile

.PHONY: help install test stx-test stx-console eth-test eth-deploy btc-test-rpc clean docker-build docker-run docker-stop setup env-setup info

help: ## Show this help message
	@echo "STX Atomic Swap Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

test: ## Run all tests
	npm test

stx-test: ## Run Stacks tests
	npm run stx-test

stx-console: ## Open Stacks console
	npm run stx-console

eth-test: ## Run Ethereum tests
	npm run eth-test

eth-deploy: ## Deploy Ethereum contracts
	npm run eth-deploy

btc-test-rpc: ## Start Bitcoin regtest node
	npm run btc-test-rpc

clean: ## Clean build artifacts
	rm -rf node_modules/.cache eth/build btc/regtest

docker-build: ## Build Docker image
	docker build -t stx-atomic-swap .

docker-run: ## Run tests in Docker
	docker run --rm -v $$PWD:/app -w /app stx-atomic-swap

docker-stop: ## No-op for local dev
	@echo "Nothing to stop."

setup: install ## Setup development environment
	@echo "Setup complete."

env-setup: ## Create .env template
	@echo "Creating .env file..."
	@echo "# STX Atomic Swap env" > .env
	@echo "BTC_REGTEST_DIR=./btc" >> .env
	@echo "STX_NETWORK=mocknet" >> .env

info: ## Show project information
	@echo "STX Atomic Swap"
	@echo "Stacks: Clarinet"
	@echo "Ethereum: Truffle"
	@echo "Bitcoin: regtest"
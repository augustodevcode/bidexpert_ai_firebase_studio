#!/usr/bin/env bash
# ==============================================================================
# git-worktree-dev.sh — Parallel Development via Git Worktrees
# ==============================================================================
# Estratégia de Git Worktree para desenvolvimento paralelo no BidExpert.
# Permite que múltiplos agentes/desenvolvedores trabalhem simultaneamente
# em branches isoladas sem necessidade de stash ou troca de contexto.
#
# Uso:
#   ./scripts/git-worktree-dev.sh create <nome-feature> [porta]
#   ./scripts/git-worktree-dev.sh list
#   ./scripts/git-worktree-dev.sh remove <nome-feature>
#   ./scripts/git-worktree-dev.sh status
#
# Exemplos:
#   ./scripts/git-worktree-dev.sh create auction-filter 9006
#   ./scripts/git-worktree-dev.sh create qa-improvements 9007
#   ./scripts/git-worktree-dev.sh list
#   ./scripts/git-worktree-dev.sh remove auction-filter
# ==============================================================================

set -euo pipefail

BASE_BRANCH="demo-stable"
WORKTREE_BASE_DIR="/tmp/bidexpert-worktrees"
DEFAULT_PORT=9006
TIMESTAMP=$(date +%Y%m%d-%H%M)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
  echo -e "${BLUE}Git Worktree Dev — BidExpert Parallel Development${NC}"
  echo ""
  echo "Usage:"
  echo "  $0 create <feature-name> [port]   Create a new worktree for a feature"
  echo "  $0 list                            List all active worktrees"
  echo "  $0 remove <feature-name>           Remove a worktree"
  echo "  $0 status                          Show status of all worktrees"
  echo ""
  echo "Port mapping (default: 9006):"
  echo "  Main dev:       9005 (human developer)"
  echo "  Agent 1:        9006"
  echo "  Agent 2:        9007"
  echo "  Agent 3:        9008"
}

cmd_create() {
  local feature="${1:-}"
  local port="${2:-$DEFAULT_PORT}"

  if [[ -z "$feature" ]]; then
    echo -e "${RED}Error: feature name required${NC}"
    usage
    exit 1
  fi

  local branch_name="feat/${feature}-${TIMESTAMP}"
  local worktree_dir="${WORKTREE_BASE_DIR}/${feature}"

  echo -e "${BLUE}Creating worktree for feature: ${feature}${NC}"
  echo -e "  Branch: ${branch_name}"
  echo -e "  Dir:    ${worktree_dir}"
  echo -e "  Port:   ${port}"

  # Ensure base branch is up to date
  git fetch origin "$BASE_BRANCH" --quiet
  
  # Create worktree
  mkdir -p "$WORKTREE_BASE_DIR"
  git worktree add -b "$branch_name" "$worktree_dir" "origin/$BASE_BRANCH"

  # Copy .env file to the new worktree (restrict permissions to owner only)
  if [[ -f ".env" ]]; then
    cp .env "${worktree_dir}/.env"
    chmod 600 "${worktree_dir}/.env"
    echo -e "${GREEN}✓ .env copied to worktree (permissions: 600)${NC}"
  fi

  echo ""
  echo -e "${GREEN}✅ Worktree created successfully!${NC}"
  echo ""
  echo "To start development in this worktree:"
  echo -e "  ${YELLOW}cd ${worktree_dir}${NC}"
  echo -e "  ${YELLOW}npm ci && PORT=${port} node .vscode/start-${port}-dev.js${NC}"
  echo -e "  ${YELLOW}# Or: PORT=${port} npm run dev:next${NC}"
  echo ""
  echo "Access at: http://dev.localhost:${port}"
}

cmd_list() {
  echo -e "${BLUE}Active Git Worktrees:${NC}"
  git worktree list
}

cmd_remove() {
  local feature="${1:-}"

  if [[ -z "$feature" ]]; then
    echo -e "${RED}Error: feature name required${NC}"
    usage
    exit 1
  fi

  local worktree_dir="${WORKTREE_BASE_DIR}/${feature}"

  if [[ ! -d "$worktree_dir" ]]; then
    echo -e "${RED}Error: worktree directory not found: ${worktree_dir}${NC}"
    exit 1
  fi

  echo -e "${YELLOW}Removing worktree: ${worktree_dir}${NC}"
  git worktree remove "$worktree_dir" --force
  echo -e "${GREEN}✅ Worktree removed${NC}"
}

cmd_status() {
  echo -e "${BLUE}Worktree Status:${NC}"
  git worktree list --porcelain | while IFS= read -r line; do
    echo "  $line"
  done

  echo ""
  echo -e "${BLUE}Divergence from ${BASE_BRANCH}:${NC}"
  git worktree list --porcelain | grep "^branch" | awk '{print $2}' | while read -r branch; do
    if git rev-parse --verify "origin/$BASE_BRANCH" &>/dev/null; then
      ahead=$(git rev-list --count "origin/$BASE_BRANCH..${branch}" 2>/dev/null || echo "?")
      behind=$(git rev-list --count "${branch}..origin/$BASE_BRANCH" 2>/dev/null || echo "?")
      echo -e "  ${branch}: ${GREEN}+${ahead}${NC} / ${RED}-${behind}${NC} commits vs origin/${BASE_BRANCH}"
    fi
  done
}

# Main dispatch
case "${1:-}" in
  create)  cmd_create "${2:-}" "${3:-}" ;;
  list)    cmd_list ;;
  remove)  cmd_remove "${2:-}" ;;
  status)  cmd_status ;;
  *)       usage ;;
esac

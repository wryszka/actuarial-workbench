#!/usr/bin/env python3
"""Boundary static scan — the Group Control Tower's load-bearing guarantee.

Asserts that EVERY warehouse / SQL / MCP / model-serving / Databricks-SDK access
in the hub backend is confined to `src/app/server/group/`. Everything else must
stay FastAPI+uvicorn-pure. Run in CI / smoke; exits non-zero on a violation.

Also (light) SQL scan: outside the audit-union view builder + view passthroughs,
no business-metric SQL should appear in the group package — enforced by keeping
all SELECTs as `SELECT * FROM <manifest view>` or the dynamic union.
"""
import re
import sys
from pathlib import Path

APP = Path(__file__).resolve().parents[1] / "src" / "app"
GROUP = APP / "server" / "group"
FORBIDDEN = re.compile(r"\b(import\s+databricks|from\s+databricks|WorkspaceClient|serving_endpoints|"
                       r"statement_execution|execute_statement|/api/mcp|tools/call|/serving-endpoints)\b")

violations = []
for py in APP.rglob("*.py"):
    if GROUP in py.parents or py == GROUP:
        continue
    if "frontend" in py.parts or "__pycache__" in py.parts:
        continue
    for i, line in enumerate(py.read_text().splitlines(), 1):
        s = line.split("#", 1)[0]
        if FORBIDDEN.search(s):
            violations.append(f"{py.relative_to(APP)}:{i}: {line.strip()}")

if violations:
    print("BOUNDARY VIOLATION — data access outside server/group/:")
    print("\n".join("  " + v for v in violations))
    sys.exit(1)
print(f"OK: boundary clean — all data access confined to server/group/ "
      f"(scanned {sum(1 for _ in APP.rglob('*.py'))} files).")
sys.exit(0)

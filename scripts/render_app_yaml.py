#!/usr/bin/env python3
"""Render app.yaml by resolving ${var.X} from the bundle's resolved variables.

Databricks Apps does not interpolate ${var.X} in app.yaml, so we substitute
before `apps deploy`. Rather than hardcode values, we read them from
`databricks bundle validate -t <target> -o json`, keeping databricks.yml as the
single source of truth.

Usage:
    databricks bundle validate -t dev --profile DEV -o json > /tmp/b.json
    python3 scripts/render_app_yaml.py /tmp/b.json src/app/app.yaml > /tmp/app.yaml
"""
import json
import re
import sys

bundle_json, template = sys.argv[1], sys.argv[2]
variables = json.load(open(bundle_json)).get("variables", {}) or {}
values = {k: (v.get("value") if v.get("value") is not None else "") for k, v in variables.items()}

text = open(template).read()
missing = []


def repl(m):
    name = m.group(1)
    if name not in values:
        missing.append(name)
        return m.group(0)
    return str(values[name])


rendered = re.sub(r"\$\{var\.([A-Za-z0-9_]+)\}", repl, text)
if missing:
    sys.stderr.write(f"WARNING: unresolved vars (not in bundle): {sorted(set(missing))}\n")
sys.stdout.write(rendered)

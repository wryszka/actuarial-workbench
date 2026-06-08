# Sharing the workbench with others

How to make the hub — and the apps it links to — openable by everyone, without
adding people one by one. Nothing here is applied yet; this is the playbook.

## Model: dev = private, serverless = shared

- **dev** (`fevm-lr-dev-aws-us`, apps domain `…654171`) stays private to the
  builder. Don't grant the `users` group anything here.
- **serverless** (`fevm-lr-serverless-aws-us`, apps domain `…789953`) is the
  shared instance. Everything below happens **there**.

The shareable audience is the serverless workspace's `users` group — every
current and future member of that workspace. Confirm that group's membership
actually matches who you mean by "everyone"; that boundary is a workspace
provisioning question, not an app setting.

## Why apps are private by default

A Databricks App grants `CAN_MANAGE` to its creator + the `admins` group only.
No `CAN_USE` for anyone else, so others can't open it until added. Sharing =
grant `CAN_USE` to the `users` group.

## Step 1 — deploy the apps to serverless

The hub already has a `serverless` bundle target; `apps_domain_number`
re-derives every live-tile URL automatically. Two prerequisites:

- **Profile:** the `serverless` target references profile `sfevm`, which is not
  configured. The serverless workspace is reachable via profile **`DEFAULT`**.
  Fix the target's `profile` / `databricks_profile` to `DEFAULT` (or configure
  an `sfevm` profile) before deploying.
- **Linked apps:** the hub is only a launcher. `solvency2-workbench`,
  `pricing-workbench`, and `claims-workbench` must also be deployed on
  serverless (each with its service principal granted data access on
  `lr_serverless_aws_us_catalog`, same as we did on dev) — otherwise clicking a
  tile lands on "access denied".

```bash
# (after fixing the serverless profile)
make deploy-serverless        # hub
# + deploy solvency / pricing / claims to serverless via their own bundles
```

## Step 2 — grant CAN_USE to the `users` group on every app

Use the **additive** call (PATCH) so the creator + admins keep `CAN_MANAGE`.
`set-permissions` is a full replace and would wipe them — don't use it.

```bash
for app in actuarial-workbench solvency2-workbench pricing-workbench claims-workbench; do
  databricks apps update-permissions "$app" \
    --json '{"access_control_list":[{"group_name":"users","permission_level":"CAN_USE"}]}' \
    --profile DEFAULT
done
```

Redeploys don't change permissions, and new apps start private — so this is
worth keeping as a `make share` helper (see "Make it repeatable" below).

**End users need nothing beyond `CAN_USE`.** Each app runs as its own service
principal, which already holds the catalog/warehouse/endpoint grants. The user's
identity is passed through, but data access is the SP's — so there are no
per-user data grants to manage.

## Step 3 — the notebook-link problem (SAS + Excel tiles)

The SAS and Excel tiles deep-link into notebooks. Today those live under the
builder's personal folder (`/Workspace/Users/<me>/…`), which other users can't
read — so for anyone else those links 404. The MRC tile is description-only and
the live app tiles are fine; only the two accelerator tiles are affected.

### Use a shared workspace folder

| Location | Everyone can open | Everyone can edit | Verdict |
|---|---|---|---|
| `/Workspace/Shared/…` | yes | **yes** (`users` = CAN_MANAGE there) | Simple, but anyone can alter/delete. OK for a demo (source is in git). |
| **Dedicated folder, not under `/Shared`** (e.g. `/Workspace/Accelerators/…`) + grant `users` = **CAN_READ** | yes | no (you/admins only) | Cleanest — view-only for the audience, stable. **Recommended.** |

Note: workspace ACLs are inherited and additive — you **cannot** make a
read-only subfolder *under* `/Shared`, because the inherited `CAN_MANAGE` for
`users` flows down and can't be reduced. Hence a dedicated folder elsewhere.

### Wiring

1. Set each accelerator bundle's `workspace.root_path` to the shared folder so
   `bundle deploy` lands the notebooks there.
2. Post-deploy, grant `users` = `CAN_READ` on that folder via the directories
   permissions API:
   ```bash
   SID=$(databricks workspace get-status /Workspace/Accelerators --profile DEFAULT -o json | jq -r .object_id)
   databricks api put /api/2.0/permissions/directories/$SID --profile DEFAULT \
     --json '{"access_control_list":[{"group_name":"users","permission_level":"CAN_READ"}]}'
   ```
3. Point the hub's `EXCEL_FOLDER_PATH` / `SAS_NOTEBOOK_PATH` (serverless target)
   at the shared path. The deep links then resolve for everyone.

### View vs run — important

- **Open / read** a notebook → needs folder `CAN_READ` only. The shared folder
  fully covers this.
- **Run** ("Run all") → the notebook executes **as that user** (not as an SP,
  unlike the apps), so they'd also need attach-to-compute + the UC
  catalog/schema grants the notebook touches. So a shared folder makes the
  notebooks *browsable* by everyone; *hands-on running by arbitrary users* is a
  broader grant. For a demo, read-along is usually enough; keep "run" to
  yourself.

## Make it repeatable (`make share`)

Add a target so every app — now and later — is shared in one command, and the
intent is documented in the repo:

```make
# Grant the workspace `users` group CAN_USE on the shareable apps (additive).
share:
	@for app in actuarial-workbench solvency2-workbench pricing-workbench claims-workbench; do \
	  databricks apps update-permissions "$$app" \
	    --json '{"access_control_list":[{"group_name":"users","permission_level":"CAN_USE"}]}' \
	    --profile DEFAULT || true; \
	done
```

## Quick checklist

- [ ] Fix `serverless` target profile (`sfevm` → `DEFAULT`)
- [ ] Deploy hub + solvency + pricing + claims to serverless; grant each app SP its data access on `lr_serverless_aws_us_catalog`
- [ ] `make share` — grant `users` CAN_USE on all four apps
- [ ] Move SAS + Excel notebooks to a dedicated shared folder (not `/Shared`); grant `users` CAN_READ; repoint the hub's serverless path vars
- [ ] Confirm the serverless `users` group membership = the audience you intend

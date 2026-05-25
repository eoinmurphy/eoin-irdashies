# Local Build Notes (Windows + LLVM toolset)

Personal/environment-specific build workarounds that are deliberately **not** committed to `binding.gyp` because they would break or pessimise builds for users on the stock MSVC toolchain.

If you're building on Windows with the standard Visual Studio Build Tools (MSVC `link.exe`), you can ignore this file.

---

## The `binding.gyp` LLVM workaround

### Symptom

`npm install` (or `npm run package`) fails while compiling the native `irsdk_node` addon with an `lld-link` error similar to:

```
lld-link: error: invalid /LTCG:INCREMENTAL value
```

or a related link-time-code-generation failure originating from `addon.gypi`.

### Root cause

`node-gyp`'s shared `addon.gypi` unconditionally injects `/LTCG:INCREMENTAL` into the link/lib command line on Windows. MSVC's `link.exe` accepts it; LLVM's `lld-link` (used when `clang-cl` is selected as the platform toolset, e.g. via `LLVM-vs2022` or `ClangCL`) rejects it.

### Fix

Add `msvs_settings` to the `OS=='win'` block of `binding.gyp` that:

1. Turns off whole-program optimisation (`WholeProgramOptimization: false`)
2. Forces `LinkTimeCodeGeneration: 0`
3. Strips `/LTCG:INCREMENTAL` from both `VCLinkerTool` and `VCLibrarianTool` additional options (the `!` suffix on `AdditionalOptions!` removes a value gyp would otherwise pass through)

The performance impact is negligible — `irsdk_node` is a thin shim over the iRacing SDK headers, not a hot path.

### Why this isn't committed upstream

The workaround disables LTCG for everyone, but the bug only affects users running the LLVM toolset. Committing it would silently regress release-build quality for the MSVC majority for no benefit on their side. Keep it local.

---

## Workflow: pulling Mac branch changes into Windows checkout

The repo ships a ready-to-apply patch at [`docs/local-windows-llvm-build.patch`](./local-windows-llvm-build.patch). The round trip is:

```powershell
# 1. Discard the local-only churn (binding.gyp fix + npm lockfile drift)
git checkout -- binding.gyp package-lock.json

# 2. Pull whatever was pushed from the Mac
git pull

# 3. Re-apply the Windows/LLVM patch
git apply docs/local-windows-llvm-build.patch

# 4. Rebuild — this also re-introduces the harmless package-lock.json churn
npm install
```

After step 4, `git status` will again show `binding.gyp` and `package-lock.json` as modified. That's expected — **do not commit them**.

### If the patch fails to apply

`binding.gyp` upstream has probably changed shape. Open it, port the `msvs_settings` block (see [Fix](#fix) above) into the new structure by hand, then regenerate the patch:

```powershell
git diff binding.gyp | Out-File -Encoding utf8 docs/local-windows-llvm-build.patch
```

Commit the refreshed patch + any doc updates in a single follow-up commit.

### About the `package-lock.json` drift

The ~260-line diff that appears after `npm install` on this machine is just npm 11.x re-evaluating `"peer": true` markers on already-resolved dependencies, plus an `encoding` optional dep getting added. It's a side-effect of the local npm version, not an intentional dependency change. Always reset it with `git checkout -- package-lock.json` before any pull, and never include it in a commit unless you've deliberately changed a dependency in `package.json`.

---

## Toolchain reference

For posterity, the toolchain combination this workaround targets:

- Node.js 24.x, npm 11.x
- Visual Studio 2022 with the **LLVM (clang-cl)** platform toolset selected for native addon builds
- `node-gyp` 10.x / 11.x (whichever ships with the current npm)

If you switch back to the default MSVC toolset, you can skip the patch entirely.

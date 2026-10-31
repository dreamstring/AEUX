# Build and verification / 构建与验证

## 中文

需要 Node.js 22（CI 固定 22.3.0）和 npm。新构建流程无需 Python、PowerShell、
Figma、AE，也无需安装 npm 依赖或联网。旧前端和 CEP 运行依赖已经冻结入库。

```sh
npm test
npm run build
npm run verify:baseline
npm run verify:repro
```

- `build`：生成当前版本的配套 Figma 与 CEP 目录、ZIP，以及 `dist/latest.json`。
- `verify:baseline`：从仓库源码生成修复代码，逐文件比较冻结的 1.0.2。任何新增、
  缺失、字节差异都会失败；不自动修改基准。
- `verify:repro`：独立构建两次，ZIP 哈希必须相同；再解压 ZIP 验证全部文件。
- `check`：依次执行测试、基准比较和重复构建检查。

输出位置由 `dist/latest.json` 给出。每次生成独立目录，避免覆盖之前的构建。
ZIP 使用固定时间戳、固定排序和固定压缩参数；相同 Node/zlib 版本下 ZIP 可复现。
不同 Node/zlib 版本间，压缩字节可能不同，但解压后的文件仍须与基准完全相同。

### 唯一维护入口

| 内容 | 位置 |
| --- | --- |
| 矩阵、透明度、字距公共函数 | `packages/core` |
| 协议、蒙版、裁剪、阴影与宿主生成规则 | `packages/repair` |
| PNG 导出、边界和进度 | `packages/figma-export` |
| CEP 接收、文字资源准备 | `packages/cep` |
| 固定旧运行依赖 | `vendor` |
| 带显式插槽的转换器外壳 | `build/templates` |
| 冻结的上游宿主输入 | `build/inputs/upstream-host.jsx` |
| 1.0.2 完整文件哈希 | `tests/baseline/1.0.2.json` |
| 构建及 ZIP 实现 | `scripts` |

不要直接修改 `dist`、本机安装目录或 Release ZIP。修改源码后重新运行统一命令。
`Ae/AEUX` 与 `Figma/AEUX` 中的原始前端源码尚不是此版本的完整重编译入口。
当前已能从仓库完整生成配套安装包，但仍以冻结的编译前端作为依赖；不声称已把
每个旧版 Vue/TypeScript 模块都迁成源码构建。详见 `vendor/README.md`。

离线验证覆盖纯计算、转换协议、宿主生成和全部安装文件的一致性。它不验证宿主
新版本、字体或运行环境变化，也不代替未来改变行为时的实机验收。

## English

Use Node.js 22 and npm (CI pins 22.3.0). No dependency installation, Python,
PowerShell, network connection, Figma or AE is required by the maintained build.

`npm run build` assembles the paired package. `npm run verify:baseline` requires
all output files to match the frozen accepted 1.0.2 byte for byte.
`npm run verify:repro` builds twice, compares ZIP hashes, and checks an extracted
ZIP against the first current-version build. `npm run check` runs all checks together.

The frozen baseline check uses `--frozen`; it deliberately excludes post-1.0.2
features. Ordinary builds apply maintained feature modules after that checkpoint.

Read `dist/latest.json` for output paths. Packaging uses sorted paths, fixed ZIP
timestamps and fixed compression settings. ZIP hashes are reproducible with the
same Node/zlib versions; extracted contents must match across environments.

Repair functions, browser rule functions, raster export, CEP interception and AE
host code are generated from checked-in source. Legacy frontend shells and
runtime dependencies are vendored, pinned build inputs. This is a reproducible
assembly pipeline, not a claim that every legacy compiled frontend has already
been migrated back into a full Vue/TypeScript build. See `vendor/README.md`.

Do not patch generated files or installed applications. Change the maintained
sources and rebuild. Baseline mismatches must be reviewed, never auto-approved
by regenerating the expected hashes. Offline parity does not establish behavior
on different host versions or replace desktop acceptance after behavior changes.

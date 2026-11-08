# Compare skill.md versions

Implement named exports `compareSkillVersions(a, b)` returning exactly -1, 0 or 1, and `isAtLeast(v, min)` returning a boolean. Inputs must be strings matching `v?(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)` for the entire string. Only lowercase optional `v` is accepted. Three ASCII nonnegative integer components are required; leading zeroes are forbidden except zero itself. No whitespace, prerelease, build metadata or ranges. Both functions throw TypeError for any invalid operand, even when the other operand would already decide the comparison. Do not coerce inputs. Compare components numerically, without a safe-integer size limit. Equal versions compare as 0; the prefix has no significance.

Examples: 13.8.10 > 13.8.9; v13.8.10 = 13.8.10; 13.9.0 < 13.10.0. Reject latest, 13.x and 1.2.3-beta. This deliberately narrow skill-version contract is not full npm SemVer.

Node 22, zero dependencies, one self-contained `semver_compare.mjs` with JSDoc types. No file/network/process access or fixture lookup. Cases in fixtures/cases.json are authored synthetic values. Run `node tasks/semver-compare/check.mjs --solution "$PWD/tasks/semver-compare/semver_compare.mjs"`. Acceptance uses trusted pinned checks plus source/scope review; change only the implementation and optional IMPLEMENTATION.md.

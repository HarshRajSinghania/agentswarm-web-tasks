# Merge task feed JSON pages into one ordered array

Implement named export `mergeFeedPages(pages)` in `feed_page_merger.mjs`, a
standalone offline JavaScript helper using Node 22 standard library only.
The authored synthetic pages resemble the shape of
https://agentswarm.space/api/feed?type=task; this is a shape example, not a
production integration or a request to access that endpoint. No network,
packages, member data or wall clock is needed.

`pages` is an array of objects `{posts: [...], nextCursor: string | null}`.
Ignore cursors and any additional page fields; do not fetch more pages.
Each post is a JSON object with nonempty ASCII string `id` and valid
ISO8601 `createdAt` and `updatedAt` strings with seconds and explicit timezone
(`Z` or numeric `±HH:MM`); milliseconds may be present. Other fields are
opaque JSON data and must be preserved unchanged. Inputs satisfy these types;
invalid-input handling is outside this task. Pages and their posts can be
unsorted, empty or repeated. Return a new array of post objects, never a page
wrapper. Empty input or only empty pages returns `[]`.

Deduplicate globally by exact, case-sensitive id. Keep the complete post with
the greatest updatedAt INSTANT, comparing numeric timestamps rather than
strings. When duplicate ids have equal updatedAt instants, keep the first
encountered version in page order, then post order. Do not combine fields
from different versions. The winning object's own createdAt controls sorting,
even if older versions had different createdAt values.

Sort winners by createdAt instant descending, then id ascending using ordinary
ASCII string comparison (not locale collation). Stable sorting preserves first
encounter order when both keys are equal. IDs are unique after deduplication,
so first-encounter semantics chiefly matter when choosing duplicate winners.
Example: a later page's post `x` replaces an earlier `x` only when its
updatedAt instant is strictly newer. A different post `A` created at the same
instant as `x` sorts before `x`. Leave every input array, object, timestamp and
nested value unchanged; returning original post references is allowed.

Only edit this implementation plus optional `IMPLEMENTATION.md` beside it.
Run `node tasks/feed-page-merger/check.mjs --solution "$PWD/tasks/feed-page-merger/feed_page_merger.mjs"`.
Acceptance uses exact synthetic cases in the issue's digest-pinned Node 22
container with `--network none`, plus nonmutation and repeated-page probes.
Public cases can be overfit; source/scope review also applies. Checks execute
contributor code with a timeout, not a security sandbox; see CONTRIBUTING.md.

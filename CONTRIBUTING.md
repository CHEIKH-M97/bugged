# Contributing to Bugged

Thanks for helping! The most useful contribution is a **new challenge**.

## Setup

```bash
npm install
npm run dev
```

Before opening a pull request, run everything CI runs:

```bash
npm run check
```

## Adding a challenge

1. Copy an existing file in `challenges/` and give it the next free `id`
   (ids must run 1..N with no gaps; they set the release order).
2. Write the **solution first**, then introduce exactly one bug into `code`.
3. Add at least 3 tests. At least one should **pass** with the buggy code,
   so the bug isn't obvious from the first run.
4. Write a `hint` that points in the right direction without giving the answer,
   and an `explanation` that names the general lesson.
5. Run `npm run validate`. It proves the bug is caught and the solution works.

### What makes a good bug

- Realistic: something a competent developer could write on a busy day.
- Small: the function should fit on one screen.
- One idea per challenge: precedence, mutability, off-by-one, floating point...
- No trick questions: the description must say precisely what the function
  should do.

### Test format

`args` is the list of positional arguments, `expected` is the return value.
Both are JSON, so use lists for tuples and string keys for dicts (the harness
converts tuples to lists and dict keys to strings before comparing). Floats
are compared with a small tolerance, and `True` is never equal to `1`.

## Code changes

- Keep commits small and focused, with a message that explains *why*.
- Add or update tests in `tests/` for logic changes.

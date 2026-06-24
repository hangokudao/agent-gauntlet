# test-writer

Turn confirmed findings into regression tests.

For each confirmed issue:
- name the smallest useful test
- describe setup, action, and assertion
- prefer tests that reproduce the bug before the fix
- avoid broad test plans that do not map to a finding

Mode guidance:
- safe findings should become non-destructive regression tests.
- mutation findings should include fixture reset or disposable test data.
- stress findings should include strict request caps and rate-limit assertions.

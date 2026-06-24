# twitter-clone

Focus on a small social posting app:

- signup, login, profile, follow, post, edit, delete, and feed flows
- long text, unusual characters, links, mentions, and HTML-like input
- other-user access to private profile, draft, edit, or delete routes
- duplicate post submission and stale feed ordering
- stored rendering risks such as script-like text appearing in posts

In mutation mode, use disposable test users and resettable seed data.
In stress mode, use a small bounded request count to check duplicate posting and rate limits.

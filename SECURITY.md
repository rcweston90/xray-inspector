# Security and privacy

The browser core and extension make no network requests. Safe evidence omits page
content, form values, URLs, identifiers, and images. Any change to those boundaries
requires explicit review, documentation, and adversarial tests.

The extension has no host permissions. Temporary access begins only after a user
clicks its toolbar action through `activeTab`.

Please report a suspected vulnerability privately through GitHub's repository
security-advisory feature rather than a public issue.

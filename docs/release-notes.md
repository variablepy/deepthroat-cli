DeepThroat CLI fixes automatic release discovery.

- Corrected the GitHub metadata request that caused HTTP 415 and prevented upgrades.
- Download failures now include the underlying HTTP or connection error.
- Added real HTTP metadata and binary-download regression coverage.
- Release installation checks now exercise the default latest-version lookup on Windows and Linux.
- Includes the streaming improvements from v0.1.9.

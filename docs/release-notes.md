DeepThroat CLI streams text and reasoning updates more frequently.

- Reduced text and reasoning batching from 100ms to 32ms.
- Preserved exact final text, fragment ordering, tool boundaries and cancellation behavior.
- Added the streaming event-order regression suite to the release verification gate.
- Windows x64, Linux x64 and Linux ARM64 releases remain supported.

This changes stream delivery cadence, not model generation speed. Account selection, proxy routing and concurrency behavior are unchanged.

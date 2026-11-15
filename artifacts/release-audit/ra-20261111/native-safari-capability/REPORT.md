# Native Safari capability setup — FAILED before session

Root launched only a new owned safaridriver on allowed loopback target19845 with a45s ceiling. Installed driver reports Safari27.0.1. The readiness loop reached its listener ownership guard; filtering lsof by the launcher PID returned1 and the probe stopped with CalledProcessError. No POST/session, app navigation, user-page read, screenshot, performance or Retina test occurred. --enable and OS settings were not used.

Raw result is FAILED; an exit0 of the thin Python wrapper does not make it a test PASS. The immediate exclusive-bind check wasfalse. Subsequent all-listener lsof and safaridriver pgrep had no records and a loopback connect was refused: the exclusive-bind result is not evidence of a surviving listener or leak. No other process was killed.

The exact cause of the ownership-inspection failure is not established. A process-attribution/XPC hypothesis must not become a confirmed explanation without evidence. Initial source snapshot/result are preserved. This is a harness setup failure, not proof of Safari incompatibility, disabled automation permission or a product runtime fault. Native app and Retina acceptance remain untested.

---
'identity-service': patch
---

A refresh that races another refresh no longer kills the session. The refresh token a refresh replaces is remembered for 30 seconds: inside that window the old token gets a new access token (no new refresh token, no cookie change), and after it, or for any other token, the session is revoked as before. Two tabs or apps sending the same cookie at the same time no longer sign the user out. Adds two nullable columns to `auth_sessions`.

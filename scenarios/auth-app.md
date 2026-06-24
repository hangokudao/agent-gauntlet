# auth-app

Focus on authentication and account boundaries:

- signup, login, logout, reset, and session expiry flows
- account-specific data visibility
- direct route access while logged out
- duplicated submissions and stale auth state
- clear errors without leaking secrets

In mutation mode, use disposable test accounts only.
In stress mode, keep login/rate-limit checks bounded and do not brute-force credentials.

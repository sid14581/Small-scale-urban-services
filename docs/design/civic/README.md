# SCMS Urban Services — Civic Design References

## Design export status

| Item | Value |
|------|-------|
| External design tool API | ✅ Verified (HTTPS MCP fallback) |
| Project (2026-09-06 redesign) | ✅ `projects/728943638469910556` ("SCMS Urban Services") |
| Prior project | `projects/16308196752677021907` — no longer returned by API (replaced) |
| Screen generation | ✅ Login, OTP, Submit, Confirmation, My Complaints, Staff list/detail, Admin hub, Forgot password |
| Cursor design MCP in Agent | ❌ Not in tool list — used HTTPS MCP API fallback |
| React apply | ✅ Auth labels + channel OTP, citizen confirmation/detail, staff table, admin hub |

## Winner: Variant C — Civic Hybrid

Light-first civic palette with teal primary (`#0d9488`), category color top-borders, staff amber badges, and full dark-mode toggle.

### Design direction scores (manual evaluation)

| Criterion | Weight | A Civic Light | B Trust Dark | C Civic Hybrid |
|-----------|--------|---------------|--------------|----------------|
| Civic trust / clarity | High | 4 | 3 | **5** |
| Category discoverability | High | 4 | 3 | **5** |
| Mobile responsiveness | High | 4 | 4 | **5** |
| Accessibility (contrast, tap targets) | High | 5 | 3 | **5** |
| Staff/citizen consistency | Medium | 3 | 4 | **5** |
| Visual polish | Medium | 4 | 4 | **5** |
| **Total (weighted)** | | 24 | 21 | **30** |

**Rationale:** Light default maximizes civic trust and WCAG contrast; teal reads as public-service rather than consumer SaaS; category top-borders aid scanability; amber staff badge separates roles; dark mode satisfies preference without sacrificing daytime accessibility.

## Design tokens (implemented)

| Token | Before | After (light) | After (dark) |
|-------|--------|---------------|--------------|
| Primary | `#6366f1` indigo | `#0d9488` teal | `#2dd4bf` teal-light |
| Background | `slate-900` | `slate-50` | `slate-950` |
| Surface/card | `slate-800` | `white` | `slate-900` |
| Muted text | `slate-400` | `slate-500` | `slate-400` |
| Status open | yellow-900/200 | amber-100/800 | amber-900/200 |
| Status in_progress | blue-900/200 | sky-100/800 | sky-900/200 |
| Status resolved | green-900/200 | emerald-100/800 | emerald-900/200 |

## Civic UI refs (2026-09-06)

| Screen | Local HTML | React |
|--------|------------|-------|
| Home desktop / mobile | `home-desktop.html`, `home-mobile.html` | `Home.jsx`, `Navbar.jsx` |
| Login | `login-desktop.html` | `Login.jsx` |
| Login OTP | `login-otp-desktop.html` | `Login.jsx` (step 2) |
| Forgot password | `forgot-password-desktop.html` | `ForgotPassword.jsx` |
| Submit complaint | `submit-complaint-desktop.html` | `SubmitComplaint.jsx` |
| Confirmation | `confirmation-desktop.html` | `SubmitComplaint.jsx` (post-submit) |
| My Complaints | `my-complaints-desktop.html` | `MyComplaints.jsx` |
| Staff list | `staff-list-desktop.html` | `ComplaintList.jsx` |
| Staff detail | `staff-detail-desktop.html` | `ComplaintDetail.jsx` |
| Admin portal | `admin-portal-desktop.html` | `AdminPortal.jsx` |

Manual / earlier civic mockups (`*-civic-clarity.html`, `screen-patterns.html`) remain as pattern notes. Reset password + citizen detail + audit logs follow the same civic patterns (no separate design HTML).

HTML mockups document layout intent. React implementation is the source of truth.

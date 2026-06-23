# SCMS Urban Services — Stitch Design References

## Stitch MCP Status

| Item | Value |
|------|-------|
| API auth | ✅ Verified via `curl` to `https://stitch.googleapis.com/mcp` |
| Project created | ✅ `projects/16308196752677021907` ("SCMS Urban Services") |
| Screen generation | ❌ `generate_screen_from_text` timed out (~61s) — no screens created |
| Fallback | Manual civic hybrid design system implemented in React |

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

## Screen references

HTML mockups in this folder document layout intent per route. React implementation is the source of truth.

| File | React page |
|------|------------|
| `home.html` | `Home.jsx` |
| `login.html` | `Login.jsx` |
| `register.html` | `Register.jsx` |
| `complaint-hub.html` | `ComplaintHub.jsx` |
| `submit-complaint.html` | `SubmitComplaint.jsx` |
| `my-complaints.html` | `MyComplaints.jsx` |
| `profile.html` | `Profile.jsx` |
| `feedback.html` | `FeedbackPage.jsx` |
| `staff-dashboard.html` | `StaffDashboard.jsx` |
| `complaint-list.html` | `ComplaintList.jsx` |
| `complaint-detail.html` | `ComplaintDetail.jsx` |
| `staff-feedback.html` | `StaffFeedback.jsx` |

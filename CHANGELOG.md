# Changelog

All notable changes to this project are documented here.

The project follows Semantic Versioning (`MAJOR.MINOR.PATCH`).

## [1.0.0] - 2026-02-23

### Added
- Full-stack Campus Eats platform with student, vendor (manager), chef, and admin roles.
- JWT authentication and role-based route protection.
- Student ordering flow: shop browsing, cart, payment simulation, confirmation, status tracking.
- Vendor manager dashboard with live queue, acceptance/rejection, and pickup controls.
- Chef-only kitchen workflow (`ACCEPTED -> PREPARING -> READY`).
- Atomic order state transitions to prevent race-condition clashes under concurrent actions.
- Shop open/close controls with backend enforcement.
- Server-Sent Events (SSE) stream for near real-time manager/kitchen refresh.
- Vendor poster upload pipeline (local image upload via multipart file).
- Cluster-ready deployment assets (`Dockerfile`, Nginx reverse proxy, compose setup, PM2 config).
- Load testing assets (`k6` and `autocannon`) and migration script for vendor-shop unique index.

### Changed
- Improved student UI: centered floating cart summary, search/sort, inline quantity controls.
- Updated branding/navigation behavior (clickable brand routes to role home).
- Refined order board details with itemized line display.

### Security
- Vendor-shop assignment uniqueness enforced with migration-safe index script.
- Closed-shop ordering restrictions enforced on both frontend and backend.


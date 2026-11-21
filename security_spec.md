# Security Specification — MMC Photography Firestore Rules

## 1. Data Invariants
1. All portfolio collections (`studioConfig`, `galleryPhotos`, `featuredWeddings`, `featuredWeddings/{weddingId}/photos`, `faqs`, `reviews`, `blogPosts`, `vaultPhotos`) contain strictly public non-PII studio showcase data readable by website visitors.
2. Only a verified Studio Administrator (`request.auth != null && request.auth.token.email_verified == true` matching a bootstrapped studio email or an existing `/admins/{uid}` record) may create, update, or delete studio content.
3. The `/admins/{uid}` collection contains administrator emails (PII) and is never readable or writable by non-admin users; self-assignment of admin privileges is forbidden.
4. Every single-document path ID must satisfy `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
5. Every `FeaturedWeddingPhoto` in `/featuredWeddings/{weddingId}/photos/{photoId}` must reference an existing parent `/featuredWeddings/{weddingId}` document and have `weddingId == weddingId`.
6. All `updatedAt` timestamps on create/update must equal `request.time`.
7. All strings and arrays have explicit upper bounds matching `firebase-blueprint.json`.

## 2. The "Dirty Dozen" Adversarial Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Gallery Write**: Anonymous user attempts `create` on `/galleryPhotos/p1`.
2. **Unverified Admin Email Spoof**: User with `email: "accomplishmarketinglearning@gmail.com"` and `email_verified: false` attempts `update` on `/studioConfig/about`.
3. **Self-Assigned Admin Escalation**: Regular signed-in user attempts `create` on `/admins/{theirUid}` with `{ role: "admin" }`.
4. **Admin PII Scrape**: Unauthenticated or non-admin user attempts `get` or `list` on `/admins`.
5. **Shadow Field Injection**: Admin attempts `create` on `/galleryPhotos/p2` with an extra undeclared field `{ isVerified: true }`.
6. **ID Poisoning**: Admin attempts `create` on `/galleryPhotos/../../hack!` or a 200-char document ID.
7. **Category Enum Bypass**: Admin attempts `create` on `/galleryPhotos/p3` with `category: "invalid-category"`.
8. **Unbounded String Poisoning**: Admin attempts `update` on `/faqs/faq-1` with a 50KB question string.
9. **Timestamp Forgery**: Admin attempts `create` on `/vaultPhotos/v1` with a client-forged `updatedAt` timestamp instead of `request.time`.
10. **Orphaned Featured Wedding Photo**: Admin attempts `create` on `/featuredWeddings/nonexistent/photos/p1` where parent `/featuredWeddings/nonexistent` does not exist.
11. **Mismatched Parent ID**: Admin attempts `create` on `/featuredWeddings/w1/photos/p1` with `weddingId: "w2"`.
12. **Unbounded Array Injection**: Admin attempts `update` on `/studioConfig/pricing` with `packages` array containing > 10 entries.

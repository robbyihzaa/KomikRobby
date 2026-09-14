/**
 * Sync implementation guide.
 *
 * The source API exposes paginated library/latest/popular/genre endpoints.
 * A production worker should:
 * 1. Iterate pages until the source returns no items.
 * 2. Upsert comics by (source_id, source_key/slug).
 * 3. Upsert genres and comic_genres.
 * 4. For each changed comic, fetch detail and upsert chapters.
 * 5. Fetch chapter pages only when needed (or when a chapter is first opened).
 * 6. Record each run in sync_runs.
 *
 * This file intentionally does not bulk-copy third-party comic images/content.
 * Use it only with content/source data you are authorized to ingest.
 */
console.log("Sync plan ready. Implement the worker against your authorized source.");

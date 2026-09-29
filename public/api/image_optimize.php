<?php
// ── Shared image optimizer ────────────────────────────────────────────────────
// Converts an uploaded image to a resized WebP (max 1920px, quality 80) so the
// website loads fast. Returns the new filename on success, or null if the
// server cannot convert (caller should fall back to saving the original).
if (!function_exists('rga_optimize_image')) {
    function rga_optimize_image(string $tmpPath, string $mimeType, string $destDir, string $prefix): ?string {
        // Optimization disabled — images are kept exactly as uploaded
        // (no WebP conversion, no resizing, no rotation). Returning null
        // makes every caller fall back to saving the original file.
        return null;
    }
}

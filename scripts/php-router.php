<?php
// The PHP server is private to Vite; expose only API endpoints and public media.
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
$root = realpath(__DIR__ . '/../public');
$file = realpath($root . $path);
if (!$file || !str_starts_with($file, $root . DIRECTORY_SEPARATOR) || !is_file($file)) {
    http_response_code(404);
    exit;
}
if (preg_match('#^/api/[a-zA-Z0-9_]+\.php$#', $path)) {
    require $file;
    return true;
}
if (str_starts_with($path, '/uploads/') &&
    preg_match('/\.(jpe?g|png|webp|gif|svg|mp4|webm|pdf)$/i', $path)) {
    return false;
}
http_response_code(403);
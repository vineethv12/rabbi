import { spawn } from "node:child_process";
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  process.exitCode = code;
}
function start(command, args) {
  const child = spawn(command, args, { stdio: "inherit", env: process.env });
  children.push(child);
  child.on("error", error => { console.error(error.message); stop(1); });
  child.on("exit", code => { if (!stopping) stop(code || 1); });
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
start("php", ["-d", "upload_max_filesize=200M", "-d", "post_max_size=210M", "-S", "127.0.0.1:3001", "-t", "public", "scripts/php-router.php"]);
start(process.execPath, ["node_modules/vite/bin/vite.js"]);

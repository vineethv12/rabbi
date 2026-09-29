# Rabbi Global Academy — Source Code

Includes the React website, PHP API, public images/uploads, and database schema.
Database records, private configuration, development databases, test fixtures,
and installed dependencies are not included. Existing public media is included.

## Requirements
- Node.js 22 or newer and npm
- PHP 8.2+ with PDO MySQL, ZipArchive, SimpleXML, mbstring and GD
- MySQL/MariaDB and a database user with schema creation/migration permission

## Local development
1. Create an empty database. Import database/rabbi_global_academy_database.sql,
   then database/event-updates-mariadb.sql (MariaDB syntax).
   For an existing database, back it up first; review migrations before applying.
   The API also applies its required incremental schema additions on first use.
2. Copy config.local.example.php to config.local.php in the project root.
   Fill in your database settings, administrator password, and a long random
   SESSION_SECRET. Never commit or place this private file inside public/.
   Environment variables with these names can be used instead.
3. Run npm ci, then npm run dev.
4. Open http://localhost:5173. The PHP API uses port 3001 behind the frontend proxy.
   A database service must already be running; the launcher does not create one.

## Production / shared hosting
1. Run npm ci and npm run build.
2. Upload the CONTENTS of dist/ to your PHP-enabled web root (including .htaccess).
3. Put your completed config.local.php one directory ABOVE the web root,
   or configure the required environment variables in your hosting control panel.
4. Import the database schema/migrations if installing into a new database.
   Existing content records must be migrated separately from your current database.
   Public media alone does not recreate galleries, franchises or events in the database.
5. Enable HTTPS and Apache rewrite support. Ensure uploads/ is writable.
   Upload limits should allow 200 MB files and 210 MB POST bodies.
   Some PHP-FPM hosts reject php_value/php_flag directives in .htaccess:
   remove those directives only if required by your host, and set their values
   in its PHP configuration panel instead.
6. Configure mail delivery separately if you use email features.

npm run preview serves a frontend build only; it is not a production PHP server.

## Current behavior
Event posters display at natural height without cropping. The recommended
upload size is 1500 × 1000 px (3:2). Franchise portraits use square images.
Optional event model question paper links are included.
Student address and registration number are optional. Blank new-student
passwords and imported student passwords use the shared default configured
in the application; existing student passwords are not changed.

## Security before public use
Set unique administrator and session credentials. The existing portal exposes
student passwords to authorized staff and uses a shared onboarding password.
Review that policy before production use and have students change their passwords.
Do not deploy the project root, database SQL, or private configuration publicly.

import { spawnSync } from 'node:child_process';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    '\nSkipping prisma migrate deploy because DATABASE_URL is not set.',
  );
  process.exit(0);
}

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  encoding: 'utf-8',
  env: process.env,
});

if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}

const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;

if (result.error) {
  console.warn(
    `\nSkipping prisma migrate deploy because the command failed to start: ${result.error.message}`,
  );
  process.exit(0);
}

if (result.status !== 0) {
  if (/P1001/.test(output)) {
    console.warn(
      '\nSkipping prisma migrate deploy because the database is unreachable (P1001).',
    );
    process.exit(0);
  }
  process.exit(result.status ?? 1);
}

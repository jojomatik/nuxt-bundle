import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";

let server;
let origin;

before(async () => {
  server = spawn(process.execPath, [".output/server/index.mjs"], {
    env: { ...process.env, HOST: "127.0.0.1", PORT: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  origin = await new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(
      () => reject(new Error("Server startup timed out")),
      30000,
    );
    server.stdout.on("data", (chunk) => {
      output += chunk;
      const match = output.match(/Listening on (http:\/\/127\.0\.0\.1:\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
    server.stderr.on("data", (chunk) => {
      output += chunk;
    });
    server.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    server.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Server exited with code ${code}: ${output}`));
    });
  });
});

after(() => {
  server?.kill();
});

test("production HTML preloads the installed Roboto Latin 400 and provides all configured faces", async () => {
  const response = await fetch(`${origin}/license-information`);
  assert.equal(response.status, 200);
  const html = await response.text();
  const links = html.match(/<link\b[^>]*>/g) ?? [];
  const preloads = links.filter(
    (link) => /rel="preload"/.test(link) && /as="font"/.test(link),
  );
  assert.equal(preloads.length, 1);
  assert.match(preloads[0], /crossorigin/);
  const url = preloads[0].match(/href="([^"]+)"/)?.[1];
  assert.ok(url);
  assert.ok(url.startsWith("/_nuxt/fonts/"));

  const fontResponse = await fetch(new URL(url, origin));
  assert.equal(fontResponse.status, 200);
  const actual = Buffer.from(await fontResponse.arrayBuffer());
  const expected = await readFile(
    new URL(
      import.meta
        .resolve("@fontsource/roboto/files/roboto-latin-400-normal.woff2"),
    ),
  );
  assert.deepEqual(actual, expected);

  const faces = html.match(/@font-face\s*\{[^}]+\}/g) ?? [];
  const robotoFaces = faces.filter((face) =>
    /font-family:\s*Roboto[;}"']/.test(face),
  );
  assert.ok(robotoFaces.length > 0);
  assert.ok(robotoFaces.every((face) => !face.includes("local(")));
  for (const weight of [300, 400, 500, 700]) {
    for (const style of ["normal", "italic"]) {
      assert.ok(
        robotoFaces.some(
          (face) =>
            new RegExp(`font-weight:\\s*${weight}[;}]`).test(face) &&
            new RegExp(`font-style:\\s*${style}[;}]`).test(face),
        ),
        `Missing Roboto ${weight} ${style}`,
      );
    }
  }
});

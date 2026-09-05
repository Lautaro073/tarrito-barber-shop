import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function pngSize(path) {
  const png = await readFile(new URL(path, root));

  assert.equal(png.toString("ascii", 1, 4), "PNG");
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

test("el manifest permite instalar Tarrito Barber Shop", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("public/manifest.webmanifest", root), "utf8"),
  );

  assert.equal(manifest.name, "Tarrito Barber Shop");
  assert.equal(manifest.short_name, "Tarrito");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.display, "standalone");
  assert.deepEqual(
    manifest.icons.map(({ src, sizes, type }) => ({ src, sizes, type })),
    [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  );
});

test("los iconos PWA tienen las dimensiones declaradas", async () => {
  assert.deepEqual(await pngSize("public/icons/icon-192.png"), {
    width: 192,
    height: 192,
  });
  assert.deepEqual(await pngSize("public/icons/icon-512.png"), {
    width: 512,
    height: 512,
  });
});

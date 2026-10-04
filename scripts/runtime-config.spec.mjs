import assert from "node:assert/strict";
import childProcess from "node:child_process";
import fs from "node:fs";
import { readFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");

for (const service of ["identity", "academic", "admission", "student"]) {
  test(`${service}-service emits the dev and production entrypoints on a clean compile`, async () => {
    const serviceRoot = path.join(root, "services", `${service}-service`);
    const configPath = path.join(serviceRoot, "tsconfig.build.json");
    const diagnostics = [];
    const outputs = new Set();
    const sys = {
      ...ts.sys,
      readFile: (file) =>
        file.endsWith(".tsbuildinfo") ? undefined : ts.sys.readFile(file),
      fileExists: (file) =>
        !file.endsWith(".tsbuildinfo") && ts.sys.fileExists(file),
      writeFile: (file) => outputs.add(path.resolve(file)),
      watchFile: () => ({ close() {} }),
      watchDirectory: () => ({ close() {} }),
      setTimeout: () => 0,
      clearTimeout: () => {},
    };
    const host = ts.createWatchCompilerHost(
      configPath,
      {},
      sys,
      ts.createEmitAndSemanticDiagnosticsBuilderProgram,
      (diagnostic) => diagnostics.push(diagnostic),
      () => {},
    );
    const watcher = ts.createWatchProgram(host);
    watcher.close();

    assert.deepEqual(
      diagnostics.map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      ),
      [],
      `${service}: clean compilation must have no diagnostics`,
    );
    assert.ok(outputs.has(path.join(serviceRoot, "dist/src/main.js")));
    assert.ok(
      outputs.has(path.join(serviceRoot, "dist/src/openapi/emit-openapi.js")),
    );

    const nest = JSON.parse(
      readFileSync(path.join(serviceRoot, "nest-cli.json"), "utf8"),
    );
    const manifest = JSON.parse(
      readFileSync(path.join(serviceRoot, "package.json"), "utf8"),
    );
    const { StartAction } = await import(
      path.join(serviceRoot, "node_modules/@nestjs/cli/actions/start.action.js")
    );
    const existsSync = fs.existsSync;
    const spawn = childProcess.spawn;
    let launchedArgs;
    try {
      fs.existsSync = (file) => outputs.has(path.resolve(file));
      childProcess.spawn = (_binary, args) => {
        launchedArgs = args;
        return {};
      };
      syncBuiltinESMExports();
      StartAction.prototype.spawnChildProcess.call(
        {},
        nest.entryFile ?? "main",
        nest.sourceRoot,
        false,
        path.join(serviceRoot, "dist"),
        process.execPath,
        { shell: false },
      );
    } finally {
      fs.existsSync = existsSync;
      childProcess.spawn = spawn;
      syncBuiltinESMExports();
    }
    assert.deepEqual(launchedArgs, [
      "--enable-source-maps",
      path.join(serviceRoot, "dist/src/main"),
    ]);
    assert.equal(manifest.scripts["start:prod"], "node dist/src/main.js");
    assert.match(
      readFileSync(path.join(serviceRoot, "Dockerfile"), "utf8"),
      /CMD \["node", "dist\/src\/main\.js"\]/,
    );
  });
}

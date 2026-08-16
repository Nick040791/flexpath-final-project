const esbuild = require("esbuild");

module.exports = {
    process(sourceText, sourcePath) {
        const loader = sourcePath.endsWith(".jsx") ? "jsx" : "js";
        const result = esbuild.transformSync(sourceText, {
            loader,
            format: "cjs",
            jsx: "automatic",
            sourcemap: "inline",
            sourcefile: sourcePath,
            target: "node18",
        });

        return { code: result.code };
    },
};
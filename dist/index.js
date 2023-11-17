var $gXNCa$fs = require("fs");
var $gXNCa$os = require("os");
var $gXNCa$https = require("https");
var $gXNCa$nodestreampromises = require("node:stream/promises");
var $gXNCa$nodeutil = require("node:util");
var $gXNCa$nodechild_process = require("node:child_process");
var $gXNCa$actionscore = require("@actions/core");
var $gXNCa$actionsgithub = require("@actions/github");







const $4fa36e821943b400$var$execFileAsync = $gXNCa$nodeutil.promisify($gXNCa$nodechild_process.execFile);

var $4fa36e821943b400$require$getInput = $gXNCa$actionscore.getInput;

var $4fa36e821943b400$require$context = $gXNCa$actionsgithub.context;
const $4fa36e821943b400$var$platforms = [
    "linux",
    "darwin"
];
const $4fa36e821943b400$var$machines = {
    // todo: why are arm64 and aarch64 both in their docs https://nodejs.org/api/os.html#osmachine
    arm64: "arm64",
    aarch64: "arm64",
    x86_64: "amd64"
};
const $4fa36e821943b400$var$cliPath = "./viam-cli";
const $4fa36e821943b400$var$argsConfig = {
    options: {
        "skip-download": {
            type: "boolean"
        }
    }
};
/** download a file and optionally set mode bits */ async function $4fa36e821943b400$var$download(url, dest, mode = $gXNCa$fs.constants.S_IRWXU) {
    const output = $gXNCa$fs.createWriteStream(dest);
    const incoming = await new Promise(function(resolve, _reject) {
        $gXNCa$https.get(url, (incoming)=>resolve(incoming));
    });
    await $gXNCa$nodestreampromises.pipeline(incoming, output);
    if (mode != null) $gXNCa$fs.chmodSync(dest, mode);
}
/** infer the architecture portion of the URL from os.* methods. */ function $4fa36e821943b400$var$archSlug() {
    const platform = $gXNCa$os.platform(), machine = $gXNCa$os.machine();
    if ($4fa36e821943b400$var$platforms.indexOf(platform) == -1) throw Error(`unknown platform ${platform}`);
    if ($4fa36e821943b400$var$machines[machine] == null) throw Error(`unknown machine ${machine}`);
    return `${platform}-${$4fa36e821943b400$var$machines[machine]}`;
}
/** async main */ (async function() {
    const args = $gXNCa$nodeutil.parseArgs($4fa36e821943b400$var$argsConfig);
    const slug = $4fa36e821943b400$var$archSlug();
    console.log("inferred architecture", slug);
    if (!args.values["skip-download"]) {
        await $4fa36e821943b400$var$download(`https://storage.googleapis.com/packages.viam.com/apps/viam-cli/viam-cli-stable-${slug}`, $4fa36e821943b400$var$cliPath);
        console.log("downloaded CLI");
    }
    console.log((await $4fa36e821943b400$var$execFileAsync($4fa36e821943b400$var$cliPath, [
        "version"
    ])).stdout.trim());
    const inputs = {
        keyId: $4fa36e821943b400$require$getInput("key-id"),
        keyValue: $4fa36e821943b400$require$getInput("key-value"),
        version: $4fa36e821943b400$require$getInput("version")
    };
    console.log("I will run with", {
        repo: `https://github.com/${$4fa36e821943b400$require$context.repo.owner}/${$4fa36e821943b400$require$context.repo.repo}`,
        ref: $4fa36e821943b400$require$context.ref,
        version: inputs.version
    });
    console.warn("TODO: start build");
    console.warn("TODO: wait for build");
    console.warn("TODO: show logs / status");
})();


//# sourceMappingURL=index.js.map

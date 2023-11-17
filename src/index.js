const fs = require('fs');
const os = require('os');
const https = require('https');
const stream = require('node:stream/promises');
const util = require('node:util');
const execFileAsync = util.promisify(require('node:child_process').execFile);
const core = require('@actions/core');
const github = require('@actions/github');

const platforms = ['linux', 'darwin'];
const machines = {
    // todo: why are arm64 and aarch64 both in their docs https://nodejs.org/api/os.html#osmachine
    arm64: 'arm64',
    aarch64: 'arm64',
    x86_64: 'amd64',
};
const cliPath = './viam-cli';
const argsConfig = {
    options: {
        "skip-download": { type: 'boolean' },
    },
};

/** download a file and optionally set mode bits */
async function download(url, dest, mode = fs.constants.S_IRWXU) {
    const output = fs.createWriteStream(dest);
    const incoming = await new Promise(function (resolve, _reject) {
        https.get(url, (incoming) => resolve(incoming));
    })
    await stream.pipeline(incoming, output);
    if (mode != null) {
        fs.chmodSync(dest, mode);
    }
}

/** infer the architecture portion of the URL from os.* methods. */
function archSlug() {
    const platform = os.platform(), machine = os.machine();
    if (platforms.indexOf(platform) == -1) {
        throw Error(`unknown platform ${platform}`);
    }
    if (machines[machine] == null) {
        throw Error(`unknown machine ${machine}`);
    }
    return `${platform}-${machines[machine]}`;
}

/** async main */
(async function () {
    const args = util.parseArgs(argsConfig);
    const slug = archSlug();
    console.log('inferred architecture', slug);
    if (!args.values['skip-download']) {
        await download(`https://storage.googleapis.com/packages.viam.com/apps/viam-cli/viam-cli-stable-${slug}`, cliPath);
        console.log('downloaded CLI');
    }
    console.log((await execFileAsync(cliPath, ['version'])).stdout.trim());
    const inputs = {
        keyId: core.getInput('key-id'),
        keyValue: core.getInput('key-value'),
        version: core.getInput('version'),
    };
    console.log('I will run with', {
        repo: `https://github.com/${github.context.repo.owner}/${github.context.repo.repo}`,
        ref: github.context.ref,
        version: inputs.version,
    });
    console.warn("TODO: start build");
    console.warn("TODO: wait for build");
    console.warn("TODO: show logs / status");
})();

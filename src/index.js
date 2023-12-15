const fs = require('node:fs');
const os = require('node:os');
const https = require('node:https');
const stream = require('node:stream/promises');
const util = require('node:util');
const { spawnSync, SpawnSyncReturns } = require('node:child_process');
const { getInput } = require('@actions/core');

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
        "skip-login": { type: 'boolean' },
        "cli-channel": { type: 'string', default: 'stable' },
    },
};
const uuidRegex = /^[\dabcdef\-]+$/;

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

/**
 * take spawnSync's output, print it, crash on error
 * @param {SpawnSyncReturns} result 
*/
function checkSpawnSync(result) {
    if (result.error) {
        throw result.error;
    }
    if (result.status == null) {
        throw Error("hasn't exited");
    }
    process.stderr.write(result.stderr);
    process.stdout.write(result.stdout);
    if (result.status != 0) {
        throw Error(`nonzero exit ${result.status}`);
    }
}

/**
 * get build-id from start command
 * @param {Buffer} stdout stdout of 'start' command
 * @returns {String} build ID
 */
function parseBuildId(stdout) {
    // todo: consume this as json or other machine-readable format
    const buildId = stdout.toString().split('\n')[0];
    console.log('using build ID', buildId);
    if (uuidRegex.exec(buildId) == null) {
        console.warn("build ID doesn't appear to be a UUID, parse may have failed");
    }
    return buildId;
}

/** async main */
(async function () {
    const args = util.parseArgs(argsConfig);
    const slug = archSlug();
    console.log('inferred architecture', slug);
    if (!args.values['skip-download']) {
        await download(`https://storage.googleapis.com/packages.viam.com/apps/viam-cli/viam-cli-${args.values['cli-channel']}-${slug}`, cliPath);
        console.log('downloaded CLI');
    }
    checkSpawnSync(spawnSync(cliPath, ['version']));
    const inputs = {
        keyId: getInput('key-id'),
        keyValue: getInput('key-value'),
        version: getInput('version'),
        ref: getInput('ref'),
    };
    if (!args.values['skip-login']) {
        checkSpawnSync(spawnSync(cliPath, ['login', 'api-key', '--key-id', inputs.keyId, '--key', inputs.keyValue]));
    }
    const config = {
        ref: inputs.ref || '',
        version: inputs.version || '',
    }
    console.log('I will run with', config);
    const startArgs = ['module', 'build', 'start', '--version', config.version, '--ref', config.ref];
    const spawnRet = spawnSync(cliPath, startArgs);
    checkSpawnSync(spawnRet);
    const buildId = parseBuildId(spawnRet.stdout);
    console.log('waiting for build');
    checkSpawnSync(spawnSync(cliPath, ['module', 'build', 'logs', '--id', buildId, '--wait']));
})();

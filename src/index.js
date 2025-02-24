const fs = require('node:fs');
const os = require('node:os');
const https = require('node:https');
const stream = require('node:stream/promises');
const util = require('node:util');
const { spawnSync, SpawnSyncReturns, spawn, ChildProcessWithoutNullStreams } = require('node:child_process'); // eslint-disable-line no-unused-vars
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
const uuidRegex = /^[\dabcdef-]+$/;

/** download a file and optionally set mode bits */
async function download(url, dest, mode = fs.constants.S_IRWXU) {
    const output = fs.createWriteStream(dest);
    const incoming = await new Promise(function (resolve) {
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
 * forward output from child process, crash on error
 * @param {ChildProcessWithoutNullStreams} child
 */
async function checkSpawn(child) {
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    await new Promise(function (resolve, reject) {
        child.on('close', function (code, signal) {
            if (signal != null) {
                reject(new Error(`terminated with signal ${signal}`));
            }
            if (code == 0) {
                resolve();
            } else {
                reject(new Error(`exited with code ${code}`));
            }
        });
    });
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
    if (!args.values['skip-download']) {
        await download(`https://storage.googleapis.com/packages.viam.com/apps/viam-cli/viam-cli-${args.values['cli-channel']}-${slug}`, cliPath);
        console.log('downloaded CLI for', args.values['cli-channel'], slug);
    }
    checkSpawnSync(spawnSync(cliPath, ['version']));
    if (!args.values['skip-login']) {
        checkSpawnSync(spawnSync(cliPath, ['login', 'api-key', '--key-id', getInput('key-id'), '--key', getInput('key-value')]));
    }
    const config = {
        ref: getInput('ref') || '',
        version: getInput('version') || '',
    }
    console.log('I will run with', config);
    const startArgs = ['module', 'build', 'start', '--version', config.version];
    if (config.ref) {
        startArgs.push('--ref', config.ref);
    }
    if (getInput('token')) {
        startArgs.push('--token', getInput('token'));
    }
    if (getInput('workdir')) {
        startArgs.push('--workdir', getInput('workdir'));
    }
    const spawnRet = spawnSync(cliPath, startArgs);
    checkSpawnSync(spawnRet);
    const buildId = parseBuildId(spawnRet.stdout);
    console.log('waiting for build');
    await checkSpawn(spawn(cliPath, ['module', 'build', 'logs', '--id', buildId, '--wait', '--group-logs']));
})();

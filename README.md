# build-action

This is a Github CI action which wraps Viam's cloud build system. Use this to build and publish your Viam module for multiple platforms.

If you run into trouble setting this up, file a bug on this repo or reach out on our [Discord](https://discord.gg/viam).

## What is Viam cloud build?

Cloud build is cross-compilation infrastructure that we provide to module authors so you can publish your module for multiple platforms: x86, ARM Linux, and MacOS.

Your customers are deploying to different kinds of hardware, and prototyping on a laptop. Cloud build helps you to reach them everywhere without doing the heavy lifting of operating your own buildsystem.

## Basic usage

1. Create a .github/workflows/viam-build.yml in your repo with these default contents:

    ```yml
    # see https://github.com/viamrobotics/build-action for help
    on:
      push:
        tags:
        - '[0-9]+.[0-9]+.[0-9]+'
    
    jobs:
      publish:
        runs-on: ubuntu-latest
        steps:
        - uses: actions/checkout@v3
        - uses: viamrobotics/build-action@v1
          with:
            # note: you can replace this line with 'version: ""' if you want to test the build process without deploying
            version: ${{ github.ref_name }}
            ref: ${{ github.sha }}
            key-id: ${{ secrets.viam_key_id }}
            key-value: ${{ secrets.viam_key_value }}
    ```

1. Add your build commands in your meta.json ([instructions below](#build-commands)).
   If you don't have a meta.json, start with the 'create' and 'upload' sections of our [registry docs](https://docs.viam.com/registry/)).

   Here's an example, taken from our [golang wifi repo](https://github.com/viam-labs/wifi-sensor):

   ```json
   {
     "module_id": "viam:golang-wifi-example",
     ...
     "build": {
       "build": "make module.tar.gz",
       "arch" : ["linux/amd64", "linux/arm64", "darwin/arm64"]
     }
   }
   ```

   You can test this command by running the following command on your development machine:
  
   ```sh
   viam module build local
   ```

   The command will run your build instructions without running a cloud build job.
  
1. Set up repo secrets using the [auth instructions](#auth-instructions) below
1. Create a tag like `0.0.1` and push to GitHub; your module should build and deploy on the desired platforms.

## Auth instructions

1. Run `viam organizations list` to view your organization ID.
2. Create an organization API key by running the following command:
   ```
   viam organization api-key create --org-id YOUR_ORG_UUID --name descriptive-key-name
   ```
   This command outputs an ID + a value, both of which you will use in step 4 below.
   If the command doesn't exist, update your CLI version.
4. In the GitHub repo for your project, go to 'Settings' -> 'Secrets and variables' -> 'Actions'
5. Create two new secrets using the 'New repository secret' button:
  - `viam_key_id` with the UUID from "Key ID:" in your terminal
  - `viam_key_value` with the string from "Key Value:" in your terminal
5. All set! If you copy the YAML example above, it will use these secrets to authenticate to Viam. If you have already tried the action and it failed because the secrets were missing, you can trigger a re-run from your repo's 'Actions' tab.

## Environment and base image

On Linux builds, you'll be using the same Debian layer that builds our golang RDK. If something is missing, you can `apt-get install` it.

For MacOS, you'll have a runner with most of the libraries for our golang RDK installed as homebrew packages. If something is missing, you can `brew install` it.

## Examples

- [Golang](https://github.com/viam-labs/wifi-sensor)
  - [CI yaml](https://github.com/viam-labs/wifi-sensor/blob/main/.github/workflows/build.yml)
  - [meta.json](https://github.com/viam-labs/wifi-sensor/blob/main/meta.json)
- [C++](https://github.com/viamrobotics/module-example-cpp)
  - [CI yaml](https://github.com/viamrobotics/module-example-cpp/blob/main/.github/workflows/build2.yml)
  - [meta.json](https://github.com/viamrobotics/module-example-cpp/blob/main/meta.json)

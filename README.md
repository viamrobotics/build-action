> [!WARNING]
> This is pre-release and you should not use it yet. You probably want the old [upload-module action](https://github.com/viamrobotics/upload-module)

# build-action

This is a Github CI action which wraps Viam's cloud build system. Use this to build and publish your Viam module for multiple platforms.

## What is Viam cloud build?

Cloud build is cross-compilation infrastructure that we provide to module authors so you can publish your module for multiple platforms. (x86 and ARM Linux, ideally MacOS as well).

Your customers are deploying to different kinds of hardware, and prototyping on a laptop. Cloud build helps you to reach them everywhere without doing the heavy lifting of operating your own buildsystem.

## Basic usage

1. Set up build commands in your meta.json ([instructions below](#build-commands)). You can test these on your laptop by running `viam module build local`
1. Create a .github/workflows/viam-build.yml in your repo with the default contents below
1. Set up repo secrets using [auth instructions](#auth-instructions) below
1. Create a tag like 0.0.1 (todo: make this an RC and link to RC) and push to github; your module should build and deploy on the desired platforms

Default contents:

```yml
# see https://github.com/viamrobotics/upload-module for help
# todo: example should restrict to tags
on:
  push:

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: viamrobotics/build-action@main
      with:
        version: ${{ github.ref_name }}
        key-id: ${{ secrets.viam_key_id }}
        key-value: ${{ secrets.viam_key_value }}
```

## Auth instructions

## Environment and base image

## Examples

- ...

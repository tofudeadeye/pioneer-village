# Pioneer Village

A RedM Framework.

## Features

* Separated Game and API server.
* Single UI resource using layers that looks the same at all resolutions. Constrained to 16:9.

## Quick Start

* Copy `.env.example` to `.env` and update any necessary values.
* Copy `resources-local.cfg.example` to `resources-local.cfg` these are just some dev focused scripts.
* Copy `local.cfg.example` to `local.cfg` and set your `sv_licenseKey` & `steam_webApiKey`.
* Run `yarn install` to install dependencies.
* Run `yarn run download-server` to download the fx server version from `package.json`.
* Run `yarn run watch` to build and watch resources for development.
* Run `yarn run start` to start the fx server.

## Links

[Documentation](docs/README.md)

[Patreon](https://www.patreon.com/spAnser)

[License](LICENSE.txt)

# bot.land - Google Apps Script project starter

This repository aims at building how one or more bots on [Bot Land](https://play.bot.land).

If you're familiar with SC2 units, they include things like

- micro / blink Stalkers that kite enemies
- a unit that specializes in melee combat
- micro "Siege Tanks" (artillery)
- support units (medic, repair, etc.)

## Features

- Modern javascript features (Typescript)
- Optional static and infered typing (Typescript)
- Code isolation and reuse (by using Typescript `namespace` statements and project references)
- Incremental builds (Typescript 3.4)
- Fine control on how source `*.ts` files get compiled into target `*.js` files
- Code pretty printing and linting (Prettier and Tslint)

## Installation

1. clone this repository: `git clone https://github.com/PopGoesTheWza/bot.land.git`
1. install local dependencies: `npm install`

## Build

Several commands are available as NPM scripts: `npm run <command>`. The most commonly used are:

- `build` and  `build-clean` to compile all bots
- `format` and `lint` to normalise code and check its correcteness

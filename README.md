klaytn-contract-deploy
=================

klaytn-contract-deploy is an unofficial toolkit for deploying contracts in Klaytn.

Requirements
=================

The following packages are required to use the klaytn-contract-deploy.
- [Node.js](https://nodejs.org/en/download/)
- [npm](https://www.npmjs.com/get-npm)
- [solc 0.5.6 or greater](https://solidity.readthedocs.io/en/v0.5.6/installing-solidity.html/)

Installation
=================
To try it out, install klaytn-contract-deploy with npm like following command:

```
$ npm install -g klaytn-contract-deploy 
```

Getting Started
=================
By default, usage is the same as truffle if possible. Follow these steps:

- Create your npm project derectory.
- Run `kdep init`.
- Copy your solidity files to the `contracts` directoy.
- Edit `1_initial_migration.js`.
- Edit `kdep-config.js`.
- Run `kdep deploy --network {YOUR_NETWORK}`

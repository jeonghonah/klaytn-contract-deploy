#!/usr/bin/env node

let action

const Caver = require('caver-js');
const fs = require('fs')
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const program = require('commander');
program
    .option('-n, --network <required>', 'network')
    .option('-r, --reset', 'reset');
program
    .command('deploy')
    .description('deploy contracts')
    .action(() => { action = "deploy" });
program
    .command('init')
    .description('init kdep project')
    .action(() => { action = "init" });
program
    .command('bridge')
    .description('deploy predefined bridge contracts for Service Chain')
    .action(() => { action = "bridge" });
program
    .command('test')
    .description('run deploy and send tx (TBA)')
    .action(() => { action = "test" });

const templates = require('./lib/templates.js');

const CWD = process.cwd()
const supportedCommands = { init: true, deploy: true, bridge: true, test: false }
const msg = {
    usageBasic: "Usage: kdep [init, deploy, bridge, test] [options]",
    usageDeploy: "Usage: kdep deploy --network <network name>"
};

artifacts = { require : genSolidityInfo};

(async function() {
    // Step 0: handle command argument (deploy, bridge-deploy, test)
    if (process.argv.length < 2) {
        console.log(msg.usageBasic);
        process.exit(1);
    }

    let subcmd = process.argv[2]
    if (!supportedCommands[subcmd]) {
        console.log(msg.usageBasic);
        process.exit(1);
    }

    const opts = program.parse(process.argv)

    switch (action) {
        case "init":
        actionInit(opts);
        break;
        case "deploy":
        actionDeploy(opts);
        break;
        case "bridge":
        actionBridge(opts);
        break;
    }
})()

function genSolidityInfo(target) {
    if (target == "Migrations") {
        return
    }
    let name = target.split("/")
    if (name.length > 1)
        name = name[name.length-1]
    else
        name = name[0]

    return {
        abi : JSON.parse(fs.readFileSync(`${CWD}/build/contracts/${name}.abi`, 'utf8')),
        code : fs.readFileSync(`${CWD}/build/contracts/${name}.bin`, 'utf8')
    }
}

async function actionDeploy(opts) {
    if (!opts.network) {
        console.log(msg.usageDeploy);
        process.exit(1);
    }

    // Step 1: compile solidity files
    try {
        const cmd = "solc contracts/*/*.sol --allow-paths . --bin --abi -o build/contracts --overwrite";
        await exec(cmd);
    } catch (e) {
        console.error(e);
    }

    // Step 2: create instance
    const conf = require(CWD + '/kdep-config.js')
    caver = new Caver(`http://${conf.networks[opts.network].host}:${conf.networks[opts.network].port}`);

    // Step 3: deploy
    let deployer = {
        deploy : function(sol) {
            if (!sol) return
            const instance = new caver.klay.Contract(sol.abi);
            let args = Array.prototype.slice.call(arguments);
            _args = args.slice(1, args.length)
            return instance.deploy({data: sol.code, arguments: _args})
                .send({ from: conf.networks[opts.network].from, gas: 100000000, value: 0 })
        },
        network: opts.network
    };
    const migration = require(CWD + '/migrations/1_initial_migration.js');
    migration(deployer);
}

async function actionInit(opts) {
    try {
        await exec(`mkdir -p ${CWD}/contracts`);
        await exec(`mkdir -p ${CWD}/migrations`);
        await exec(`echo '${templates.configFile}' >> ${CWD}/kdep-config.js`);
        await exec(`echo '${templates.migrationFile}' >> ${CWD}/migrations/1_initial_migration.js`);
    } catch (e) {
        console.error(e);
    }
}

async function actionBridge(opts) {
    // Step 0: git clone klaytn
    await exec(`git clone https://github.com/klaytn/klaytn.git ${CWD}/contracts/klaytn`);

    // Step 1: compile solidity files
    try {
        let cmd
        cmd = `solc ${CWD}/contracts/klaytn/contracts/bridge/Bridge.sol --allow-paths . --bin --abi -o build/contracts --overwrite`;
        await exec(cmd);
        cmd = `solc ${CWD}/contracts/klaytn/contracts/sc_erc20/sc_token.sol --allow-paths . --bin --abi -o build/contracts --overwrite`;
        await exec(cmd);
        cmd = `solc ${CWD}/contracts/klaytn/contracts/sc_erc721/sc_nft.sol --allow-paths . --bin --abi -o build/contracts --overwrite`;
        await exec(cmd);
    } catch (e) {
        console.error(e);
    }

    // Step 2: call deploy
}

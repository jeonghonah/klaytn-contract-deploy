#!/usr/bin/env node

let carver
let action

const Caver = require('caver-js');
const fs = require('fs')
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const program = require('commander');
program
    .option('-n, --network <required>', 'network')
    .option('-r, --reset', 'reset')
    .command('deploy')
    .description('deploy contracts')
    .action(() => { action = "deploy" });

const CWD = process.cwd()
const conf = require(CWD + '/kdep-config.js')
const supportedCommands = { deploy: true, bridgedeploy: false, test: false }
const msg = { usage: "Usage: kdep [deploy, bridge-deploy, test] --network <network name>" };

artifacts = { require : genSolidityInfo};

(async function() {
    // Step 0: handle command argument (deploy, bridge-deploy, test)
    if (process.argv.length < 3) {
        console.log(msg.usage);
        process.exit(1);
    }

    let subcmd = process.argv[2]
    if (!supportedCommands[subcmd]) {
        console.log(msg.usage);
        process.exit(1);
    }

    const opts = program.parse(process.argv)
    if (!opts.network) {
        console.log(msg.usage);
        process.exit(1);
    }

    // Step 1: compile solidity files
    try {
        const cmd = "solc contracts/*/*.sol --allow-paths . --bin --abi -o build/contracts --overwrite";
        await exec(cmd);
    } catch (e) {
        console.error(e);
    }

    // Step 2: create caver
    caver = new Caver(`http://${conf.networks[opts.network].host}:${conf.networks[opts.network].port}`);

    // Step 3: deploy
    if (action == "deploy") {
        actionDeploy(opts);
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

function actionDeploy (opts) {
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

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
    .description('deploy bridge contract (TBA)')
    .action(() => { action = "bridge" });

const CWD = process.cwd()
const supportedCommands = { init: true, deploy: true, bridge: false, test: false }
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

    // Step 1: create instance
    const conf = require(CWD + '/kdep-config.js')
    caver = new Caver(`http://${conf.networks[opts.network].host}:${conf.networks[opts.network].port}`);

    // Step 2: compile solidity files
    try {
        let compilerOpts = ""
        if (conf.compilers && conf.compilers.solc && conf.compilers.solc.optimizer) {
            let optimizer = conf.compilers.solc.optimizer
            if (optimizer.enabled) {
                compilerOpts += " --optimize"
            }
            if (optimizer.runs) {
                compilerOpts += " --optimize-runs " + optimizer.runs
            }
        } else {
            compilerOpts += " --optimize --optimize-runs 200"
        }
        const cmd = "solc contracts/*/*.sol --allow-paths . --bin --abi -o build/contracts --overwrite" + compilerOpts;
        console.log("compiling.. ", cmd)
        await exec(cmd);
    } catch (e) {
        console.error(e);
    }

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
        await exec(`echo '${configFile}' >> ${CWD}/kdep-config.js`);
        await exec(`echo '${migrationFile}' >> ${CWD}/migrations/1_initial_migration.js`);
    } catch (e) {
        console.error(e);
    }
}

function actionBridge(opts) {
    console.log("bridge deploy is not yet supported.")
}

const configFile = '\
module.exports = {\n\
    networks: {\n\
        mainchain: {\n\
            host: "127.0.0.1",\n\
            port: 8551,\n\
            from: "0x", // enter your publickey\n\
            network_id: "1", // Baobab network id\n\
            gas: 800000, // transaction gas limit\n\
            gasPrice: 25000000000, // gasPrice of Baobab is 25 Gpeb\n\
        },\n\
        servicechain: {\n\
            host: "127.0.0.1",\n\
            port: 7551,\n\
            from: "0x", // enter your publickey\n\
            network_id: "1000", // Service Chain network id\n\
            gas: 800000, // transaction gas limit\n\
            gasPrice: 25, // gasPrice of Service Chain\n\
        },\n\
    },\n\
    compilers: {\n\
        solc: {\n\
            optimizer: {\n\
                enabled: true,\n\
                runs: 200,\n\
            },\n\
        },\n\
    },\n\
};\
';

const migrationFile = '\
const fs = require("fs")\n\
\n\
const Migrations = artifacts.require("Migrations");\n\
\n\
module.exports = function(deployer) {\n\
    deployer.deploy(Migrations)\n\
};\
';

let templates = {}
templates.configFile = '\
module.exports = {\n\
    networks: {\n\
        mainchain: {\n\
            host: "127.0.0.1",\n\
            port: 8551,\n\
            from: "0x", // enter your public key\n\
            fromKey: "0x", // enter your private key\n\
            network_id: "1", // Baobab network id\n\
            gas: 800000, // transaction gas limit\n\
            gasPrice: 25000000000, // gasPrice of Baobab is 25 Gpeb\n\
        },\n\
        servicechain: {\n\
            host: "127.0.0.1",\n\
            port: 7551,\n\
            from: "0x", // enter your publickey\n\
            fromKey: "0x", // enter your private key\n\
            network_id: "1000", // Service Chain network id\n\
            gas: 800000, // transaction gas limit\n\
            gasPrice: 25, // gasPrice of Service Chain\n\
        },\n\
    },\n\
};\
';

templates.migrationFile = '\
const fs = require("fs")\n\
\n\
const Migrations = artifacts.require("Migrations");\n\
\n\
module.exports = function(deployer) {\n\
    deployer.deploy(Migrations)\n\
};\
';

module.exports = templates

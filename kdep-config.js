module.exports = {
    networks: {
        mainchain: {
            host: "127.0.0.1",
            port: 8551,
            from: "0x", // enter your publickey
            network_id: "1", // Baobab network id
            gas: 800000, // transaction gas limit
            gasPrice: 25000000000, // gasPrice of Baobab is 25 Gpeb
        },
        servicechain: {
            host: "127.0.0.1",
            port: 7551,
            from: "0x", // enter your publickey
            network_id: "1000", // Service Chain network id
            gas: 800000, // transaction gas limit
            gasPrice: 25, // gasPrice of Service Chain
        },
    },
};

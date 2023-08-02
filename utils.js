module.exports = {
    async fetchFromExchange(url) {
        let myHeaders = new Headers();
        myHeaders.append("apikey", process.env.EXCHANGE_API_KEY);
        const reqOptions = {
            method: "get",
            redirect: "follow",
            headers: myHeaders,
        };

        const response = await fetch(url, reqOptions);
        if (!response.ok) {
            throw {
                message: "failure from exchange api",
                status: response.status,
                statusText: response.statusText,
            };
        }
        const data = await response.json();
        return data;
    },

    async dataFetch(url, source) {
        let response;
        if (source && source === "exchange-api") {
            let myHeaders = new Headers();
            myHeaders.append("apikey", process.env.EXCHANGE_API_KEY);
            const reqOptions = {
                method: "get",
                redirect: "follow",
                headers: myHeaders,
            };
            response = await fetch(url, reqOptions);
        } else {
            response = await fetch(url);
        }

        if (!response.ok) {
            throw {
                message: "Error in retrieving data",
                status: response.status,
                statusText: response.statusText,
            };
        }
        const data = await response.json();
        return data;
    },
};

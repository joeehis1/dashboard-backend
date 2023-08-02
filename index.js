const express = require("express");
const dotenv = require("dotenv");
const app = express();
const cors = require("cors");
const { fetchFromExchange, dataFetch } = require("./utils");
const port = process.env.PORT || 3000;
dotenv.config({ path: "./vars/.env" });

const cache = {};
const cacheExp = 60 * 60 * 1000;

const allowedOrigins = ["http://localhost:5173"];
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
    cors({
        origin: function (origin, callback) {
            if (allowedOrigins.includes(origin) || !origin) {
                callback(null, true);
            } else {
                callback(Error("Not allowed by cors"));
            }
        },
        optionsSuccessStatus: 200,
    })
);

app.get("/api/currency-list", async (req, res) => {
    const url = `https://api.apilayer.com/exchangerates_data/symbols`;

    if (cache[url] && Date.now() - cache.listTimeStamp < cacheExp) {
        return res.status(200).json(cache[url]);
    }

    try {
        const data = await dataFetch(url, "exchange-api");

        const { symbols } = data;
        const symbolList = Object.entries(symbols).map(([symbol, country]) => {
            return { symbol, country };
        });

        cache[url] = symbolList;
        cache.listTimeStamp = Date.now();

        res.status(200).json(symbolList);
    } catch (error) {
        res.status(500).json(error);
    }
});

app.post("/api/convert", async (req, res) => {
    const { base, target, amount } = req.body;
    const url = `https://api.apilayer.com/exchangerates_data/convert?to=${target}&from=${base}&amount=${amount}`;

    if (cache[url] && Date.now() - cache.convertTs < cacheExp) {
        return res.status(200).json(cache[url]);
    }

    try {
        const data = await fetchFromExchange(url);

        cache[url] = data;
        cache.convertTs = data.info.timeStamp;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json(error);
    }
});

app.post("/current-weather", async (req, res) => {
    const { lat, long } = req.body;

    const currWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&units=metric&appid=${process.env.OWM_KEY}`;

    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${long}&units=metric&appid=${process.env.OWM_KEY}`;

    const weatherPromise = await dataFetch(currWeatherUrl);
    const forecastPromise = await dataFetch(forecastUrl);

    Promise.all([weatherPromise, forecastPromise])
        .then((values) => {
            res.status(200).json(values);
        })
        .catch((err) => {
            res.status(500).json(err);
        });
});

app.get("/random-image", async (req, res) => {
    const url = `https://api.unsplash.com/photos/random?client_id=${process.env.UNSPLASH_ACCESS_KEY}&orientation=landscape`;

    try {
        const imageData = await dataFetch(url);
        res.status(200).json(imageData);
    } catch (error) {
        res.status(500).json(error);
    }
});

app.get("/random-quote", async (req, res) => {
    const url = `https://zenquotes.io/api/quotes`;
    if (cache[url] && Date.now() - cache.quoteTimeStamp < 8.64e7) {
        const quotes = cache[url];
        const randomIndex = Math.floor(Math.random() * quotes.length);
        console.log("sending from cache");
        return res.status(200).json(quotes[randomIndex]);
    }
    try {
        const quoteData = await dataFetch(url);
        const randomIndex = Math.floor(Math.random() * quoteData.length);
        console.log("sending from external source");
        res.status(200).json(quoteData[randomIndex]);
        cache[url] = quoteData;
        cache.quoteTimeStamp = Date.now();
    } catch (error) {
        res.status(500).json(error);
    }
});

app.listen(port, () => {
    console.log("listening");
});

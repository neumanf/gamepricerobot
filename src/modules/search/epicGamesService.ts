import axios from "axios";
import * as cheerio from "cheerio";

export interface IEpicGame {
    title?: string;
    image?: string;
    url?: string;
    discount?: string;
    undiscountedPrice?: string;
    price?: string;
}

export class EpicGamesService {
    private games: IEpicGame[] = [];

    async handle(game: string) {
        try {
            const { data } = await axios.get(
                `https://www.epicgames.com/store/en-US/browse?q=${game}&sortBy=relevancy&sortDir=DESC&count=20`,
            );
            const $ = cheerio.load(data);

            const results = $("body").find("section[data-component='BrowseGrid'] > ul > li");

            results.map((i, el) => {
                const game: IEpicGame = {};

                game.title = $(el).find("span[data-component='OfferTitleInfo']").text().trim();

                // FIX: fix url
                game.image = $(el).find("div[data-component='OfferCardImagePortrait'] > div > img").attr("src");

                game.url = "https://www.epicgames.com" + $(el).find("a").attr("href");

                game.discount = $(el)
                    .find(
                        "div[data-component='PriceLayout'] > div > span[data-component='Text'] > div[data-component='BaseTag']",
                    )
                    .text()
                    .trim();

                game.undiscountedPrice = $(el)
                    .find(
                        "div[data-component='PriceLayout'] > span > div > span[data-component='Text'] > div[data-component='PDPDiscountedFromPrice']",
                    )
                    .text()
                    .trim();

                game.price = $(el)
                    .find(`div[data-component='PriceLayout'] > span > div${game.discount ? ":nth-child(2)" : ""}`)
                    .text()
                    .trim();

                this.games.push(game);
            });

            return this.games;
        } catch (error) {
            console.error(error);
        }
    }
}

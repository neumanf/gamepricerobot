import axios from "axios";
import * as cheerio from "cheerio";

import { IGame } from "../../interfaces/game";

export class EpicGamesService {
    private games: IGame[] = [];

    async handle(game: string) {
        try {
            const { data } = await axios.get(
                `https://www.epicgames.com/store/en-US/browse?q=${game}&sortBy=relevancy&sortDir=DESC&count=20`,
            );
            const $ = cheerio.load(data);

            const results = $("body").find("section[data-component='BrowseGrid'] > ul > li");

            results.map((i, el) => {
                const game: IGame = {
                    title: $(el).find("span[data-component='OfferTitleInfo']").text().trim(),
                    image: $(el).find("div[data-component='OfferCardImagePortrait'] > div > img").attr("src") ?? "",
                    url: "https://www.epicgames.com" + $(el).find("a").attr("href"),
                    discount: $(el)
                        .find(
                            "div[data-component='PriceLayout'] > div > span[data-component='Text'] > div[data-component='BaseTag']",
                        )
                        .text()
                        .trim(),
                    undiscountedPrice: $(el)
                        .find(
                            "div[data-component='PriceLayout'] > span > div > span[data-component='Text'] > div[data-component='PDPDiscountedFromPrice']",
                        )
                        .text()
                        .trim(),
                    get price() {
                        return $(el)
                            .find(
                                `div[data-component='PriceLayout'] > span > div${this.discount ? ":nth-child(2)" : ""}`,
                            )
                            .text()
                            .trim();
                    },
                };

                this.games.push(game);
            });

            return this.games;
        } catch (error) {
            console.error(error);
        }
    }
}

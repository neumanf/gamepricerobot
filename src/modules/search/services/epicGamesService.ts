import axios from "axios";
import * as cheerio from "cheerio";

import { IGame, IGameService } from "../../../interfaces";

export class EpicGamesService implements IGameService {
    private games: IGame[] = [];

    private getTitle($: cheerio.CheerioAPI, el: cheerio.Element): string {
        return $(el).find("span[data-component='OfferTitleInfo']").text().trim();
    }

    private getImage($: cheerio.CheerioAPI, el: cheerio.Element): string {
        return $(el).find("div[data-component='OfferCardImagePortrait'] > div > img").attr("src") ?? "";
    }

    private getURL($: cheerio.CheerioAPI, el: cheerio.Element): string {
        return "https://www.epicgames.com" + $(el).find("a").attr("href");
    }

    private getDiscount($: cheerio.CheerioAPI, el: cheerio.Element): string {
        return $(el)
            .find(
                "div[data-component='PriceLayout'] > div > span[data-component='Text'] > div[data-component='BaseTag']",
            )
            .text()
            .trim();
    }

    private getUndiscountedPrice($: cheerio.CheerioAPI, el: cheerio.Element): string {
        return $(el)
            .find(
                "div[data-component='PriceLayout'] > span > div > span[data-component='Text'] > div[data-component='PDPDiscountedFromPrice']",
            )
            .text()
            .trim();
    }

    private getPrice($: cheerio.CheerioAPI, el: cheerio.Element): string {
        return $(el)
            .find(`div[data-component='PriceLayout'] > span > div${this.getDiscount($, el) ? ":nth-child(2)" : ""}`)
            .text()
            .trim();
    }

    async handle(game: string): Promise<IGame[]> {
        try {
            const { data } = await axios.get(
                `https://www.epicgames.com/store/en-US/browse?q=${game}&sortBy=relevancy&sortDir=DESC&count=20`,
            );
            const $ = cheerio.load(data);

            const results = $("body").find("section[data-component='BrowseGrid'] > ul > li");

            results.map((i, el) => {
                const game: IGame = {
                    title: this.getTitle($, el),
                    image: this.getImage($, el),
                    url: this.getURL($, el),
                    discount: this.getDiscount($, el),
                    undiscountedPrice: this.getUndiscountedPrice($, el),
                    price: this.getPrice($, el),
                };

                this.games.push(game);
            });

            return this.games;
        } catch (error) {
            console.error(error);
            return [];
        }
    }
}

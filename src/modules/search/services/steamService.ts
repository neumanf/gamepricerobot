import axios from "axios";
import * as cheerio from "cheerio";

import { IGame, IGameService } from "../../../interfaces";

export class SteamService implements IGameService {
    private games: IGame[] = [];

    private getTitle($: cheerio.CheerioAPI, el: cheerio.Element): string {
        return $(el)
            .find(".responsive_search_name_combined")
            .find("div[class='col search_name ellipsis'] > span[class='title']")
            .text();
    }

    private getImage($: cheerio.CheerioAPI, el: cheerio.Element): string {
        return $(el).find(".search_result_row > .search_capsule > img").attr("src") ?? "";
    }

    private getURL($: cheerio.CheerioAPI, el: cheerio.Element): string {
        return $(el).attr("href") ?? "";
    }

    private getDiscount($: cheerio.CheerioAPI, el: cheerio.Element): string {
        return $(el).find(".search_discount").text().trim();
    }

    private getUndiscountedPrice($: cheerio.CheerioAPI, el: cheerio.Element, gamePrices: RegExpExecArray): string {
        return this.getDiscount($, el) ? gamePrices?.[1].trim() : "";
    }

    private getPrice(
        $: cheerio.CheerioAPI,
        el: cheerio.Element,
        gamePrices: RegExpExecArray,
        gamePriceHtml: string,
    ): string {
        return this.getDiscount($, el) ? gamePrices?.[2].trim() : gamePriceHtml ? gamePriceHtml.trim() : "";
    }

    async handle(game: string): Promise<IGame[]> {
        try {
            const { data } = await axios.get(`https://store.steampowered.com/search/?term=${game}`);
            const $ = cheerio.load(data);

            const results = $("body").find("#search_result_container > #search_resultsRows > a");

            results.map((i, el) => {
                const gamePriceHtml = $(el).find(".search_price").html();

                if (!gamePriceHtml) return;

                const gamePrices = /.*<strike>(.+)<\/strike>.*<br>(.+)/.exec(gamePriceHtml);

                if (!gamePrices) return;

                const game: IGame = {
                    title: this.getTitle($, el),
                    image: this.getImage($, el),
                    url: this.getURL($, el),
                    discount: this.getDiscount($, el),
                    undiscountedPrice: this.getUndiscountedPrice($, el, gamePrices),
                    price: this.getPrice($, el, gamePrices, gamePriceHtml),
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

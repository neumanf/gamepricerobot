import axios from "axios";
import * as cheerio from "cheerio";

import { IGame } from "../../../interfaces/game";

export class SteamService {
    private games: IGame[] = [];

    async handle(game: string) {
        try {
            const { data } = await axios.get(`https://store.steampowered.com/search/?term=${game}`);
            const $ = cheerio.load(data);

            const results = $("body").find("#search_result_container > #search_resultsRows > a");

            results.map((i, el) => {
                const gamePriceHtml = $(el).find(".search_price").html();
                const gamePrices = /.*<strike>(.+)<\/strike>.*<br>(.+)/.exec(gamePriceHtml as string);

                if (!gamePrices) return;

                const game: IGame = {
                    title: $(el)
                        .find(".responsive_search_name_combined")
                        .find("div[class='col search_name ellipsis'] > span[class='title']")
                        .text(),
                    image: $(el).find(".search_result_row > .search_capsule > img").attr("src") ?? "",
                    url: $(el).attr("href") ?? "",
                    discount: $(el).find(".search_discount").text().trim(),
                    get undiscountedPrice() {
                        return this.discount ? gamePrices?.[1].trim() : "";
                    },
                    get price() {
                        return this.discount ? gamePrices?.[2].trim() : gamePriceHtml ? gamePriceHtml.trim() : "";
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

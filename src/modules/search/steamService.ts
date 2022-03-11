import axios from "axios";
import * as cheerio from "cheerio";

interface ISteamGame {
    title?: string;
    image?: string;
    url?: string;
    discount?: string;
    discountedPrice?: string;
    price?: string;
}

export class SteamService {
    private games: ISteamGame[] = [];

    async handle(game: string) {
        try {
            const { data } = await axios.get(
                `https://store.steampowered.com/search/?term=${game}`
            );
            const $ = cheerio.load(data);

            const results = $("body").find(
                "#search_result_container > #search_resultsRows > a"
            );

            results.map((i, el) => {
                const gamePriceHtml = $(el).find(".search_price").html();

                const gamePrices = /.*<strike>(.+)<\/strike>.*<br>(.+)/.exec(
                    gamePriceHtml as string
                );
                let game: ISteamGame = {};

                game.title = $(el)
                    .find(".responsive_search_name_combined")
                    .find(
                        "div[class='col search_name ellipsis'] > span[class='title']"
                    )
                    .text();

                game.image = $(el)
                    .find(".search_result_row > .search_capsule > img")
                    .attr("src");

                game.url = $(el).attr("href");

                game.discount = $(el).find(".search_discount").text().trim();

                game.discountedPrice = game.discount
                    ? gamePrices![2].trim()
                    : "";

                game.price = game.discount
                    ? gamePrices![1].trim()
                    : gamePriceHtml
                    ? gamePriceHtml.trim()
                    : "";

                this.games.push(game);
            });

            return this.games;
        } catch (error) {
            console.error(error);
        }
    }
}

import { Context, InlineKeyboard } from "grammy";
// FIX: import from another place
import { InlineQueryResult } from "grammy/out/platform.node";

import { ISteamGame, SteamService } from "./steamService";

export class SearchController {
    private steamService: SteamService;

    constructor({ steamService }: { steamService: SteamService }) {
        this.steamService = steamService;

        this.handle = this.handle.bind(this);
    }

    private getMessageText(game: ISteamGame) {
        return (
            `<b>${game.title}</b>\n\n` +
            `${game.discount ? `<b>📈 Discount:</b> ${game.discount}\n` : ""}` +
            `<b>💵 Price:</b> ${game.discount ? game.discountedPrice : game.price}`
        );
    }

    async handle(ctx: Context) {
        if (!ctx.match?.[0]) return;

        const games = await this.steamService.handle(ctx.match[0]);

        const results: InlineQueryResult[] = [];

        games?.map((game, i) => {
            if (!game || !game.title || !game.url || i > 20) return;

            results.push({
                type: "article",
                id: i.toString(),
                title: game.title,
                input_message_content: {
                    message_text: this.getMessageText(game),
                    parse_mode: "HTML",
                },
                reply_markup: new InlineKeyboard().url("Steam", game.url),
                url: game.url,
                description: game.price,
                thumb_url: game.image,
            });
        });

        await ctx.answerInlineQuery(results);
    }
}

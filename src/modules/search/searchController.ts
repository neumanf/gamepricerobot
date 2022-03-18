import { Context, InlineKeyboard } from "grammy";
// FIX: import from another place
import { InlineQueryResult } from "grammy/out/platform.node";

import { IGame } from "../../interfaces/game";
import { EpicGamesService } from "./epicGamesService";
import { SteamService } from "./steamService";

interface IGameServices {
    steamService: SteamService;
    epicGamesService: EpicGamesService;
}

export class SearchController {
    private readonly steamService: SteamService;
    private readonly epicGamesService: EpicGamesService;
    private steamGames: IGame[] | undefined;

    constructor({ steamService, epicGamesService }: IGameServices) {
        this.steamService = steamService;
        this.epicGamesService = epicGamesService;

        this.handle = this.handle.bind(this);
        this.handleInlineResult = this.handleInlineResult.bind(this);
    }

    private getMessageText(steamGame: IGame, epicGame?: IGame): string {
        const getPlatformPricesText = (platform: string, { discount, undiscountedPrice, price }: IGame) => {
            return `<b>${platform}: </b>${discount ? `[${discount}] <s>${undiscountedPrice}</s>` : ""} ${price}\n`;
        };

        let message = `<b>🎮 ${steamGame.title}</b>\n\n`;
        message += "<b>💵 Prices</b>\n";
        message += getPlatformPricesText("Steam", steamGame);
        if (epicGame) message += getPlatformPricesText("Epic Games", epicGame);

        return message;
    }

    private getQueryResult(steamGames: IGame[]) {
        const results: InlineQueryResult[] = [];

        steamGames.map((steamGame, id) => {
            if (!steamGame || !steamGame.title || !steamGame.url || id > 20) return;

            results.push({
                type: "article",
                id: id.toString(),
                title: steamGame.title,
                input_message_content: {
                    message_text: "Loading...",
                    parse_mode: "HTML",
                },
                url: steamGame.url,
                reply_markup: new InlineKeyboard().url("Go to Steam", steamGame.url as string),
                description: steamGame.price,
                thumb_url: steamGame.image,
            });
        });

        return results;
    }

    async handle(ctx: Context) {
        const gameTitle = ctx.match?.[0];

        if (!gameTitle) return;

        const steamGames = await this.steamService.handle(gameTitle);

        if (!steamGames) return;
        this.steamGames = steamGames;

        const results = this.getQueryResult(steamGames);

        await ctx.answerInlineQuery(results);
    }

    async handleInlineResult(ctx: Context) {
        const result = ctx.update.chosen_inline_result;

        if (!result || !this.steamGames) return;

        const messageId = result.inline_message_id;
        const gameId = result.result_id;
        const steamGame = this.steamGames[parseInt(gameId)];

        if (!messageId || !steamGame.title) return;

        const epicGames = await this.epicGamesService.handle(steamGame.title.replace(/[^0-9a-zA-Z\s]+/g, ""));
        const epicGame = epicGames?.[0];

        const messageText = this.getMessageText(steamGame, epicGame);
        const keyboard = new InlineKeyboard().url("Go to Steam", steamGame.url as string);
        if (epicGame) keyboard.row().url("Go to Epic Games", epicGame.url as string);

        await ctx.api.editMessageTextInline(messageId, messageText, {
            parse_mode: "HTML",
            reply_markup: keyboard,
        });
    }
}

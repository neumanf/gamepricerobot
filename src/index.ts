import * as dotenv from "dotenv";
dotenv.config();

import * as awilix from "awilix";

import { bot } from "./core/bot";
import { SearchController } from "./modules/search/searchController";
import { SteamService, EpicGamesService } from "./modules/search/services";

const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY,
});

container.register({
    searchController: awilix.asClass(SearchController).singleton(),
    steamService: awilix.asClass(SteamService),
    epicGamesService: awilix.asClass(EpicGamesService),
});

bot.inlineQuery(/.*/, container.resolve("searchController").handle);
bot.on("chosen_inline_result", container.resolve("searchController").handleInlineResult);

bot.catch((err) => console.error(err));

console.log("[SERVER] Bot starting polling");
bot.start();

import * as dotenv from "dotenv";
dotenv.config();

import * as awilix from "awilix";

import { bot } from "./core/bot";
import { SearchController } from "./modules/search/searchController";
import { SteamService } from "./modules/search/steamService";

const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY,
});

container.register({
    searchController: awilix.asClass(SearchController),
    steamService: awilix.asClass(SteamService),
});

bot.inlineQuery(/.*/, container.resolve("searchController").handle);

bot.catch((err) => console.error(err));

console.log("[SERVER] Bot starting polling");
bot.start();

import { IGame } from "./game";

export interface IGameService {
    handle: (game: string) => Promise<IGame[]>;
}

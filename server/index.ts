import { Server } from './server';
import Roulette from './routes/roulette';
const server = new Server([
  new Roulette()
]);
server.start(() => { });

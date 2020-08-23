import { Server } from './server';
import Roulette from './routes/roulette';
import User from './routes/user';
const server = new Server([
  new Roulette(),
  new User()
]);
server.start(() => { });

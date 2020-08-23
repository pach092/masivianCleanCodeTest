import { Server } from './server';
import Roulette from './routes/roulette';
import User from './routes/user';
import Auth from './routes/auth';
const server = new Server([
  new Roulette(),
  new User(),
  new Auth()
]);
server.start(() => { });

import express from 'express';
import { environment } from './environments/environment';
import ServerResponse from './config/response';
import bodyParser from 'body-parser';
import cors from 'cors';
export class Server {
  public app: express.Application;
  public port: number;
  constructor(controllers: Array<object>) {
    this.port = parseInt(environment.port, 10);
    this.app = express();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    this.app.use((err: any, _req: any, res: express.Response, next: any) => {
      if (err.name === 'UnauthorizedError') {
        ServerResponse.message(res, 401, 0, 'You can access to this endpoint');
        return;
      }
      next();
    });
  }
  private initializeMiddlewares() {
    this.app.use(bodyParser.json());
    this.app.use(cors());
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }
  private initializeControllers(controllers: Array<object>) {
    controllers.forEach((controller: any) => {
      this.app.use('/', controller.router);
    });
  }
  start(callback: any) {
    this.app.listen(this.port, callback);
  }
}

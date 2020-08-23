import { Router, Request, Response } from 'express';
import ServerResponse from '../config/response';
import Functions from '../config/functions';
import _ from 'lodash';
import ConnectionMysql from '../database/mysql';
import short from 'short-uuid';
import bcrypt from 'bcryptjs';
import auth from 'express-jwt';
import { config } from '../config';
export default class User{
  public path = '/api/user';
  public router = Router();
  constructor() {
    this.initializeRoutes();
  }
  public initializeRoutes() {
    this.router.post(`${this.path}/new`, this.newUser);
    this.router.post(`${this.path}/addfunds`, auth({ secret: config.token.seed, algorithms: ['HS256'] }), this.addFunds);
  }
  newUser = async (req: Request, res: Response) => {
    try {
      const validateFields = ['user', 'password'];
      const validate = await Functions.formValidate(validateFields, req.body);
      if (validate.error === 1) {
        return ServerResponse.message(res, 200, 0, validate.message);
      }
      const { user, password } = req.body;
      if (user.length > 100) {
        return ServerResponse.message(res, 200, 0, 'El campo user no debe ser mayor a 100 caracteres');
      }
      if (password.length > 45) {
        return ServerResponse.message(res, 200, 0, 'El campo password no debe ser mayor a 45 caracteres');
      }
      const id = short.generate();
      const passwordHash = bcrypt.hashSync(password, 10);
      const newUser = await ConnectionMysql.queryWithParameters('CALL add_user (?, ?, ?)', [id, user, passwordHash]);
      if (newUser) {
        return ServerResponse.message(res, 200, 0, 'El nombre de usuario ya existe');
      }
      return ServerResponse.message(res, 200, 1, 'Usuario creado exitosamente');
    } catch (error) {
      return ServerResponse.error(res, error.toString());
    }
  }
  addFunds = async (req: Request, res: Response) => {
    try {
      const validateFields = ['funds'];
      const validate = await Functions.formValidate(validateFields, req.body);
      if (validate.error === 1) {
        return ServerResponse.message(res, 200, 0, validate.message);
      }
      const { funds } = req.body;
      if (typeof(funds) !== 'number') {
        return ServerResponse.message(res, 200, 0, 'El campo funds debe ser númerico');
      }
      const userId = req[`user`].id;
      const addFunds = await ConnectionMysql.queryWithParameters('CALL add_funds (?, ?)', [funds, userId]);
      return ServerResponse.message(res, 200, 1, `Fondos agregados exitosamente, su nuevo saldo es $${addFunds[0].funds}`);
    } catch (error) {
      return ServerResponse.error(res, error.toString());
    }
  }
}

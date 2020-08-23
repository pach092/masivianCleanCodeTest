import { Router, Request, Response } from 'express';
import ServerResponse from '../config/response';
import Functions from '../config/functions';
import _ from 'lodash';
import ConnectionMysql from '../database/mysql';
import short from 'short-uuid';
import bcrypt from 'bcryptjs';
export default class User{
  public path = '/api/user';
  public router = Router();
  constructor() {
    this.initializeRoutes();
  }
  public initializeRoutes() {
    this.router.post(`${this.path}/new`, this.newUser);
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
}

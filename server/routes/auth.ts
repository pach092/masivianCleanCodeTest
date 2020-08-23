import { Router, Request, Response } from 'express';
import ServerResponse from '../config/response';
import Functions from '../config/functions';
import _ from 'lodash';
import ConnectionMysql from '../database/mysql';
import bcrypt from 'bcryptjs';
export default class Auth{
  public path = '/api/auth';
  public router = Router();
  constructor() {
    this.initializeRoutes();
  }
  public initializeRoutes() {
    this.router.post(`${this.path}`, this.auth);
  }
  auth = async (req: Request, res: Response) => {
    try {
      const validateFields = ['user', 'password'];
      const validate = await Functions.formValidate(validateFields, req.body);
      if (validate.error === 1) {
        return ServerResponse.message(res, 200, 0, validate.message);
      }
      const { user, password } = req.body;
      const userInfo = await ConnectionMysql.queryWithParameters('CALL get_user_by_email (?)', [user]);
      if (userInfo.length === 0) {
        return ServerResponse.message(res, 200, 0, 'Combinación usuario/contraseña erronea');
      }
      if (!bcrypt.compareSync(password, userInfo[0].password)) {
        return ServerResponse.message(res, 200, 0, 'Combinación usuario/contraseña erronea');
      }
      const token = await Functions.generateToken(userInfo[0].id);
      return ServerResponse.message(res, 200, 1, token);
    } catch (error) {
      return ServerResponse.error(res, error.toString());
    }
  }
}

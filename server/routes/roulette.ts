import { Router, Request, Response } from 'express';
import ServerResponse from '../config/response';
import Functions from '../config/functions';
import _ from 'lodash';
import ConnectionMysql from '../database/mysql';
import short from 'short-uuid';
export default class Roulette{
  public path = '/api/roulette';
  public router = Router();
  constructor() {
    this.initializeRoutes();
  }
  public initializeRoutes() {
    this.router.post(`${this.path}/newroulette`, this.newRoulette);
  }
  newRoulette = async (req: Request, res: Response) => {
    try {
      const validateFields = ['name'];
      const validate = await Functions.formValidate(validateFields, req.body);
      if (validate.error === 1) {
        return ServerResponse.message(res, 200, 0, validate.message);
      }
      const { name } = req.body;
      if (name.length > 45) {
        return ServerResponse.message(res, 200, 0, 'El nombre de la ruleta no debe ser mayor a 45 caracteres');
      }
      const id = short.generate();
      const insertRoulette = await ConnectionMysql.queryWithParameters('CALL add_roulette (?, ?)', [id, name]);
      if (insertRoulette) {
        return ServerResponse.message(res, 200, 0, 'El nombre de la ruleta ya existe');
      }
      return ServerResponse.message(res, 200, 1, { message: 'Ruleta creada exitosamente', id });
    } catch (error) {
      return ServerResponse.error(res, error.toString());
    }
  }
}

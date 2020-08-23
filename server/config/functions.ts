import _ from 'lodash';
import ConnectionMysql from '../database/mysql';
import jwt from 'jsonwebtoken';
import { config } from '.';
export default class Functions {
  public static formValidate(fields: string[], body: object): Promise<any> {
    return new Promise(resolve => {
      if (typeof(body) !== 'object') {
        resolve({ error: 1, message: 'Body no aceptado, debe ser de tipo JSON' });
      }
      const bodyKeys = Object.keys(body);
      let error: any;
      for (const f of fields) {
        error = { error: 1 };
        for (const bK of bodyKeys) {
          if (bK === f) {
            error = { error: 0 };
          }
        }
      }
      if (error.error === 1) {
        const difference = _.difference(fields, bodyKeys);
        if (difference.length === 1) {
          resolve ({ error: 1, message: `El campo ${difference.join(', ')} es obligatorio` })
        } else {
          resolve ({ error: 1, message: `Los campos ${difference.join(', ')} son obligatorios` })
        }
      }
      resolve(error);
    });
  }
  public static generateToken(id: string, roulette: any): Promise<any> {
    return new Promise(async (resolve) => {
      const token = jwt.sign(
        {
          id,
          roulette
        },
        config.token.seed,
        {
          expiresIn: config.token.expire
        }
      );
      resolve(token);
    });
  }
}

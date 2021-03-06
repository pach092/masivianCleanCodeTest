import { Router, Request, Response } from 'express';
import ServerResponse from '../config/response';
import Functions from '../config/functions';
import _ from 'lodash';
import ConnectionMysql from '../database/mysql';
import short from 'short-uuid';
import auth from 'express-jwt';
import { config } from '../config';
import moment from 'moment-timezone';
export default class Roulette{
  public path = '/api/roulette';
  public router = Router();
  constructor() {
    this.initializeRoutes();
  }
  public initializeRoutes() {
    this.router.post(`${this.path}/new`, this.newRoulette);
    this.router.get(`${this.path}/opening`, auth({ secret: config.token.seed, algorithms: ['HS256'] }), this.rouletteOpening);
    this.router.post(`${this.path}/bet`, auth({ secret: config.token.seed, algorithms: ['HS256'] }), this.bet);
    this.router.get(`${this.path}/close`, this.rouletteClose);
    this.router.get(`${this.path}`, this.getAllRoulettes);
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
  rouletteOpening = async (req: Request, res: Response) => {
    try {
      const rouletteId = req.query.id;
      if (!rouletteId) {
        return ServerResponse.message(res, 200, 0, 'No detectamos un id de ruleta');
      }
      const validateRoulette = await ConnectionMysql.queryWithParameters('CALL get_roulette_by_id (?)', [rouletteId]);
      if (validateRoulette.length === 0) {
        return ServerResponse.message(res, 200, 0, 'ID de ruleta no válido');
      }
      if (validateRoulette[0].close === 1) {
        return ServerResponse.message(res, 200, 0, 'La ruleta seleccionada se encuentra cerrada, intenta con otra');
      }
      const userId = req[`user`].id;
      const token = await Functions.generateToken(userId, rouletteId);
      return ServerResponse.message(res, 200, 1, { message: `Te encuentras en la mesa ${validateRoulette[0].name}`, token });
    } catch (error) {
      return ServerResponse.error(res, error.toString());
    }
  }
  bet = async (req: Request, res: Response) => {
    try {
      const rouletteId = req[`user`].roulette;
      if (!rouletteId) {
        return ServerResponse.message(res, 200, 0, 'Para acceder a esta sección debes de ya estar en una mesa');
      }
      const validateRoulette = await ConnectionMysql.queryWithParameters('CALL get_roulette_by_id (?)', [rouletteId]);
      if (validateRoulette.length === 0) {
        return ServerResponse.message(res, 200, 0, 'La ruleta seleccionada no existe');
      }
      if (validateRoulette[0].close === 1) {
        return ServerResponse.message(res, 200, 0, 'La ruleta está cerrada y no permite más apuestas');
      }
      const validateFields = ['bet', 'money'];
      const validate = await Functions.formValidate(validateFields, req.body);
      if (validate.error === 1) {
        return ServerResponse.message(res, 200, 0, validate.message);
      }
      const { bet, money } = req.body;
      if (!((bet >= 0 && bet <= 36) || (bet === 'rojo' || bet === 'negro'))) {
        return ServerResponse.message(res, 200, 0, 'Los números válidos para apostar son del 0 al 36 o color negro o rojo');
      }
      if (typeof(money) !== 'number') {
        return ServerResponse.message(res, 200, 0, 'El campo money debe ser numérico');
      }
      if (money <= 0 || money > 10000) {
        return ServerResponse.message(res, 200, 0, 'El campo money debe ser un valor entre 1 y 10.000');
      }
      const userId = req[`user`].id;
      const userInfo = await ConnectionMysql.queryWithParameters('CALL get_user_by_id (?)', [userId]);
      const userFunds = userInfo[0].funds;
      if (userFunds < money) {
        return ServerResponse.message(res, 200, 0, `No tienes los suficientes fondos para realizar esta apuesta, tus fondos son de $${userFunds}`);
      }
      const getBets = await ConnectionMysql.queryWithParameters('CALL get_bets_by_roulette (?)', [rouletteId]);
      if (getBets.length === 0) {
        const id = short.generate();
        const date = moment().utc(false).format('YYYY-MM-DDTHH:mm:SSZ');
        const bets = [{ userId, money, bet, date }];
        await ConnectionMysql.queryWithParameters('CALL add_bet (?, ?, ?)', [id, JSON.stringify(bets), rouletteId]);
        await ConnectionMysql.queryWithParameters('CALL substract_funds (?, ?)', [userId, money]);
      } else {
        const bets = JSON.parse(getBets[0].bets);
        const index = _.findIndex(bets, (list: any) => list.userId === userId)
        if (index !== -1) {
          bets[index].money = bets[index].money + money;
          await ConnectionMysql.queryWithParameters('CALL update_roulette_bet (?, ?, ?)', [JSON.stringify(bets), getBets[0].id, rouletteId]);
          await ConnectionMysql.queryWithParameters('CALL substract_funds (?, ?)', [userId, money]);
        } else {
          const date = moment().utc(false).format('YYYY-MM-DDTHH:mm:ssZ');
          bets.push({ userId, money, bet, date });
          await ConnectionMysql.queryWithParameters('CALL update_roulette_bet (?, ?, ?)', [JSON.stringify(bets), getBets[0].id, rouletteId]);
          await ConnectionMysql.queryWithParameters('CALL substract_funds (?, ?)', [userId, money]);
        }
      }
      return ServerResponse.message(res, 200, 1, 'Apuesta realizada correctamente');
    } catch (error) {
      return ServerResponse.error(res, error.toString());
    }
  }
  rouletteClose = async (req: Request, res: Response) => {
    try {
      const rouletteId = req.query.id;
      if (!rouletteId) {
        return ServerResponse.message(res, 200, 0, 'No detectamos un id de ruleta');
      }
      const validateRoulette = await ConnectionMysql.queryWithParameters('CALL get_roulette_by_id (?)', [rouletteId]);
      if (validateRoulette.length === 0) {
        return ServerResponse.message(res, 200, 0, 'ID de ruleta no válido');
      }
      const bets = await ConnectionMysql.queryWithParameters('CALL get_bets (?)', [rouletteId]);
      const allBets = JSON.parse(bets[0].bets);
      let totalBets = 0;
      for (const aB of allBets) {
        totalBets += parseFloat(aB.bet);
      }
      await ConnectionMysql.queryWithParameters('CALL close_roulette (?)', [rouletteId]);
      return ServerResponse.message(res, 200, 1, { message: `La mesa ${validateRoulette[0].name} se cerró y ya no permite más apuestas`, allBets, totalBets });
    } catch (error) {
      return ServerResponse.error(res, error.toString());
    }
  }
  getAllRoulettes = async (req: Request, res: Response) => {
    try {
      const start = req.query.start || 0;
      const limit = req.query.limit || 5;
      if (typeof(start) !== 'number' || typeof(limit) !== 'number') {
        return ServerResponse.message(res, 200, 0, 'El campo start y limit deben ser númericos');
      }
      const roulettes = await ConnectionMysql.queryWithParameters('CALL get_all_roulettes (?, ?)', [start, limit]);
      return ServerResponse.message(res, 200, 1, roulettes);
    } catch (error) {
      return ServerResponse.error(res, error.toString());
    }
  }
}

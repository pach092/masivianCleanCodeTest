import mysql from 'mysql';
import { config } from '../config';
export default class ConnectionMysql {
  private static newInstance: ConnectionMysql;
  cnn: mysql.Connection;
  connected = false;
  constructor() {
    this.cnn = mysql.createConnection(config.database);
    this.conectedDb();
  }
  public static get instance() {
    return this.newInstance || ( this.newInstance = new this() );
  }
  static query( query: string): Promise<any> {
    return new Promise((res, rej) => {
      this.instance.cnn.query(query, (err, result: object[]) => {
        if (err) {
          rej(err);
          return;
        }
        res(result[0]);
      });
    });
  }
  static queryMultiple( query: string): Promise<any> {
    return new Promise((res, rej) => {
      this.instance.cnn.query(query, (err, result: object[]) => {
        if (err) {
          rej(err);
          return;
        }
        res(result);
      });
    });
  }
  static queryWithParameters( query: string, parameters: any): Promise<any> {
    return new Promise((res, rej) => {
      this.instance.cnn.query(query, parameters, (err, result: object[]) => {
        if (err) {
          rej(err);
          return;
        }
        res(result[0]);
      });
    });
  }
  static queryMultipleWithParameters( query: string, parameters: any): Promise<any> {
    return new Promise((res, rej) => {
      this.instance.cnn.query(query, parameters, (err, result: object[]) => {
        if (err) {
          rej(err);
          return;
        }
        res(result);
      });
    });
  }
  private conectedDb() {
    this.cnn.connect((err: mysql.MysqlError) => {
      if (err) {
        return(err.message);
      }
      this.connected = true;
    });
  }
}

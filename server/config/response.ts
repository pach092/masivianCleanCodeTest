import { Response } from 'express';
export default class ServerResponse {
  public static message(res: Response, status: number, success: number, message: any): Response {
    return res.status(status).json({ success, message });
  }
  public static async error(res: Response, error: string): Promise<Response> {
    return res.status(500).json({ success: 0, error });
  }
}

import { RequestHandler } from 'express'

export const asyncWrapper = <T extends RequestHandler>(fn: T): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
    .catch((error)=>res.status(error?.statusCode || 500).json({"statusCode": error?.statusCode || 500, "message": error?.message || 'Internal Server Error' }));
  };
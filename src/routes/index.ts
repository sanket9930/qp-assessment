import { Express, NextFunction, ErrorRequestHandler } from 'express'
import packageJSON from "../../package.json";
import { Router } from "express";
import { ErrorObject, ResponseBody } from "../lib";
import { adminRouter } from "./admin";
import { userRouter } from './user'

const { version } = packageJSON;

interface Route {
  path: string;
  router: Router;
}

const routes: {
  list: Route[];
  init: (app: any) => void;
} = {
  list: [
    { path: '/admin', router: adminRouter },
    { path: '/user', router: userRouter }
  ],
  init(app: Express) {
    if (!app || !app.use) {
      console.log(
        "[ERROR] Route Initialization Failed: app / app.use is undefined"
      );
        process.exit(1);
    }

    this.list.forEach((route) => {
      const pathWithVersion = `/v${version.split(".")[0]}${route.path}`;
      app.use(pathWithVersion, route.router);
    });

    app.use('', (request, response, next) => {
      const message = ['Cannot', request.method, request.originalUrl].join(' ')
      const errorObject = new ErrorObject(404, message)
      next(errorObject)
    })
  }
};



export default routes;

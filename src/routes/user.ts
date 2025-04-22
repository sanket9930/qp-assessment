import express, { Request, Response } from 'express'

import { asyncWrapper, ErrorObject } from '../lib'
import { userController } from '../controllers'
import { verifyToken, authorize } from '../middelware/auth'

const userRouter = express.Router()

// Functional Requirements
// - View the list of available grocery items - /view
// - Ability to book multiple grocery items in a single order - /order
// 
// Additional
// - Login and SignUp of an user
// - The order route should be protacted

userRouter.post('/register', asyncWrapper(userController.registerUser))
userRouter.post('/login', asyncWrapper(userController.loginUser))

userRouter.use(verifyToken, authorize('User'))
userRouter.get('/view', asyncWrapper(userController.viewGrocery))
userRouter.post('/order', asyncWrapper(userController.placeOrder))

userRouter.use((request: Request, response: Response, next) => {
    const message = ['Cannot', request.method, request.originalUrl].join(' ')
    const errorObject = new ErrorObject(404, message)
    return response.status(404).json(errorObject)
  })
export { userRouter }
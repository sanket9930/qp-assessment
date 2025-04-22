import express, { Request, Response } from 'express'
import { asyncWrapper, ErrorObject } from '../lib'
import { adminController } from '../controllers'
import { verifyToken, authorize } from '../middelware/auth'

const adminRouter = express.Router()

// Functional Requirements
// - Add new grocery items to the system  - POST /admin/add
// - View existing grocery items          - GET /admin/view
// - Remove grocery items from the system - DELETE /admin/remove
// - Update details (e.g., name, price) of existing grocery items - PUT /admin/update
// - Manage inventory levels of grocery items  PUT /admin/update/:id same api can handle the name, price and qty
// 
// Additional
// Login and SignUp of an admin
// The route should be protacted

adminRouter.post('/register', asyncWrapper(adminController.registerAdmin))
adminRouter.post('/login', asyncWrapper(adminController.loginAdmin))

adminRouter.use(verifyToken, authorize('Admin'))
adminRouter.get('/view', asyncWrapper(adminController.viewGrocery))
adminRouter.post('/add', asyncWrapper(adminController.addGrocery))
adminRouter.delete('/remove', asyncWrapper(adminController.removeGrocery))
adminRouter.put('/modify', asyncWrapper(adminController.modifyGrocery))
adminRouter.use((request: Request, response: Response, next) => {
    const message = ['Cannot', request.method, request.originalUrl].join(' ')
    const errorObject = new ErrorObject(404, message)
    return response.status(404).json(errorObject)
  })
export { adminRouter }
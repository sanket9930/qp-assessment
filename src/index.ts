import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()

import routes from './routes'
import { PGModel } from './lib'

const app = express()
const port = process.env.PORT

const corsOptions: cors.CorsOptions  = {
    origin: process.env.CORS_ORIGIN,
    methods: process.env.CORS_METHODS
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors(corsOptions))
routes.init(app)


async function startServer() {
    await PGModel.checkConnection()
    app.listen(port, () => {
        console.log(`Example app listening on port ${port}!`)
    })

}

startServer()
 
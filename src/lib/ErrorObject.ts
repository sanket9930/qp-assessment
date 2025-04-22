import http from 'http';

export class ErrorObject extends Error {
    public statusCode : number
    public data ?: any

    constructor (statusCode: number, message ?: any, data ?: any) {
        super()
        this.statusCode = statusCode
        this.message = message !== undefined ? message : http.STATUS_CODES[statusCode]
        this.data = data

        Object.setPrototypeOf(this, ErrorObject.prototype)
      }
}
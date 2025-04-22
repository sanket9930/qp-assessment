import http from 'http'

export class ResponseBody {
    public statusCode : number
    public data ?: any
    public message ?: any
    
    constructor(statusCode: number, data ?: any) {
        this.statusCode = statusCode
        this.data = data
        this.message = http.STATUS_CODES[statusCode]
    }
}
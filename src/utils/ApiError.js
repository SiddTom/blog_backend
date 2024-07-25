class ApiError extends Error{
    constructor(
        statusCode,
        messeage = "Something went wrong",
        error = [],
        stack = ""
    ){
        super(messeage)
        this.statusCode = statusCode
        this.data = null
        this.message = messeage
        this.success = false
        this.errors = errors
        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}
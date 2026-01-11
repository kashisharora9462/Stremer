class ApiError_ extends Error {
    constructor(statusCode, message,errors=[],stack="") {
        super(message);
        this.statusCode = statusCode;//400,404,500
        this.data= null;// any additional data to send with error
        this.message=message;//error message
        this.success= false;// false for error response
        this.errors=errors;// array of errors for validation errors
        if (stack) {
            this.stack = stack;// stack trace is used for debugging
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {ApiError_};
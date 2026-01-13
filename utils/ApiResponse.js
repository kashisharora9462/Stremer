class ApiResponse {

    ApiResponse(statusCode,data,message = "Success",success=true) {
        this.statusCode = statusCode;//stauscode is used to find request is success or failure request
        this.data = data;// data to send in response
        this.message = message;// message to send in response
        this.success = statusCode >= 200 && statusCode < 300 ? true : false; // because statuscode 100-199 are informational responses, 200-299 are success responses, 300-399 are redirection messages, 400-499 are client error responses, and 500-599 are server error responses so between 200-299 success is true
    }
}

export {ApiResponse};
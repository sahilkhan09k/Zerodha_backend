class apiResponse {
    constructor(statuscode, message = "success", data) {
        this.statuscode = statuscode;
        this.message = message;
        this.data = data;
        this.success = statuscode >= 200 && statuscode < 300;
    }
}

export {apiResponse}
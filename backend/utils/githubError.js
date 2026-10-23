export class GithubApiError extends Error{
    constructor(message , status = 500 , details = {}){
        super(message);

        this.name = "GithubApiError";
        this.status = status;
        this.details = details;
    }
}
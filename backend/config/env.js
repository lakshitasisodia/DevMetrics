import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 5000;
export const GITHUB_PERSONAL_ACCESS_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

export const JWT_SECRET = process.env.JWT_SECRET;

export const GITHUB_TOKEN_ENCRYPTION_KEY =
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
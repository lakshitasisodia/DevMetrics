import crypto from "crypto";
import { GITHUB_TOKEN_ENCRYPTION_KEY } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";

const KEY = Buffer.from(
    GITHUB_TOKEN_ENCRYPTION_KEY,
    "hex"
);


if (KEY.length !== 32) {
    throw new Error(
        "GITHUB_TOKEN_ENCRYPTION_KEY must be exactly 32 bytes"
    );
}

export function encrypt(text) {
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(
        ALGORITHM,
        KEY,
        iv
    );

    let encrypted = cipher.update(text, "utf8", "hex");

    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return [
        iv.toString("hex"),
        authTag.toString("hex"),
        encrypted
    ].join(":");
}


export function decrypt(encryptedText) {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(":");

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        KEY,
        iv
    );

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(
        encrypted,
        "hex",
        "utf8"
    );

    decrypted += decipher.final("utf8");

    return decrypted;
}
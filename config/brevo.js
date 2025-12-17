// config/brevo.js
import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

dotenv.config();

// Initialize Brevo Client
const client = SibApiV3Sdk.ApiClient.instance;

client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

// Export only the email API
const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export default emailApi;

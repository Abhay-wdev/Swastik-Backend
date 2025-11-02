// config/brevo.js
import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

dotenv.config();

// Initialize Brevo Client once
const brevoClient = SibApiV3Sdk.ApiClient.instance;
brevoClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

// Create transactional email instance
const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export default emailApi;

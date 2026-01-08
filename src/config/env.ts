import 'dotenv/config';

export const config = {
  apiKey: process.env.OPENAI_API_KEY || '',
  baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  model: process.env.MODEL || 'gpt-4o',
};

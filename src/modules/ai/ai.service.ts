import config from '../../config/env';

const askAi = async (prompt: string, context?: string) => {
  const apiKey = config.openrouter_api_key;
  const baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  if (!apiKey || apiKey.includes('your_')) {
    throw { statusCode: 500, message: 'OPENROUTER_API_KEY is not configured correctly in .env' };
  }

  const systemPrompt = context || `You are a helpful assistant for FoodHub, a food delivery platform. 
  You can help users with finding meals, answering questions about orders, and providing general food-related advice.
  Keep your answers concise and friendly.`;

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.app_url || 'http://localhost:3000',
        'X-Title': 'FoodHub',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data: any = await response.json();

    if (!response.ok) {
      throw { 
        statusCode: response.status, 
        message: data.error?.message || 'Failed to get response from AI provider' 
      };
    }

    return data.choices[0].message.content;
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error('AI Error:', error.message);
    throw { 
      statusCode: 500, 
      message: error.message || 'Failed to connect to AI provider' 
    };
  }
};

const generateMealDescription = async (title: string, category: string) => {
  const prompt = `Generate an appetizing and professional description for a food item named "${title}" in the "${category}" category. Keep it under 150 characters.`;
  const context = "You are a copywriter for a premium food delivery platform. You write catchy and delicious descriptions for dishes.";
  
  return await askAi(prompt, context);
};

export const AiService = {
  askAi,
  generateMealDescription
};

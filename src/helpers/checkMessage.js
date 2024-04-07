require('dotenv').config();

const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});
const checkMessageHelper = async (message) => {
  try {
    const respone = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'Trả lời false nếu câu  đó chắc chắn có ý nghĩa đồi trụy hoặc bạo lực đe dọa tính mạng. Mọi trường hợp khác được coi là true. (chú ý cách dùng từ người Việt Nam và ưu tiên là true)',
        },
        { role: 'user', content: message },
      ],
      max_tokens: 100,
    });
    const responeContent = respone.choices[0].message.content;
    if (responeContent.trim().toLocaleLowerCase() == 'false') {
      return false;
    }
    return true;
  } catch (error) {
    return true;
  }
};
module.exports = { checkMessageHelper };

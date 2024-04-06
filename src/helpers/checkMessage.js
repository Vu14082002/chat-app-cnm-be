require('dotenv').config();

const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});
const checkMessageHelper = async (message) => {
  try {
    const respone = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Chỉ trả lời true hoặc false, chỉ trả lời là false nếu các tin nhắn ở mức độ VERY_LIKELY, hoặc promt có chứ nội dung không lành mạnh ở mức độ VERY_LIKELY, hoặc có từ ngữ chừi thề ở mức độ VERY_LIKELY, xúc phạm ở mức độ VERY_LIKELY, tất cả các trường hợp còn lại đều là true',
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
    console.log(error);
    return true;
  }
};
module.exports = { checkMessageHelper };

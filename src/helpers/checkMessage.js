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
            'Chỉ trả lời true hoặc false, chỉ trả lời là false nếu các tin nhắn, hoặc promt có chứ nội dung lành mạnh, hoặc có từ ngữ chừi thế, xúc phạm, còn các trương hợp còn lại thì trả lời là true, chấp nhận các tin nhắn có chứ icon các từ viết sai chính tả, hoặc các từ hay dùng phổ biến cộng đồng cững trả lời là true',
        },
        { role: 'user', content: message },
      ],
      max_tokens: 100,
    });
    const responeContent = respone.choices[0].message.content;
    console.log('Open Ai content ---> ', responeContent);
    if (responeContent.trim().toLocaleLowerCase('false')) {
      return false;
    }
    return true;
  } catch (error) {
    console.log(error);
    return true;
  }
};
module.exports = { checkMessageHelper };

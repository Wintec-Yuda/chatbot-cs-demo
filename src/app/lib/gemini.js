import axios from "axios";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const apiUrl = process.env.NEXT_PUBLIC_GEMINI_API_URL;

export const generate = async (prompt) => {
    const { data } = await axios.post(
        `${apiUrl}?key=${apiKey}`,
        {
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
        },
        { headers: { "Content-Type": "application/json" } }
    );

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak ada rekomendasi.";
    return text.replace(/\n/g, "<br>");
};

export function buildPromptMenuId(menuData, userQuery, chatHistory = []) {
  // Format history percakapan
  const historyContext = chatHistory.map(msg => {
    return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`;
  }).join('\n');

  const prompt = `
    Anda adalah asisten restoran yang membantu pelanggan memilih menu.
    Berikut adalah daftar menu yang tersedia:
    ${JSON.stringify(menuData, null, 2)}

    ${chatHistory.length > 0 ? `
    Berikut adalah riwayat percakapan sebelumnya:
    ${historyContext}
    ` : ''}

    Pertanyaan/tanggapan terakhir user:
    "${userQuery}"

    Prioritaskan jawaban singkat terlebih dahulu, lalu tawarkan detail jika diperlukan.
    Berikan respon yang ramah dan informatif. Jika menanyakan menu, sebutkan detail dan harga.
    Jika tanya tentang komposisi, berikan informasi yang relevan.
    Arahkan ke kasir, jika pelanggan ingin memesan.
    Jika pertanyaan tidak jelas, mohon klarifikasi, lalu berikan rekomendasi pertanyaan yang sesuai.
  `;

  return prompt;
}

export function buildPromptMenuEn(menuData, userQuery, chatHistory = []) {
  // Format conversation history
  const historyContext = chatHistory.map(msg => {
    return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`;
  }).join('\n');

  const prompt = `
    You are a restaurant assistant helping customers choose from our menu.
    Here is our available menu list:
    ${JSON.stringify(menuData, null, 2)}

    ${chatHistory.length > 0 ? `
    Previous conversation history:
    ${historyContext}
    ` : ''}

    User's latest question/response:
    "${userQuery}"

    Please prioritize concise answers first, then offer details if needed.
    Provide friendly and informative responses. When asked about menu items, mention details and prices.
    If asked about ingredients, provide relevant information.
    Direct to cashier if the customer wants to place an order.
    If the question is unclear, politely ask for clarification and suggest appropriate follow-up questions.
    
    Respond in English.
  `;

  return prompt;
}
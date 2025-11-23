export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST allowed" });
    }

    try {
        const { ingredients } = req.body;

        if (!ingredients) {
            return res.status(400).json({ error: "Ingredientes não enviados." });
        }

        // 🔑 API KEY DA GROQ (setada no painel do Vercel!)
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "GROQ_API_KEY ausente no servidor." });
        }

        const prompt = `
            Gere 5 receitas criativas baseadas APENAS nos ingredientes: "${ingredients}".
            Retorne um JSON válido com:
            [
                {
                    "title": "",
                    "missing": [],
                    "steps": []
                }
            ]

            - O campo "missing" deve incluir ingredientes essenciais que não foram citados.
            - O campo "steps" deve conter passos curtos e práticos.
            - NÃO use markdown, NÃO use backticks. Apenas JSON puro.
        `;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-70b-8192",
                messages: [
                    { role: "system", content: "Retorne SOMENTE JSON válido." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
            })
        });

        const data = await response.json();

        if (!data?.choices?.[0]?.message?.content) {
            return res.status(500).json({ error: "Resposta inesperada da IA." });
        }

        let text = data.choices[0].message.content.trim();

        // Remove riscos de markdown que a IA pode adicionar
        text = text.replace(/```json/g, "").replace(/```/g, "");

        res.status(200).json({
            recipes: JSON.parse(text)
        });

    } catch (err) {
        console.error("ERRO GROQ:", err);
        res.status(500).json({ error: "Erro interno no servidor." });
    }
}

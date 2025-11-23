export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST allowed" });
    }

    try {
        const { ingredients } = req.body;

        if (!ingredients) {
            return res.status(400).json({ error: "Ingredientes não enviados." });
        }

        // CHAVE DA OPENAI
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "API Key ausente no servidor." });
        }

        const prompt = `
            Gere 5 receitas criativas baseadas APENAS nos ingredientes: "${ingredients}".
            Retorne um JSON com:
            [
                {
                    "title": "",
                    "missing": [],
                    "steps": []
                }
            ]
        `;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "Responda apenas JSON válido" },
                    { role: "user", content: prompt }
                ]
            })
        });

        const data = await response.json();

        const text = data.choices[0].message.content;

        res.status(200).json({
            recipes: JSON.parse(text)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno no servidor." });
    }
}

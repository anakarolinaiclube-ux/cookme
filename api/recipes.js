export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST allowed" });
    }

    try {
        const { ingredients } = req.body;

        if (!ingredients) {
            return res.status(400).json({ error: "Ingredientes não enviados." });
        }

        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "API Key ausente no servidor." });
        }

        const prompt = `
            Gere 5 receitas criativas baseadas APENAS nos ingredientes: "${ingredients}".
            Retorne somente JSON puro, com a estrutura:
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
                    { role: "system", content: "Responda apenas JSON válido, sem texto antes ou depois." },
                    { role: "user", content: prompt }
                ]
            })
        });

        const data = await response.json();

        // ⚠️ Se houver erro da OpenAI, pare aqui
        if (data.error) {
            console.error("Erro OpenAI:", data.error);
            return res.status(500).json({ error: "Erro na IA: " + data.error.message });
        }

        let raw = data.choices[0].message.content;

        // Limpeza de segurança (caso venha Markdown ou texto solto)
        raw = raw.replace(/```json/gi, "")
                 .replace(/```/g, "")
                 .trim();

        let json;
        try {
            json = JSON.parse(raw);
        } catch (parseErr) {
            console.error("Erro ao converter JSON:", parseErr, "Conteúdo recebido:", raw);
            return res.status(500).json({ error: "Falha ao interpretar JSON da IA." });
        }

        return res.status(200).json({ recipes: json });

    } catch (err) {
        console.error("Erro geral:", err);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
}

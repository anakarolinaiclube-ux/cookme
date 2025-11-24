export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST allowed" });
    }

    try {
        const { ingredients } = req.body;

        if (!ingredients) {
            return res.status(400).json({ error: "Ingredientes não enviados." });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "API Key da Groq ausente." });
        }

        const prompt = `
        Gere 5 receitas criativas usando APENAS os ingredientes: "${ingredients}".
        
        Retorne SOMENTE um JSON válido assim:
        [
            {
                "title": "Nome da receita",
                "missing": ["item faltante"],
                "steps": ["passo 1", "passo 2"]
            }
        ]

        REGRAS IMPORTANTES:
        - NÃO explique.
        - NÃO inclua texto fora do JSON.
        - NÃO use markdown.
        - SOMENTE JSON válido.
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
                    { role: "system", content: "Você retorna somente JSON válido." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        let raw = data.choices?.[0]?.message?.content || "";

        // 🔥 Limpeza de segurança
        raw = raw
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        let recipes = JSON.parse(raw);

        return res.status(200).json({ recipes });

    } catch (err) {
        console.error("ERRO NO SERVIDOR:", err);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
}

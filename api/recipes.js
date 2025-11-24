export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST allowed" });
    }

    try {
        const { ingredients } = req.body;

        const apiKey = process.env.GROQ_API_KEY;

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
            NÃO use markdown, NÃO use backticks, NÃO explique nada, APENAS JSON PURO.
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
                    { role: "system", content: "Retorne SOMENTE JSON puro, sem markdown." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        console.log("🔍 RESPOSTA DA GROQ:", data);

        res.status(200).json({ debug: data });

    } catch (err) {
        console.error("ERRO:", err);
        res.status(500).json({ error: "Erro interno no servidor." });
    }
}

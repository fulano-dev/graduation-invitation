// index.js
import express from 'express';
import cors from 'cors';
import { db } from './db.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/buscaConvite', async (req, res) => {
  try {
    const { codigoConvite } = req.body;

    if (!codigoConvite) {
      return res.status(400).json({ erro: "Código de convite não informado." });
    }

    const [rows] = await db.query(
      "SELECT idConvidado, codigoConvite, nome, idade, email, telefone, status, crianca FROM convidados WHERE codigoConvite = ?",
      [codigoConvite]
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensagem: "Nenhum convidado localizado com este código de convite." });
    }

    return res.status(200).json({ convidados: rows });
  } catch (error) {
    console.error("Erro ao buscar convidados:", error);
    res.status(500).json({ erro: "Erro interno ao buscar os convidados." });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
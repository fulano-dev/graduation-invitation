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

    const convidadosComBoolean = rows.map((convidado) => ({
      ...convidado,
      crianca: convidado.crianca === 1,
    }));

    if (rows.length === 0) {
      return res.status(200).json({ convidados: [], codigoValido: false, mensagem: "Nenhum convidado localizado com este código de convite." });
    }

    return res.status(200).json({ convidados: convidadosComBoolean });
  } catch (error) {
    console.error("Erro ao buscar convidados:", error);
    res.status(500).json({ erro: "Erro interno ao buscar os convidados." });
  }
});

app.post('/api/confirmarPresenca', async (req, res) => {
  try {
    const { codigoConvite, emailConfirmacao, convidados } = req.body;

    if (!codigoConvite || !emailConfirmacao || !Array.isArray(convidados)) {
      return res.status(400).json({ erro: "Dados incompletos para confirmação." });
    }

    const updatePromises = convidados.map(async (convidado) => {
      const { idConvidado, status, idade } = convidado;
      return db.query(
        "UPDATE convidados SET status = ?, idade = ? WHERE idConvidado = ?",
        [status, idade || null, idConvidado]
      );
    });

    await Promise.all(updatePromises);

    await db.query(
      "INSERT INTO Confirmacoes (codigoConvite, dataConfirmacao, emailConfirmacao) VALUES (?, NOW(), ?)",
      [codigoConvite, emailConfirmacao]
    );

    return res.status(200).json({ mensagem: "Confirmação registrada com sucesso." });
  } catch (error) {
    console.error("Erro ao confirmar presença:", error);
    res.status(500).json({ erro: "Erro interno ao registrar confirmação." });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido');
  }

  const { codigoConvite, detalhesPessoas } = req.body;

  if (!codigoConvite || !Array.isArray(detalhesPessoas)) {
    return res.status(400).json({ erro: 'Dados inválidos.' });
  }

  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    const updates = detalhesPessoas.map(p =>
      db.execute(
        `UPDATE convidados SET status = ?, idade = ? WHERE idConvidado = ? AND codigoConvite = ?`,
        [p.confirmado ? 1 : 2, p.idade || null, p.idConvidado, codigoConvite]
      )
    );

    await Promise.all(updates);

    res.status(200).json({ mensagem: 'Presenças atualizadas com sucesso!' });
  } catch (err) {
    console.error('Erro no banco:', err);
    res.status(500).json({ erro: 'Erro ao atualizar presenças' });
  }
}

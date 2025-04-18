

import { db } from './db'; // ajuste o caminho para sua instância de conexão com o banco, ex: mysql2

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { codigoConvite } = req.method === 'POST' ? req.body : req.query;

  if (!codigoConvite) {
    return res.status(400).json({ erro: 'Código de convite não informado.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT idConvidado, codigoConvite, nome, idade, email, telefone, status, crianca FROM convidados WHERE codigoConvite = ?',
      [codigoConvite]
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensagem: 'Nenhum convidado localizado com este código de convite.' });
    }

    return res.status(200).json({ convidados: rows });
  } catch (error) {
    console.error('Erro ao buscar convidados:', error);
    return res.status(500).json({ erro: 'Erro interno ao buscar os convidados.' });
  }
}
import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import nodemailer from 'nodemailer';
import multer from 'multer';
import fs from 'fs';
import twilio from 'twilio';
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;
const client = twilio(accountSid, authToken);
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
import XLSX from 'xlsx';
import path from 'path';
import PDFDocument from 'pdfkit';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.post('/api/buscaConvite', async (req, res) => {
  try {
    const { codigoConvite } = req.body;

    if (!codigoConvite) {
      return res.status(400).json({ erro: "Código de convite não informado." });
    }

    const [rows] = await db.query(
      "SELECT idConvidado, codigoConvite, nome, idade, email, telefone, status, crianca, entregue FROM convidados WHERE codigoConvite = ?",
      [codigoConvite]
    );

    const convidadosComBoolean = rows.map((convidado) => ({
      ...convidado,
      crianca: Boolean(convidado.crianca),
    }));

    if (rows.length === 0) {
      return res.status(200).json({ convidados: [], codigoValido: false, mensagem: "Nenhum convidado localizado com este código de convite." });
    }

    const nomesStatus = convidadosComBoolean.map(c => {
      const statusTexto = c.status === 1 ? 'Confirmado' : c.status === 2 ? 'Não comparecerá' : 'Pendente';
      return `<li>${c.nome} — ${statusTexto}</li>`;
    }).join('');

    const nomePrincipal = convidadosComBoolean[0]?.nome || 'Alguém';
    try {
      await db.query(
        "INSERT INTO visitas (idFamilia) VALUES (?)",
        [codigoConvite]
      );
    } catch (visitaError) {
      console.error("Erro ao registrar visita:", visitaError.message);
    }
    if (codigoConvite != 1240) {
      await transporter.sendMail({
        from: `"João Pedro - Sistema" <${process.env.EMAIL_USER}>`,
        to: "joaopedrovsilva102@gmail.com",
        subject: `${nomePrincipal} abriu o convite!`,
        html: `
          <div style="background:#000;color:#F2B21C;padding:20px;border-radius:8px;font-family:'TexGyreTermes',sans-serif;">
            <h2 style="color:#f2c14e;">Convite aberto por ${nomePrincipal}</h2>
            <p>Veja abaixo o status atual dos convidados deste convite:</p>
            <ul>${nomesStatus}</ul>
          </div>
        `
      });
    }

    const entregue = rows[0]?.entregue === 1;
    return res.status(200).json({ convidados: convidadosComBoolean, entregue });
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
     // Busca os convidados antigos antes da atualização para comparar status
     const [convidadosAntigos] = await db.query(
      "SELECT idConvidado, telefone, nome, status FROM convidados WHERE codigoConvite = ?",
      [codigoConvite]
    );
    console.log("Antigos ", convidadosAntigos);
    const updatePromises = convidados.map(async (convidado) => {
      const { idConvidado, status, idade, crianca } = convidado;
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
    // Mapeia os convidados para saber quem mudou de pendente (0) para confirmado (1)
    const convidadosConvertidos = convidados.map(c => {
      const antigo = convidadosAntigos.find(a => a.idConvidado === c.idConvidado);
      return {
        ...c,
        nome: c.nome || c.nomeConvidado || '',
        telefone: antigo.telefone,
        mudouParaConfirmado: antigo?.status === 0 && c.status === 1
      };
    });
    console.log(convidadosConvertidos);
    // Envia SMS apenas para quem mudou de pendente para confirmado e tem telefone válido
    for (const convidado of convidadosConvertidos) {
      if (convidado.mudouParaConfirmado && convidado.telefone && convidado.telefone.replace(/\D/g, '').length >= 10) {
        const phone = '+55' + convidado.telefone.replace(/\D/g, '');
        const rawPrimeiroNome = convidado.nome?.split(' ')[0] || '';
        const sanitizedNome = rawPrimeiroNome.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const primeiroNome = sanitizedNome.length <= 10 ? sanitizedNome : '';
        try {
          await client.messages.create({
            body: `Oi${primeiroNome ? ' ' + primeiroNome : ''}, presenca confirmada! Te espero dia 30/08 as 20h no Maria Horos Buffet. R. 1 de Maio, 497 - Niteroi.`,
            from: '+16814323414',
            to: phone
          });
          console.log("SMS ENVIADO");
        } catch (smsError) {
          console.error(`Erro ao enviar SMS de confirmacao para ${phone}:`, smsError.message);
        }
      }
    }
console.log(convidados)
    const nomesConfirmados = convidados.map((c) => {
      const statusTexto = c.status === 1 ? 'Confirmado' : c.status === 2 ? 'Não comparecerá' : 'Pendente';
      let tipoTexto = 'Adulto';
      console.log(c.crianca)
      if (c.crianca) {
        if (c.idade !== null && c.idade !== undefined) {
          tipoTexto = `${c.idade} anos (Criança)`;
        } else {
          tipoTexto = 'Criança';
        }
      }
      const nome = c.nome || c.nomeConvidado || 'Convidado';
      return `<li>${nome} - ${tipoTexto} — ${statusTexto}</li>`;
    }).join('');

    const confirmadosList = convidados.filter(c => c.status === 1).map(c => c.nome || c.nomeConvidado || 'Convidado');
    const recusadosList = convidados.filter(c => c.status === 2).map(c => c.nome || c.nomeConvidado || 'Convidado');

    let mensagemExtra = '';
    if (confirmadosList.length === 0 && recusadosList.length > 0) {
      mensagemExtra = `<p style="margin-top:20px;">Lamentamos que ninguém tenha podido confirmar a presença. 😢</p>
      <p>Caso mudem de ideia, é possível acessar novamente o convite e confirmar até <strong>30/07/2025</strong>.</p>`;
    } else if (recusadosList.length > 0) {
      const recusadosFormatado = recusadosList.join(', ').replace(/, ([^,]*)$/, ' e $1');
      const confirmadosFormatado = confirmadosList.join(', ').replace(/, ([^,]*)$/, ' e $1');
      mensagemExtra = `<p style="margin-top:20px;">Que pena que ${recusadosFormatado} não poderá(ão) comparecer. Sentiremos muita falta! 😔</p>
      <p>Mas estamos felizes que ${confirmadosFormatado} irá(ão) celebrar conosco! 🎉</p>
      <p>Se houver mudança de planos, é possível atualizar até <strong>30/07/2025</strong>.</p>`;
    }

    const [todosConvidados] = await db.query(`
      SELECT c.idConvidado, c.codigoConvite, c.nome, c.status, c.idade, c.crianca, cf.dataConfirmacao
      FROM convidados c
      LEFT JOIN (
        SELECT codigoConvite, MAX(dataConfirmacao) as dataConfirmacao
        FROM Confirmacoes
        GROUP BY codigoConvite
      ) cf ON c.codigoConvite = cf.codigoConvite
    `);

    const confirmados = todosConvidados.filter(c => c.status === 1);
    const recusados = todosConvidados.filter(c => c.status === 2);
    const pendentes = todosConvidados.filter(c => c.status !== 1 && c.status !== 2);

    const totalConfirmados = confirmados.length;
    const totalRecusados = recusados.length;
    const totalPendentes = pendentes.length;
    const totalCriancasConfirmadas = confirmados.filter(c => c.crianca).length;
    const totalAdultosConfirmados = totalConfirmados - totalCriancasConfirmadas;

    const criancasIsentas = confirmados.filter(c => c.crianca && c.idade <= 5).length;
    const criancasMeia = confirmados.filter(c => c.crianca && c.idade >= 6 && c.idade <= 10).length;
    const criancasAcima10 = confirmados.filter(c => c.crianca && c.idade > 10).length;

    const workbook = XLSX.utils.book_new();

    const createSheetData = (lista) => {
      return lista.map((c, i) => ({
        '#': i + 1,
        Nome: c.nome,
        Tipo: c.crianca ? `CRIANCA${c.idade ? ` (${c.idade} anos)` : ''}` : 'Adulto',
        Idade: c.idade ?? '',
        CodigoConvite: c.codigoConvite,
        Status: c.status === 1 ? 'Confirmado' : c.status === 2 ? 'Recusado' : 'Pendente',
        DataConfirmacao: c.dataConfirmacao ? new Date(c.dataConfirmacao).toLocaleDateString('pt-BR') : ''
      }));
    };

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(createSheetData(confirmados)), 'Confirmados');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(createSheetData(recusados)), 'Recusados');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(createSheetData(pendentes)), 'Pendentes');

    const resumo = [{
      TotalConfirmados: totalConfirmados,
      TotalRecusados: totalRecusados,
      TotalPendentes: totalPendentes,
      AdultosConfirmados: totalAdultosConfirmados + criancasAcima10,
      CriancasConfirmadas: totalCriancasConfirmadas,
      CriancasIsentas_0a5: criancasIsentas,
      CriancasMeia_6a10: criancasMeia
    }];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(resumo), 'Resumo');

    const excelPath = path.resolve('./convidados_confirmados.xlsx');
    XLSX.writeFile(workbook, excelPath);

    let mailOptionsConvidado;

    if (confirmadosList.length === 0 && recusadosList.length > 0) {
      mailOptionsConvidado = {
        from: `"João Pedro Vargas da Silva" <${process.env.EMAIL_USER}>`,
        to: emailConfirmacao,
        subject: "Sentiremos sua falta 😢",
        html: `
          <div style="background-color:#000000;padding:20px;border-radius:10px;color:#F2B21C;font-family:'TexGyreTermes',sans-serif;text-align:center;">
            <img src="https://i.imgur.com/h6JrguV.jpeg" style="max-width:200px;width:100%;border-radius:8px;border:2px solid #F2B21C;margin-bottom:15px;display:block;margin-left:auto;margin-right:auto;" />
            <h2 style="color:#f2c14e;">Poxa, que pena! 😢</h2>
        <p>Recebi a confirmação de que infelizmente ninguém da sua família poderá comparecer à recepção da minha formatura.</p>
            <p>Sentirei muito a falta de vocês nesse dia tão importante.</p>
            <p>Mas tudo bem, caso mude de ideia até <strong>30/07/2025</strong>, você ainda pode acessar o convite e atualizar a resposta.</p>
            <div style="margin-top:30px;">
              <a href="https://joaovargas.dev.br/formatura" target="_blank" style="text-decoration:none;">
                <button style="background-color:#f2c14e;color:#000;font-weight:bold;border:none;padding:10px 20px;border-radius:6px;font-family:'TexGyreTermes',sans-serif;margin-right:10px;">
                  Reabrir Convite
                </button>
              </a>
              <a href="https://wa.me/5551996121240" target="_blank" style="text-decoration:none;">
                <button style="background-color:#F2B21C;color:#000;font-weight:bold;border:none;padding:10px 20px;border-radius:6px;font-family:'TexGyreTermes',sans-serif;">
                  Falar comigo no WhatsApp
                </button>
              </a>
            </div>
          </div>
        `
      };
    } else {
      mailOptionsConvidado = {
        from: `"João Pedro Vargas da Silva" <${process.env.EMAIL_USER}>`,
        to: emailConfirmacao,
        subject: "🎉 Confirmação recebida! Estou te esperando em 30/08! 🎓🥂",
        html: `
          <div style="background-color:#000000;padding:20px;border-radius:10px;color:#F2B21C;font-family:'TexGyreTermes',sans-serif;text-align:center;">
            <img src="https://i.imgur.com/h6JrguV.jpeg" style="max-width:250px;width:100%;border-radius:8px;border:2px solid #F2B21C;margin-bottom:15px;display:block;margin-left:auto;margin-right:auto;" />
            <h2 style="color:#f2c14e;">Presença Confirmada! 🎉</h2>
            <p>Que alegria saber que você vem celebrar comigo esse momento tão especial! 💙</p>
            <p>Mal posso esperar para te ver na recepção da minha formatura! 🧑‍🎓</p>
            <p><strong>📅 Data:</strong> 30/08/2025</p>
            <p><strong>⏰ Horário:</strong> 20h</p>
            <p><strong>📍 Local:</strong> Maria Horos Buffet, Rua Primeiro de Maio, 497 – Niterói, Canoas/RS</p>
            <p><strong>👔 Traje:</strong> Passeio completo</p>
            <p style="margin-top:20px;">Convidado(s) confirmado(s):</p>
            <ul style="text-align:left;display:inline-block;margin:auto;">${nomesConfirmados}</ul>
            ${mensagemExtra}
            <p style="margin-top:30px;">Se precisar editar alguma informação ou mudar de ideia, é só acessar novamente seu convite até <strong>30/07/2025</strong>! 😊</p>
            <div style="margin-top:30px;">
              <a href="https://joaovargas.dev.br/formatura" target="_blank" style="text-decoration:none;">
                <button style="background-color:#f2c14e;color:#000;font-weight:bold;border:none;padding:10px 20px;border-radius:6px;font-family:'TexGyreTermes',sans-serif;margin-right:10px;">
                  Acessar Convite
                </button>
              </a>
              <a href="https://wa.me/5551996121240" target="_blank" style="text-decoration:none;">
                <button style="background-color:#F2B21C;color:#000;font-weight:bold;border:none;padding:10px 20px;border-radius:6px;font-family:'TexGyreTermes',sans-serif;">
                  Falar comigo no WhatsApp
                </button>
              </a>
            </div>
          </div>
        `
      };
    }

    const mailOptionsAdmin = {
      from: `"João Pedro Vargas da Silva" <${process.env.EMAIL_USER}>`,
      to: "joaopedrovsilva102@gmail.com",
      subject: `Nova confirmação recebida (convite ${codigoConvite})`,
      html: `
        <div style="background-color:#000000;padding:20px;border-radius:10px;color:#F2B21C;font-family:'TexGyreTermes',sans-serif;">
          <h2 style="color:#f2c14e;font-family:'TexGyreTermes',sans-serif;">Nova Confirmação</h2>
          <p style="font-family:'TexGyreTermes',sans-serif;">Convidado com código <strong>${codigoConvite}</strong> respondeu ao convite.</p>
          <p style="font-family:'TexGyreTermes',sans-serif;">Email informado: ${emailConfirmacao}</p>
          <p><strong style="font-family:'TexGyreTermes',sans-serif;">Lista:</strong></p>
          <ul style="font-family:'TexGyreTermes',sans-serif;">${nomesConfirmados}</ul>
        </div>
      `,
      attachments: [{
        filename: 'convidados_confirmados.xlsx',
        path: excelPath
      }]
    };

    await transporter.sendMail(mailOptionsConvidado);
    await transporter.sendMail(mailOptionsAdmin);

    return res.status(200).json({ mensagem: "Confirmação registrada com sucesso." });
  } catch (error) {
    console.error("Erro ao confirmar presença:", error);
    res.status(500).json({ erro: "Erro interno ao registrar confirmação." });
  }
});

app.post('/api/buscaCodigoConvitePorTelefone', async (req, res) => {
  try {
    const { telefone } = req.body;

    if (!telefone) {
      return res.status(400).json({ erro: "Telefone não informado." });
    }

    const [rows] = await db.query(
      "SELECT codigoConvite FROM convidados WHERE telefone = ? LIMIT 1",
      [telefone]
    );

    if (rows.length === 0) {
      return res.status(404).json({ encontrado: false, mensagem: "Nenhum convite encontrado para esse número de telefone." });
    }

    return res.status(200).json({ encontrado: true, codigoConvite: rows[0].codigoConvite });
  } catch (error) {
    console.error("Erro ao buscar código de convite por telefone:", error);
    res.status(500).json({ erro: "Erro interno ao buscar código de convite." });
  }
});

app.post('/api/importarConvidados', upload.single('arquivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: "Arquivo não enviado." });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    for (const convidado of data) {
      const nome = convidado.Nome || convidado.nome;
      if (!nome || nome.trim() === "") continue;

      const idade = convidado.Idade || convidado.idade || null;
      const telefone = convidado.Telefone || convidado.telefone || '';
      const email = convidado.Email || convidado.email || null;
      const codigoConvite = convidado.CodigoConvite || convidado.codigoConvite;
      const crianca = convidado.Crianca === '1' || convidado.crianca === 1 || convidado.crianca === true;

      await db.query(
        "INSERT INTO convidados (nome, idade, telefone, email, codigoConvite, crianca, status) VALUES (?, ?, ?, ?, ?, ?, 0)",
        [nome, idade, telefone, email, codigoConvite, crianca]
      );
    }

    fs.unlinkSync(req.file.path); // remove o arquivo temporário
    res.status(200).json({ mensagem: "Convidados importados com sucesso." });
  } catch (error) {
    console.error("Erro ao importar convidados:", error);
    res.status(500).json({ erro: "Erro ao importar convidados." });
  }
});

// Retorna todos os convidados agrupados por código de convite
app.get('/api/listarConvidadosPorFamilia', async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT idConvidado, nome, codigoConvite, status, crianca, idade, telefone, entregue FROM convidados ORDER BY codigoConvite"
    );

    // Consulta visitas agrupadas por código
    const [visitas] = await db.query(`
      SELECT idFamilia as codigoConvite, 
             MAX(dataHoraVisita) as ultimaVisita, 
             COUNT(*) as totalVisitas 
      FROM visitas 
      GROUP BY idFamilia
    `);
    const visitasPorFamilia = {};
    visitas.forEach(v => {
      visitasPorFamilia[v.codigoConvite] = {
        ultimaVisita: v.ultimaVisita,
        totalVisitas: v.totalVisitas
      };
    });

    // Consulta confirmações agrupadas por código
    const [confirmacoes] = await db.query(`
      SELECT c1.codigoConvite, 
             c1.dataConfirmacao as ultimaConfirmacao, 
             c1.emailConfirmacao, 
             COUNT(c2.codigoConvite) as totalConfirmacoes
      FROM Confirmacoes c1
      JOIN Confirmacoes c2 ON c2.codigoConvite = c1.codigoConvite
      WHERE c1.dataConfirmacao = (
        SELECT MAX(c3.dataConfirmacao)
        FROM Confirmacoes c3
        WHERE c3.codigoConvite = c1.codigoConvite
      )
      GROUP BY c1.codigoConvite
    `);
    const confirmacoesPorFamilia = {};
    confirmacoes.forEach(c => {
      confirmacoesPorFamilia[c.codigoConvite] = {
        ultimaConfirmacao: c.ultimaConfirmacao,
        totalConfirmacoes: c.totalConfirmacoes,
        emailConfirmacao: c.emailConfirmacao
      };
    });

    const familias = {};
    for (const row of rows) {
      if (!familias[row.codigoConvite]) {
        familias[row.codigoConvite] = {
          entregue: row.entregue || false,
          convidados: []
        };
      }
      familias[row.codigoConvite].convidados.push({
        idConvidado: row.idConvidado,
        nome: row.nome,
        status: row.status,
        crianca: !!row.crianca,
        idade: row.idade,
        telefone: row.telefone
      });
      // Adiciona info de visita por família
      familias[row.codigoConvite].visita = visitasPorFamilia[row.codigoConvite] || {
        ultimaVisita: null,
        totalVisitas: 0
      };
      // Adiciona info de confirmação por família
      familias[row.codigoConvite].confirmacao = confirmacoesPorFamilia[row.codigoConvite] || {
        ultimaConfirmacao: null,
        totalConfirmacoes: 0,
        emailConfirmacao: null
      };
    }

    res.status(200).json(familias);
  } catch (error) {
    console.error("Erro ao listar convidados:", error);
    res.status(500).json({ erro: "Erro ao listar convidados." });
  }
});

// Atualiza o status de um convidado para confirmado
app.post('/api/confirmarConvidado', async (req, res) => {
  try {
    const { idConvidado, enviaSMS } = req.body;
    await db.query("UPDATE convidados SET status = 1 WHERE idConvidado = ?", [idConvidado]);
    // Adiciona registro de confirmação manual
    await db.query(
      "INSERT INTO Confirmacoes (codigoConvite, dataConfirmacao, emailConfirmacao) VALUES ((SELECT codigoConvite FROM convidados WHERE idConvidado = ?), NOW(), 'Confirmação Manual')",
      [idConvidado]
    );
    res.status(200).json({ mensagem: "Convidado confirmado com sucesso." });
    // Recupera nome e telefone do convidado
    const [[convidadoInfo]] = await db.query(
      "SELECT nome, telefone FROM convidados WHERE idConvidado = ?",
      [idConvidado]
    );
    const nomeConvidado = convidadoInfo?.nome || 'Convidado Desconhecido';

    await transporter.sendMail({
      from: `"João Pedro - Sistema" <${process.env.EMAIL_USER}>`,
      to: "joaopedrovsilva102@gmail.com",
      subject: `Status alterado: ${nomeConvidado} confirmado`,
      html: `<p>O convidado <strong>${nomeConvidado}</strong> (ID: ${idConvidado}) foi <strong>confirmado</strong> manualmente.</p>`
    });

    // Envia SMS ao convidado se enviaSMS === 1 e telefone válido
    if (
      enviaSMS === 1 &&
      convidadoInfo?.telefone &&
      convidadoInfo.telefone.replace(/\D/g, '').length >= 10
    ) {
      const phone = '+55' + convidadoInfo.telefone.replace(/\D/g, '');
      const rawPrimeiroNome = nomeConvidado.split(' ')[0] || '';
      const sanitizedNome = rawPrimeiroNome.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const primeiroNome = sanitizedNome.length <= 15 ? sanitizedNome : '';
      try {
        await client.messages.create({
          body: `Oi${primeiroNome ? ' ' + primeiroNome : ''}, presenca confirmada! Te espero dia 30/08 as 20h no Maria Horos Buffet.`,
          from: '+16814323414',
          to: phone
        });
        console.log("SMS enviado ao confirmar convidado.");
      } catch (smsError) {
        console.error(`Erro ao enviar SMS de confirmacao para ${phone}:`, smsError.message);
      }
    }
  } catch (error) {
    console.error("Erro ao confirmar convidado:", error);
    res.status(500).json({ erro: "Erro ao confirmar convidado." });
  }
});

// Atualiza o status de um convidado para recusado
app.post('/api/recusarConvidado', async (req, res) => {
  try {
    const { idConvidado } = req.body;
    await db.query("UPDATE convidados SET status = 2 WHERE idConvidado = ?", [idConvidado]);
    // Adiciona registro de recusa manual
    await db.query(
      "INSERT INTO Confirmacoes (codigoConvite, dataConfirmacao, emailConfirmacao) VALUES ((SELECT codigoConvite FROM convidados WHERE idConvidado = ?), NOW(), 'Confirmação Manual')",
      [idConvidado]
    );
    res.status(200).json({ mensagem: "Convidado recusado com sucesso." });
    const [[convidadoInfo]] = await db.query(
        "SELECT nome FROM convidados WHERE idConvidado = ?",
        [idConvidado]
      );
      const nomeConvidado = convidadoInfo?.nome || 'Convidado Desconhecido';

      await transporter.sendMail({
        from: `"João Pedro - Sistema" <${process.env.EMAIL_USER}>`,
        to: "joaopedrovsilva102@gmail.com",
        subject: `Status alterado: ${nomeConvidado} recusado`,
        html: `<p>O convidado <strong>${nomeConvidado}</strong> (ID: ${idConvidado}) foi <strong>recusado</strong> manualmente.</p>`
      });

  } catch (error) {
    console.error("Erro ao recusar convidado:", error);
    res.status(500).json({ erro: "Erro ao recusar convidado." });
  }
});

// Atualiza o status de um convidado para pendente
app.post('/api/pendenteConvidado', async (req, res) => {
  try {
    const { idConvidado } = req.body;
    await db.query("UPDATE convidados SET status = 0 WHERE idConvidado = ?", [idConvidado]);
    res.status(200).json({ mensagem: "Convidado marcado como pendente com sucesso." });
    const [[convidadoInfo]] = await db.query(
        "SELECT nome FROM convidados WHERE idConvidado = ?",
        [idConvidado]
      );
      const nomeConvidado = convidadoInfo?.nome || 'Convidado Desconhecido';
  
      await transporter.sendMail({
        from: `"João Pedro - Sistema" <${process.env.EMAIL_USER}>`,
        to: "joaopedrovsilva102@gmail.com",
        subject: `Status alterado: ${nomeConvidado} pendente`,
        html: `<p>O convidado <strong>${nomeConvidado}</strong> (ID: ${idConvidado}) foi marcado como <strong>pendente</strong> manualmente.</p>`
      });
  } catch (error) {
    console.error("Erro ao marcar convidado como pendente:", error);
    res.status(500).json({ erro: "Erro ao atualizar status para pendente." });
  }
});

// Remove um convidado
app.post('/api/deletarConvidado', async (req, res) => {
  try {
    const { idConvidado } = req.body;
    if (!idConvidado) {
      return res.status(400).json({ erro: "ID do convidado não fornecido." });
    }
    const [[convidadoInfo]] = await db.query("SELECT nome FROM convidados WHERE idConvidado = ?", [idConvidado]);
    const nomeConvidado = convidadoInfo ? convidadoInfo.nome : 'Convidado desconhecido';
    await db.query("DELETE FROM convidados WHERE idConvidado = ?", [idConvidado]);
    await transporter.sendMail({
      from: `"João Pedro - Sistema" <${process.env.EMAIL_USER}>`,
      to: "joaopedrovsilva102@gmail.com",
      subject: "Convidado deletado",
      html: `<p>O convidado <strong>${nomeConvidado}</strong> (ID: ${idConvidado}) foi removido do sistema.</p>`
    });
    res.status(200).json({ mensagem: "Convidado removido com sucesso." });
  } catch (error) {
    console.error("Erro ao remover convidado:", error);
    res.status(500).json({ erro: "Erro ao remover convidado." });
  }
});

// Adiciona um novo convidado
app.post('/api/adicionarConvidado', async (req, res) => {
  try {
    const { nome, idade, telefone, email, codigoConvite, crianca } = req.body;
    if (!nome || !codigoConvite) {
      return res.status(400).json({ erro: "Nome e código do convite são obrigatórios." });
    }
    await db.query(
      "INSERT INTO convidados (nome, idade, telefone, email, codigoConvite, crianca, status) VALUES (?, ?, ?, ?, ?, ?, 0)",
      [nome, idade, telefone, email, codigoConvite, crianca]
    );
    res.status(200).json({ mensagem: "Convidado adicionado com sucesso." });
    await transporter.sendMail({
        from: `"João Pedro - Sistema" <${process.env.EMAIL_USER}>`,
        to: "joaopedrovsilva102@gmail.com",
        subject: "Novo convidado adicionado",
        html: `
          <p>Um novo convidado foi adicionado:</p>
          <ul>
            <li>Nome: ${nome}</li>
            <li>Telefone: ${telefone}</li>
            <li>Código Convite: ${codigoConvite}</li>
            <li>${crianca ? 'Criança' : 'Adulto'}${idade ? ` (${idade} anos)` : ''}</li>
          </ul>
        `
      });
  } catch (error) {
    console.error("Erro ao adicionar convidado:", error);
    res.status(500).json({ erro: "Erro ao adicionar convidado." });
  }
});

app.post('/api/editarConvidado', async (req, res) => {
    const { idConvidado, nome, telefone, codigoConvite, crianca, idade } = req.body;
  
    if (!idConvidado || !nome || !codigoConvite) {
      return res.status(400).json({ erro: 'Campos obrigatórios ausentes.' });
    }
  
    try {
      await db.query(
        'UPDATE convidados SET nome = ?, telefone = ?, codigoConvite = ?, crianca = ?, idade = ? WHERE idConvidado = ?',
        [nome, telefone, codigoConvite, crianca ? 1 : 0, idade ?? null, idConvidado]
      );
  
      res.status(200).json({ sucesso: true });
      await transporter.sendMail({
        from: `"João Pedro - Sistema" <${process.env.EMAIL_USER}>`,
        to: "joaopedrovsilva102@gmail.com",
        subject: "Edição de convidado realizada",
        html: `
          <p>O convidado <strong>${nome}</strong> foi editado.</p>
          <ul>
            <li>Telefone: ${telefone}</li>
            <li>Código Convite: ${codigoConvite}</li>
            <li>${crianca ? 'Criança' : 'Adulto'}${idade ? ` (${idade} anos)` : ''}</li>
          </ul>
        `
      });
    } catch (err) {
      console.error('Erro ao editar convidado:', err);
      res.status(500).json({ erro: 'Erro ao editar convidado.' });
    }
  });
  app.get('/api/exportarListaPDF', async (req, res) => {
    try {
      const [convidados] = await db.query('SELECT * FROM convidados ORDER BY codigoConvite ASC');
  
      const familias = {};
      convidados.forEach((c) => {
        if (!familias[c.codigoConvite]) familias[c.codigoConvite] = [];
        familias[c.codigoConvite].push(c);
      });
  
      const doc = new PDFDocument();
      const filename = 'lista_convidados.pdf';
  
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', 'application/pdf');
      doc.pipe(res);
  
      doc.fontSize(20).text('Lista de Convidados por Família', { align: 'center' }).moveDown();
  
      Object.entries(familias).forEach(([codigo, lista]) => {
        doc.fontSize(16).text(`Família ${codigo}`, { underline: true });
        lista.forEach(c => {
          const status = c.status === 1 ? 'Confirmado' : c.status === 2 ? 'Recusado' : 'Pendente';
          const crianca = c.crianca ? ` - Criança (${c.idade || 'sem idade'})` : '';
          doc.fontSize(12).text(`• ${c.nome}${crianca} - ${status}`);
        });
        doc.moveDown();
      });
  
      const totalConvidados = convidados.length;
      const totalFamilias = Object.keys(familias).length;
      const confirmados = convidados.filter(c => c.status === 1);
      const recusados = convidados.filter(c => c.status === 2);
      const pendentes = convidados.filter(c => c.status === 0);
      const adultosConfirmados = confirmados.filter(c => !c.crianca || (c.idade && c.idade > 10));
      const criancas05 = confirmados.filter(c => c.crianca && c.idade >= 0 && c.idade <= 5);
      const criancas610 = confirmados.filter(c => c.crianca && c.idade >= 6 && c.idade <= 10);
  
      doc.addPage().fontSize(18).text('Consolidado', { underline: true }).moveDown();
      doc.fontSize(12).list([
        `Total de Convidados: ${totalConvidados}`,
        `Total de Famílias: ${totalFamilias}`,
        `Adultos Confirmados: ${adultosConfirmados.length}`,
        `Crianças 0 a 5 anos Confirmadas: ${criancas05.length}`,
        `Crianças 6 a 10 anos Confirmadas: ${criancas610.length}`,
        `Pessoas Recusadas: ${recusados.length}`,
        `Pessoas Pendentes: ${pendentes.length}`,
      ]);
  
      doc.end();
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      res.status(500).json({ erro: 'Erro ao gerar PDF.' });
    }
  });

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});


// Endpoint para marcar família como entregue
app.post('/api/marcarEntregue', async (req, res) => {
  try {
    const { codigoConvite } = req.body;
    if (!codigoConvite) {
      return res.status(400).json({ erro: "Código do convite não fornecido." });
    }

    await db.query("UPDATE convidados SET entregue = 1 WHERE codigoConvite = ?", [codigoConvite]);

    // Envia SMS para todos os convidados da família com telefone válido
    const [convidados] = await db.query("SELECT nome, telefone FROM convidados WHERE codigoConvite = ?", [codigoConvite]);

    for (const convidado of convidados) {
      if (convidado.telefone && convidado.telefone.replace(/\D/g, '').length >= 10) {
        const phone = '+55' + convidado.telefone.replace(/\D/g, '');
        const rawPrimeiroNome = convidado.nome?.split(' ')[0] || '';
        const sanitizedNome = rawPrimeiroNome.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const primeiroNome = sanitizedNome.length <= 15 ? sanitizedNome : '';
        try {
          await client.messages.create({
            body: `Oi${primeiroNome ? ' ' + primeiroNome : ''}, seu kit-convite chegou! Confirme presença entre 15/06 e 30/07 em: https://joaovargas.dev.br/formatura/?=${codigoConvite}`,
            from: '+16814323414',
            to: phone
          });
        } catch (smsError) {
          console.error(`Erro ao enviar SMS para ${phone}:`, smsError.message);
        }
      }
    }

    res.status(200).json({ mensagem: "Família marcada como entregue com sucesso." });
  } catch (error) {
    console.error("Erro ao marcar como entregue:", error);
    res.status(500).json({ erro: "Erro ao marcar como entregue." });
  }
});

// Endpoint para marcar família como não entregue
app.post('/api/marcarNaoEntregue', async (req, res) => {
  try {
    const { codigoConvite } = req.body;
    if (!codigoConvite) {
      return res.status(400).json({ erro: "Código do convite não fornecido." });
    }

    await db.query("UPDATE convidados SET entregue = 0 WHERE codigoConvite = ?", [codigoConvite]);
    res.status(200).json({ mensagem: "Família marcada como não entregue com sucesso." });
  } catch (error) {
    console.error("Erro ao marcar como não entregue:", error);
    res.status(500).json({ erro: "Erro ao marcar como não entregue." });
  }
});


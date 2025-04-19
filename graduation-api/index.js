import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
import XLSX from 'xlsx';
import path from 'path';

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
      crianca: Boolean(convidado.crianca),
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

    const nomesConfirmados = convidados.map((c) => {
      const statusTexto = c.status === 1 ? 'Confirmado' : c.status === 2 ? 'Não comparecerá' : 'Pendente';
      const idadeTexto = c.crianca && c.idade ? `${c.idade} anos` : 'Adulto';
      const nome = c.nome || c.nomeConvidado || 'Convidado';
      return `<li>${nome} - ${idadeTexto} — ${statusTexto}</li>`;
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
    console.log(todosConvidados);

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
        from: `"João Pedro - Formatura" <${process.env.EMAIL_USER}>`,
        to: emailConfirmacao,
        subject: "Sentiremos sua falta 😢",
        html: `
          <div style="background-color:#000000;padding:20px;border-radius:10px;color:#CFAA93;font-family:'TexGyreTermes',sans-serif;text-align:center;">
            <img src="https://i.imgur.com/h6JrguV.jpeg" style="max-width:200px;width:100%;border-radius:8px;border:2px solid #CFAA93;margin-bottom:15px;display:block;margin-left:auto;margin-right:auto;" />
            <h2 style="color:#f2c14e;">Poxa, que pena! 😢</h2>
        <p>Recebi a confirmação de que infelizmente ninguém da sua família poderá comparecer à recepção minha formatura.</p>
            <p>Sentirei muito a falta de vocês nesse dia tão importante.</p>
            <p>Mas tudo bem, caso mude de ideia até <strong>30/07/2025</strong>, você ainda pode acessar o convite e atualizar a resposta.</p>
            <div style="margin-top:30px;">
              <a href="https://joaovargas.dev.br/formatura" target="_blank" style="text-decoration:none;">
                <button style="background-color:#f2c14e;color:#000;font-weight:bold;border:none;padding:10px 20px;border-radius:6px;font-family:'TexGyreTermes',sans-serif;margin-right:10px;">
                  Reabrir Convite
                </button>
              </a>
              <a href="https://wa.me/5551996121240" target="_blank" style="text-decoration:none;">
                <button style="background-color:#CFAA93;color:#000;font-weight:bold;border:none;padding:10px 20px;border-radius:6px;font-family:'TexGyreTermes',sans-serif;">
                  Falar comigo no WhatsApp
                </button>
              </a>
            </div>
          </div>
        `
      };
    } else {
      mailOptionsConvidado = {
        from: `"João Pedro - Formatura" <${process.env.EMAIL_USER}>`,
        to: emailConfirmacao,
        subject: "🎉 Confirmação recebida! Estou te esperando em 30/08! 🎓🥂",
        html: `
          <div style="background-color:#000000;padding:20px;border-radius:10px;color:#CFAA93;font-family:'TexGyreTermes',sans-serif;text-align:center;">
            <img src="https://i.imgur.com/h6JrguV.jpeg" style="max-width:250px;width:100%;border-radius:8px;border:2px solid #CFAA93;margin-bottom:15px;display:block;margin-left:auto;margin-right:auto;" />
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
                <button style="background-color:#CFAA93;color:#000;font-weight:bold;border:none;padding:10px 20px;border-radius:6px;font-family:'TexGyreTermes',sans-serif;">
                  Falar comigo no WhatsApp
                </button>
              </a>
            </div>
          </div>
        `
      };
    }

    const mailOptionsAdmin = {
      from: `"Sistema Formatura" <${process.env.EMAIL_USER}>`,
      to: "joaopedrovsilva102@gmail.com",
      subject: `Nova confirmação recebida (convite ${codigoConvite})`,
      html: `
        <div style="background-color:#000000;padding:20px;border-radius:10px;color:#CFAA93;font-family:'TexGyreTermes',sans-serif;">
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

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
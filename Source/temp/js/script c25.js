let estoqueBarras = [];
let pecasRequeridas = [];
let barrasUsadas = [];
let sobras = [];

function mostrarSecao(id) {
    const secoes = document.querySelectorAll("section");
    secoes.forEach(secao => {
        secao.style.display = (secao.id === id) ? "block" : "none";
    });

    const calcularCorteBtn = document.getElementById("calcular-corte");
    if (id === "resultado-corte") {
        calcularCorteBtn.style.display = "none";
    } else {
        calcularCorteBtn.style.display = "block";
    }
}

window.onload = function() {
    mostrarSecao('cadastro-estoque');
    carregarDados();
};

function carregarDados() {
    firebase.database().ref('estoqueBarrasc25').once('value').then(function(snapshot) {
        const barrasSalvas = snapshot.val();
        if (barrasSalvas) {
            estoqueBarras = barrasSalvas;
            atualizarEstoque();
        }
    });

    firebase.database().ref('pecasRequeridasc25').once('value').then(function(snapshot) {
        const pecasSalvas = snapshot.val();
        if (pecasSalvas) {
            pecasRequeridas = pecasSalvas;
            atualizarPecas();
        }
    });
}

function salvarDados() {
    firebase.database().ref('estoqueBarrasc25').set(estoqueBarras);
    firebase.database().ref('pecasRequeridasc25').set(pecasRequeridas);
}

function atualizarEstoque() {
    const estoqueList = document.getElementById("estoque");
    estoqueList.innerHTML = "";

    // Ordena as barras em ordem decrescente de comprimento
    estoqueBarras.sort((a, b) => b.comprimento - a.comprimento);

    estoqueBarras.forEach((b, index) => {
        if (b.quantidade > 0) {
            const peso = (b.quantidade * b.comprimento * 0.0386).toFixed(2);
            const item = document.createElement("li");
            item.textContent = `${b.quantidade} barras de ${b.comprimento} cm (Peso: ${peso} kg)`;
            const btnExcluir = document.createElement("button");
            btnExcluir.textContent = "Excluir";
            btnExcluir.onclick = () => excluirItemEstoque(index);
            item.appendChild(btnExcluir);
            estoqueList.appendChild(item);
        }
    });
    salvarDados();  // Salve os dados após atualizar o estoque
}

function atualizarPecas() {
    const pecasList = document.getElementById("pecas");
    pecasList.innerHTML = "";
    pecasRequeridas.forEach((p, index) => {
        const item = document.createElement("li");
        item.textContent = `${p.quantidade} peças de ${p.comprimento} cm`;
        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.onclick = () => excluirItemPecas(index);
        item.appendChild(btnExcluir);
        pecasList.appendChild(item);
    });
    salvarDados();  // Salve os dados após atualizar as peças
}

function excluirItemPecas(index) {
    pecasRequeridas.splice(index, 1);
    atualizarPecas();
}

function excluirTodasPecas() {
    pecasRequeridas = [];
    atualizarPecas();
}

function zerarEstoque() {
    estoqueBarras = [];
    atualizarEstoque();
    localStorage.removeItem('estoqueBarras');
}

function excluirItemEstoque(index) {
    estoqueBarras.splice(index, 1);
    atualizarEstoque();
}

document.getElementById("cadastro-barras").addEventListener("submit", function (event) {
    event.preventDefault();
    const comprimento = parseInt(document.getElementById("comprimento").value);
    const quantidade = parseInt(document.getElementById("quantidade").value);

    const barraExistente = estoqueBarras.find(b => b.comprimento === comprimento);
    if (barraExistente) {
        barraExistente.quantidade += quantidade;
    } else {
        estoqueBarras.push({ comprimento, quantidade });
    }

    atualizarEstoque();
    this.reset();
});

document.getElementById("cadastro-pecas").addEventListener("submit", function (event) {
    event.preventDefault();
    const comprimento = parseInt(document.getElementById("comprimento-peca").value);
    const quantidade = parseInt(document.getElementById("quantidade-peca").value);

    pecasRequeridas.push({ comprimento, quantidade });
    atualizarPecas();
    this.reset();
});

function calcularCorte() {
    const resultadoDiv = document.getElementById("resultado-corte");
    resultadoDiv.innerHTML = "";

    // Limpa as variáveis globais
    barrasUsadas = [];
    sobras = [];

    // Ordena as barras pelo menor comprimento primeiro
    estoqueBarras.sort((a, b) => a.comprimento - b.comprimento);
    pecasRequeridas.sort((a, b) => b.comprimento - a.comprimento);

    while (pecasRequeridas.length > 0) {
        let melhorOpcao = null;
        let menorSobra = Infinity;
        let melhorCortes = [];
        let melhorBarra = null;

        // Percorre todas as barras disponíveis
        for (let barra of estoqueBarras) {
            if (barra.quantidade > 0) {
                let comprimentoDisponivel = barra.comprimento;
                const cortes = [];
                let sobrasBarra = [];

                for (let i = 0; i < pecasRequeridas.length; i++) {
                    const peca = pecasRequeridas[i];
                    const cortesPossiveis = Math.min(
                        Math.floor(comprimentoDisponivel / peca.comprimento),
                        peca.quantidade
                    );

                    if (cortesPossiveis > 0) {
                        cortes.push({ comprimento: peca.comprimento, quantidade: cortesPossiveis });
                        comprimentoDisponivel -= cortesPossiveis * peca.comprimento;
                    }

                    // Avalia a sobra para priorização
                    if (comprimentoDisponivel < menorSobra) {
                        menorSobra = comprimentoDisponivel;
                        melhorOpcao = barra;
                        melhorCortes = [...cortes];
                        melhorBarra = [...sobrasBarra];
                    }
                }
            }
        }

        if (melhorOpcao) {
            let comprimentoDisponivel = melhorOpcao.comprimento;
            let cortes = [];
            let sobrasBarra = [];

            for (let i = 0; i < pecasRequeridas.length; i++) {
                const peca = pecasRequeridas[i];
                const cortesPossiveis = Math.min(
                    Math.floor(comprimentoDisponivel / peca.comprimento),
                    peca.quantidade
                );

                if (cortesPossiveis > 0) {
                    cortes.push({ comprimento: peca.comprimento, quantidade: cortesPossiveis });
                    comprimentoDisponivel -= cortesPossiveis * peca.comprimento;
                    peca.quantidade -= cortesPossiveis;

                    if (peca.quantidade === 0) {
                        pecasRequeridas.splice(i, 1);
                        i--;
                    }
                }
            }

            melhorOpcao.quantidade--;

            if (comprimentoDisponivel > 0) {
                sobras.push(comprimentoDisponivel);
                sobrasBarra.push(comprimentoDisponivel);
            }

            if (cortes.length > 0) {
                const barraExistente = barrasUsadas.find(b => b.barra === melhorOpcao.comprimento && JSON.stringify(b.cortes) === JSON.stringify(cortes));
                if (barraExistente) {
                    barraExistente.quantidade++;
                } else {
                    barrasUsadas.push({
                        barra: melhorOpcao.comprimento,
                        cortes,
                        sobras: sobrasBarra,
                        quantidade: 1
                    });
                }
            }
        } else {
            resultadoDiv.innerHTML += `<p>Não há barras disponíveis para cortar todas as peças.</p>`;
            break;
        }
    }

    sobras.forEach((sobra) => {
        const sobraExistente = estoqueBarras.find((b) => b.comprimento === sobra);
        if (sobraExistente) {
            sobraExistente.quantidade++;
        } else {
            estoqueBarras.push({ comprimento: sobra, quantidade: 1 });
        }
    });

    atualizarEstoque();

    barrasUsadas.forEach((b) => {
        resultadoDiv.innerHTML += `${b.quantidade} barra(s) de ${b.barra} cm usada(s):\n`;
        b.cortes.forEach((corte) => {
            resultadoDiv.innerHTML += `  - ${corte.quantidade} peça(s) de ${corte.comprimento} cm\n`;
        });
        if (b.sobras.length > 0) {
            resultadoDiv.innerHTML += `  - Sobra(s): ${b.sobras.join(", ")} cm\n`;
        }
        resultadoDiv.innerHTML += `<hr>`;
    });

    salvarDados();
}

document.getElementById("calcular-corte").addEventListener("click", function () {
    calcularCorte();
    mostrarSecao('resultado-corte');
});

function gerarRelatorioEstoque() {
    const estoqueList = document.getElementById("estoque");
    const linhasEstoque = [];
    estoqueList.querySelectorAll("li").forEach(item => {
        const texto = item.textContent.replace("Excluir", "").trim();
        linhasEstoque.push(texto);
    });
    return linhasEstoque;
}

function gerarRelatorioPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const numeroPedido = document.getElementById("numero-pedido").value || "N/A";
    const resultadoDiv = document.getElementById("resultado-corte").innerHTML;

    let y = 10;

    doc.setFontSize(16);
    doc.text("OTIMIZAÇÃO DE BARRAS Ø25 - CAVICON", 50, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Número do Pedido: ${numeroPedido}`, 10, y);
    y += 10;
    doc.text("Barras Utilizadas e Cortes Feitos:", 10, y);
    y += 10;

    const linhas = resultadoDiv.split('<br>').map(linha => linha.replace(/<[^>]*>?/gm, ''));
    linhas.forEach(linha => {
        doc.text(linha, 10, y);
        y += 10;
    });

    // Estatísticas da Otimização
    const barras1200Usadas = barrasUsadas.filter(b => b.barra === 1200).reduce((total, b) => total + b.quantidade, 0);
    const barrasReaproveitadas = barrasUsadas.filter(b => b.barra !== 1200).reduce((total, b) => total + b.quantidade, 0);

    // Pontas Geradas
    const pontasMenores50 = sobras.filter(sobra => sobra < 50);
    const pontasMaiores300 = sobras.filter(sobra => sobra >= 300);
    const pontasEntre51e299 = sobras.filter(sobra => sobra >= 51 && sobra <= 299);

    const totalMetrosCortados = barrasUsadas.reduce((total, barra) => {
        return total + (barra.barra * barra.quantidade);
    }, 0);

    const totalPontasMenores50 = pontasMenores50.reduce((total, ponta) => total + ponta, 0);
    const totalPontasMaiores300 = pontasMaiores300.reduce((total, ponta) => total + ponta, 0);
    const totalPontasEntre51e299 = pontasEntre51e299.reduce((total, ponta) => total + ponta, 0);

    // Calcula os percentuais com base na regra de três
    const percentualPontasMenores50 = totalMetrosCortados > 0 ? ((totalPontasMenores50 * 100) / totalMetrosCortados).toFixed(2) : 0;
    const percentualPontasMaiores300 = totalMetrosCortados > 0 ? ((totalPontasMaiores300 * 100) / totalMetrosCortados).toFixed(2) : 0;
    const percentualPontasEntre51e299 = totalMetrosCortados > 0 ? ((totalPontasEntre51e299 * 100) / totalMetrosCortados).toFixed(2) : 0;

    // Adiciona as Estatísticas da Otimização ao PDF
    doc.addPage();
    y = 10; // Reinicia a posição vertical para a nova página
    doc.setFontSize(14);
    doc.text("ESTATÍSTICAS DA OTIMIZAÇÃO:", 60, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Barras 1200cm usadas: ${barras1200Usadas}`, 10, y);
    y += 10;
    doc.text(`Barras reaproveitadas: ${barrasReaproveitadas}`, 10, y);
    y += 20;
    doc.text("PONTAS GERADAS:", 10, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Pontas menores que 50cm: ${pontasMenores50.length} peças totalizando ${totalPontasMenores50} cm`, 10, y);
    y += 10;
     doc.setFontSize(10);
    doc.text(`*Isso representa ${percentualPontasMenores50}% em relação à quantidade de metros totais cortados`, 10, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Pontas maiores que 300cm: ${pontasMaiores300.length} peças totalizando ${totalPontasMaiores300} cm`, 10, y);
    y += 10;
     doc.setFontSize(10);
    doc.text(`*Isso representa ${percentualPontasMaiores300}% em relação à quantidade de metros totais cortados`, 10, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Pontas entre 51 e 299cm: ${pontasEntre51e299.length} peças totalizando ${totalPontasEntre51e299} cm`, 10, y);
    y += 10;
     doc.setFontSize(10);
    doc.text(`*Isso representa ${percentualPontasEntre51e299}% em relação à quantidade de metros totais cortados`, 10, y);
    doc.setFontSize(12);
    // Adiciona nova página para a seção de Estoque

   
    // Abre o PDF no navegador
    const nomeArquivo = prompt("Digite o nome do arquivo (sem extensão):", "relatorio-corte");
    doc.output("dataurlnewwindow");
}

function gerarListaEstoquePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Obtém a data e hora atual
    const now = new Date();
    const dataHora = now.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

    let y = 10;
    const margemTopo = 10;
    const alturaMaxima = 280; // Margem para evitar corte na página
    const alturaLinha = 10;

    function adicionarCabecalho() {
        doc.setFontSize(16);
        doc.text("LISTA DE ESTOQUE CAVICON Ø25", 10, y);
        y += 10;
        doc.setFontSize(12);
        doc.text(`Data e Hora: ${dataHora}`, 10, y);
        y += 10;
        doc.setFontSize(12);
        doc.text("Quantidade | Comprimento (cm) | Peso (kg)", 10, y);
        y += 10;
        doc.text("----------------------------------------------------------------", 10, y);
        y += 10;
    }

    adicionarCabecalho();

    let pesoTotalBarras = 0;
    let pesoTotalPontas = 0;

    estoqueBarras.forEach(b => {
        if (b.quantidade > 0) {
            const peso = (b.quantidade * b.comprimento * 0.0386).toFixed(2);
            if (b.comprimento == 1200) {
                pesoTotalBarras += parseFloat(peso);
            } else {
                pesoTotalPontas += parseFloat(peso);
            }

            // Verifica se há espaço para imprimir ou se precisa criar uma nova página
            if (y + alturaLinha > alturaMaxima) {
                doc.addPage();
                y = margemTopo;
                adicionarCabecalho();
            }

            doc.text(`${b.quantidade} barra(s) de ${b.comprimento}cm (${peso} kg)`, 10, y);
            y += alturaLinha;
        }
    });

    // Adiciona os totais ao final
    y += 10;
    if (y + 20 > alturaMaxima) {
        doc.addPage();
        y = margemTopo;
        adicionarCabecalho();
    }
    doc.setFontSize(12);
    doc.text(`Peso total de barras (1200cm): ${pesoTotalBarras.toFixed(2)} kg`, 10, y);
    y += 10;
    doc.text(`Peso total de Pontas : ${pesoTotalPontas.toFixed(2)} kg`, 10, y);

    // Pergunta o nome do arquivo e gera o PDF
    const nomeArquivo = prompt("Digite o nome do arquivo (sem extensão):", "lista-estoque") || "lista-estoque";
    doc.save(`${nomeArquivo}.pdf`);
}

// Adiciona o evento de clique ao botão gerar-lista-estoque
document.getElementById("gerar-lista-estoque").addEventListener("click", gerarListaEstoquePDF);

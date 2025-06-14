let MostrarSenha = document.getElementById("VerSenha");
let Senha = document.getElementById("senha");
let trava = false;
window.correct = false; // Declarado como global para ser acessível em modal.js e agendador
window.prova = false; // Declarado como global para ser acessível em modal.js e agendador
// Usando o proxy da Vercel que foi configurado no api/server.js
const urlG = '/api/server'; // Apontando para o proxy local na Vercel
let allTasks = []; // Variável global para armazenar tarefas para seleção
let lastUsedToken = null; // Para armazenar o token para iniciar tarefas selecionadas/todas

// Flag para parar a execução dos processos em andamento
let shouldStopExecution = false;

function travar(asd) {
  if (asd === true) {
    if (!trava) {
      trava = true;
      console.log('[CEBOLITOS_CLOUD] - [ANTI-DUB]: TRAVA ATIVADA!');
      setTimeout(() => {
        trava = false;
        console.log('[CEBOLITOS_CLOUD] - [ANTI-DUB]: TRAVA DESATIVADA!')
      }, 8000); // 8 segundos para evitar spam de requisições
    }
  } else if (typeof asd === 'boolean') {
    trava = asd;
    console.log(`[CEBOLITOS_CLOUD] - [ANTI-DUB]: TRAVA SETADA PARA ${asd.toString().toUpperCase()}`);
  }
}

function adicionarSemDuplicar(array, items) {
  const idsExistentes = new Set(array.map(t => t.id));
  for (const item of items) {
    if (!idsExistentes.has(item.id)) {
      array.push(item);
      idsExistentes.add(item.id);
    }
  }
}

// Listener para o botão de mostrar/ocultar senha
MostrarSenha.addEventListener("click", () => {
    const isVisible = Senha.type === "text";
    Senha.type = isVisible ? "password" : "text";
    // Ajustes visuais para o ícone do olho, conforme SAFE.html
    MostrarSenha.style.opacity = 0.6;
    MostrarSenha.style.transform = isVisible ? "scale(1)" : "scale(1.1)";
    setTimeout(() => {
      MostrarSenha.style.opacity = 1;
      MostrarSenha.style.transform = "scale(1)";
    }, 150);
});

// Nova função de notificação (copiada do SAFE.html)
function showNotification(title, message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    notification.innerHTML = `
        <div class="notification-header">
            <div class="notification-title">${title}</div>
        </div>
        <div class="notification-message">${message}</div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease'; // Adicionado para animação de saída
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

document.getElementById('Enviar').addEventListener('submit', async (e) => {
  e.preventDefault();

  const botaoClicado = e.submitter;

  // Definir as flags correct e prova com base no ID do botão clicado
  if (botaoClicado.id === 'Corrigir') {
    window.correct = true;
    window.prova = false;
  } else if (botaoClicado.id === 'Logar') { // Este é o "START TASKS"
    window.correct = false;
    window.prova = false;
  } else if (botaoClicado.id === 'prova') { // Este é o "SEND PAULISTA EXAM"
    window.correct = false;
    window.prova = true;
  }

  // Validação dos tempos (min/max)
  const minMinutes = parseInt(document.getElementById('tempoMin').value);
  const maxMinutes = parseInt(document.getElementById('tempoMax').value);

  if (isNaN(minMinutes) || isNaN(maxMinutes) || minMinutes < 1 || maxMinutes > 6 || minMinutes > maxMinutes) {
      showNotification('Erro', 'Intervalo de tempo inválido. Min deve ser de 1-6 minutos, Max de 1-6 minutos e Min <= Max.', 'error');
      return;
  }

  // Convert minutes to seconds for use with SAFE's logic
  const minSeconds = minMinutes * 60;
  const maxSeconds = maxMinutes * 60;

  sendRequest(minSeconds, maxSeconds); // Passa min/max segundos para sendRequest
});

// Event listener para o botão de cancelar no modal de progresso
document.getElementById('closeModal').addEventListener('click', () => {
    shouldStopExecution = true; // Define a flag para parar a execução
    clearInterval(countdownInterval); // Garante que o countdown pare imediatamente
    const progressModal = document.getElementById('progressModal');
    if (progressModal) progressModal.style.display = 'none'; // Esconde o modal
    showNotification('Processo interrompido', 'A execução foi cancelada.', 'info');
    travar(false); // Libera o "trava"
});


async function sendRequest(minSeconds, maxSeconds) {
  if (trava) {
    showNotification('Aviso', 'Um processo já está em andamento. Por favor, aguarde.', 'info');
    return;
  }
  travar(true);
  shouldStopExecution = false; // Reset flag for new execution

  const input = document.getElementById('ra');
  let raInput = input.value.trim().toUpperCase();
  raInput = raInput.replace(/SP$/i, '') + 'SP';

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    iniciarModalCarregamento(); // Inicia o modal de carregamento (do SAFE.html)
    const response = await fetch(`${urlG}?type=token`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id: raInput, password: document.getElementById('senha').value }),
    });

    if (!response.ok) {
      throw new Error(`❌ Problema no servidor: ${response.status}`);
    }
    const data = await response.json();
    showNotification('SALA-DO-FUTURO','Logado com sucesso!', 'success');
    lastUsedToken = data.auth_token; // Armazena o token para uso posterior

    // Chamada para a função que realmente busca as salas e tarefas
    fetchUserRooms(data.auth_token, data.nick, minSeconds, maxSeconds);

  } catch (error) {
    showNotification('SALA-DO-FUTURO','RA/SENHA Incorreto!', 'error');
    const progressModal = document.getElementById('progressModal');
    if (progressModal) progressModal.style.display = 'none'; // Esconde o modal em caso de erro
    travar(false); // Libera o "trava"
  }
}

async function fetchProva(token, room, name, groups, nick) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    const response = await fetch(`${urlG}?type=provaPaulista`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ token, room, groups, nick }),
    });

    if (!response.ok) {
      throw new Error(`❌ Erro HTTP Status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
    if (data && data.length > 0) {
      const config = await solicitarProva(data); // Usa o modal de seleção de prova do modal.js

      for (let a = 0; a < config.tarefasSelecionadas.length; a++) {
          const tarefaCompleta = config.tarefasSelecionadas[a];
          const tarefa = {
            answers: tarefaCompleta.answer_answers,
            task: tarefaCompleta.task,
            executed_on: tarefaCompleta.answer_executed_on,
            accessed_on: tarefaCompleta.answer_accessed_on,
            id: tarefaCompleta.answer_id,
            task_id: tarefaCompleta.answer_task_id
          };
          showNotification('PROVA-PAULISTA', '⏳ Extraindo resposta da prova...');
        try {
          const response = await fetch(`${urlG}?type=extrairProva`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ tarefa }),
          });

          if (!response.ok) {
            throw new Error(`❌ Erro HTTP Status: ${response.status}`);
          }

          const extraidoA = await response.json();
          console.log(extraidoA);
          if (extraidoA.status === 203) {
            showNotification('PROVA-PAULISTA', '⏳ PROVA EM PROCESSO AGUARDE!!!');
            return;
          }
          const respostaExtraida = extraidoA.json;
          const NotaTotal = Object.keys(respostaExtraida.answers).length;
          showNotification('PROVA-PAULISTA',`✅ RESPOSTA DA PROVA EXTRAIDA COM SUCESSO!`, 'success');
          showNotification('PROVA-PAULISTA', `⏳ Enviando Prova Paulista... Nota SELECIONADA [${config.quantidade}/${NotaTotal}]`);
          try {
            const response = await fetch(`${urlG}?type=enviarProva`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ token, respostaExtraida, quantidade: config.quantidade, ids: tarefa.id, accessed_on1: tarefa.accessed_on, executed_ona: tarefa.executed_on}),
            });
   console.log(response);
            if (!response.ok) {
              throw new Error(`❌ Erro HTTP Status: ${response.status}`);
            }

            const result = await response.json();
            console.log(result);
            showNotification('PROVA-PAULISTA', '✅ PROVA ENVIADA COM SUCESSO!', 'success');
          } catch (error) {
            showNotification('PROVA-PAULISTA', '❌ ERRO: Nao foi possivel corrigir prova, motivos [Prova expirada/Tempo maximo atingido!]', 'error');
            console.error('❌ Erro na correção:', error);
          }
        } catch (error) {
          showNotification('PROVA-PAULISTA', '❌ ERRO: Nao foi possivel corrigir prova, motivos [Prova expirada/Tempo maximo atingido!]', 'error');
          console.error('❌ Erro na correção:', error);
        }
      }
    } else {
      showNotification('TAREFA-SP', `🚫 SALA:[${name}] Nenhuma prova disponível para enviar!`, 'info');
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    showNotification('Erro na Prova', 'Ocorreu um erro ao buscar/enviar a prova.', 'error');
  } finally {
    travar(false); // Garante que a trava seja liberada
    const progressModal = document.getElementById('progressModal');
    if (progressModal) progressModal.style.display = 'none';
  }
}


async function fetchTeste(token, room, name,groups,nick) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    const response = await fetch(`${urlG}?type=teste`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ token,room,groups,nick }),
    });

    if (!response.ok) {
      throw new Error(`❌ Erro HTTP Status: ${response.status}`);
    }

    const data = await response.json();

    const atividadesValidas = data.filter(item => {
      const expireAt = new Date(item.upado);
      const currentDate = new Date();
      const diff = currentDate - expireAt;
      return diff < 24 * 60 * 60 * 1000; // Apenas tarefas válidas nas últimas 24 horas
    });
    if (atividadesValidas != null && atividadesValidas.length > 0 && data != null && data.length > 0) {
      const config = await solicitarTempoUsuario(atividadesValidas); // Usa o modal de seleção de tarefas/tempo do modal.js

      for (let a = 0; a < config.tarefasSelecionadas.length; a++) {
          const tarefa = config.tarefasSelecionadas[a];
          const dadosFiltrados = {
            accessed_on: tarefa.accessed_on,
            executed_on: tarefa.executed_on,
            answers: tarefa.answers
          };
          showNotification('TAREFA-SP','Corrigindo atividade: ' + config.tarefasSelecionadas[a].title);
          setTimeout(async ()=>{ // Adicionado async para usar await dentro do setTimeout
            try {
              await corrigirAtividade(dadosFiltrados,tarefa.task_id,tarefa.answer_id,token,tarefa.title);
              showNotification('TAREFA-SP', `✅ Atividade "${tarefa.title}" corrigida com sucesso!`, 'success');
            } catch (error) {
              showNotification('TAREFA-SP', `❌ Falha ao corrigir atividade "${tarefa.title}".`, 'error');
              console.error(`Erro ao corrigir atividade ${tarefa.title}:`, error);
            }
          },3000); // Pequeno atraso para a notificação aparecer
      }
    } else {
      showNotification('TAREFA-SP', `🚫 SALA:[${name}] Nenhuma atividade disponível para corrigir!`, 'info');
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    showNotification('Erro ao Corrigir', 'Ocorreu um erro ao buscar/corrigir atividades.', 'error');
  } finally {
    travar(false); // Garante que a trava seja liberada
    const progressModal = document.getElementById('progressModal');
    if (progressModal) progressModal.style.display = 'none';
  }
}

async function fetchUserRooms(token, nick, minSeconds, maxSeconds) { // Recebe min/maxSeconds
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    const response = await fetch(`${urlG}?type=room`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ apiKey: token }),
    });

    if (!response.ok) {
      throw new Error(`❌ Erro HTTP Status: ${response.status}`);
    }

    const data = await response.json();
    if (data.rooms && data.rooms.length > 0) {
      showNotification('TAREFA-SP', 'Procurando atividades...');
      allTasks = []; // Limpa tarefas anteriores
      const fetchPromises = data.rooms.map(room => {
        if (window.correct) { // Se a flag "correct" está ativa
          return fetchTeste(token, room.name, room.topic, room.group_categories,nick);
        } else if (window.prova) { // Se a flag "prova" está ativa
          return fetchProva(token,room.name,room.topic,room.group_categories,nick);
        } else { // Se nenhuma flag específica está ativa, é para realizar atividades normais
          return fetchTasks(token, room.name, room.topic, room.group_categories);
        }
      });
      await Promise.all(fetchPromises);

      // Depois de coletar todas as tarefas, mostra o seletor (se não for correção/prova)
      if (!window.correct && !window.prova) {
          if (allTasks.length > 0) {
              showTaskSelector(allTasks); // Exibe o modal de seleção de tarefas
              // Os valores de minSeconds e maxSeconds já foram passados aqui para serem usados no countdown
          } else {
              showNotification('Nenhuma Tarefa', 'Nenhuma atividade pendente encontrada.', 'info');
              const progressModal = document.getElementById('progressModal');
              if (progressModal) progressModal.style.display = 'none';
          }
      }
    } else {
      showNotification('Nenhuma Sala', 'Nenhuma sala encontrada.', 'info');
      const progressModal = document.getElementById('progressModal');
      if (progressModal) progressModal.style.display = 'none';
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    showNotification('Erro', 'Falha ao buscar salas do usuário.', 'error');
    const progressModal = document.getElementById('progressModal');
    if (progressModal) progressModal.style.display = 'none';
  } finally {
    travar(false); // Garante que a trava seja liberada
  }
}

async function fetchTasks(token, room, name, groups) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  try {
    const response = await fetch(`${urlG}?type=tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ token, room, groups }),
    });

    if (!response.ok) {
      throw new Error(`❌ Erro HTTP Status: ${response.status}`);
    }
    const data = await response.json();
    const tasksByTipo = {
      Pendente: [],
      Expirada: [],
      Rascunho: [],
      RascunhoE: [],
    };
    data.results.forEach(result => {
      if (result && Array.isArray(result.data) && result.data.length > 0) {
        // Lógica de filtragem e agrupamento de tarefas (mantida igual)
        const taskMap = new Map();

        for (const task of result.data) {
          const id = String(task.id);
          const taskStatus = (task.answer_status || '').toLowerCase().trim();
          const taskExpired = task.task_expired === true;

          if (!taskMap.has(id)) {
            taskMap.set(id, task);
          } else {
            const existing = taskMap.get(id);
            const existingStatus = (existing.answer_status || '').toLowerCase().trim();
            const existingExpired = existing.task_expired === true;

            if (taskStatus === 'draft' && existingStatus !== 'draft') {
              taskMap.set(id, task);
            } else if (taskStatus === 'draft' && existingStatus === 'draft') {
              if (taskExpired && !existingExpired) {
                taskMap.set(id, task);
              }
            } else if (existingStatus !== 'draft' && taskExpired && !existingExpired) {
              taskMap.set(id, task);
            }
          }
        }

        const tasks = Array.from(taskMap.values());
        const draftsNaoExpiradas = tasks.filter(t => (t.answer_status || '').toLowerCase().trim() === 'draft' && !t.task_expired);
        const draftsExpiradas = tasks.filter(t => (t.answer_status || '').toLowerCase().trim() === 'draft' && t.task_expired === true);
        const expiradasSemDraft = tasks.filter(t => (t.answer_status || '').toLowerCase().trim() !== 'draft' && t.task_expired === true);
        const naoDraftsNaoExpiradas = tasks.filter(t => (t.answer_status || '').toLowerCase().trim() !== 'draft' && !t.task_expired);

        if (tipo in tasksByTipo) {
          adicionarSemDuplicar(tasksByTipo[tipo], naoDraftsNaoExpiradas);
        } else {
          tasksByTipo.Pendente = tasksByTipo.Pendente || [];
          adicionarSemDuplicar(tasksByTipo.Pendente, naoDraftsNaoExpiradas);
        }

        tasksByTipo.Rascunho = tasksByTipo.Rascunho || [];
        adicionarSemDuplicar(tasksByTipo.Rascunho, draftsNaoExpiradas);

        tasksByTipo.RascunhoE = tasksByTipo.RascunhoE || [];
        adicionarSemDuplicar(tasksByTipo.RascunhoE, draftsExpiradas);

        tasksByTipo.Expirada = tasksByTipo.Expirada || [];
        adicionarSemDuplicar(tasksByTipo.Expirada, expiradasSemDraft);
      }
    });
    if (tasksByTipo.Pendente && tasksByTipo.Rascunho) {
      const idsNormais = new Set(tasksByTipo.Pendente.map(t => t.id));
      tasksByTipo.Rascunho = tasksByTipo.Rascunho.filter(t => !idsNormais.has(t.id));
    }
    const idIndex = {};

    for (const tipo in tasksByTipo) {
      for (const t of tasksByTipo[tipo]) {
        const id = String(t.id);
        if (!idIndex[id]) idIndex[id] = [];
        idIndex[id].push(tipo);
      }
    }

    for (const id in idIndex) {
      if (idIndex[id].length > 1) {
        console.warn(`❗ ID duplicado em múltiplos tipos: ${id} → [${idIndex[id].join(', ')}]`);
      }
    }

    // Armazena todas as tarefas em allTasks globalmente para o seletor de tarefas
    allTasks = [
      ...(tasksByTipo.Pendente || []).map(t => ({ ...t, tipo: 'Pendente', roomName: name })),
      ...(tasksByTipo.Rascunho || []).map(t => ({ ...t, tipo: 'Rascunho', roomName: name })),
      ...(tasksByTipo.Expirada || []).map(t => ({ ...t, tipo: 'Expirada', roomName: name })),
      ...(tasksByTipo.RascunhoE || []).map(t => ({ ...t, tipo: 'RascunhoE', roomName: name })),
    ];

  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
  }
}

// Adaptação da lógica de processamento de tarefas do SAFE.html
async function processAndSubmitTasks(tasksToProcess, token, minSeconds, maxSeconds) {
    if (!Array.isArray(tasksToProcess) || tasksToProcess.length === 0) {
        showNotification('TAREFA-SP', `🚫 Nenhuma atividade selecionada.`);
        const progressModal = document.getElementById('progressModal');
        if (progressModal) progressModal.style.display = 'none';
        travar(false);
        return;
    }

    // Inicia a contagem regressiva global (do SAFE.html)
    startGlobalCountdown(minSeconds, maxSeconds, token);

    let completedTasksCount = 0;
    const totalTasksCount = tasksToProcess.length;

    // Esta parte será executada APÓS a contagem regressiva terminar
    window.processAllTasksNow = async (token) => { // Tornada global para ser chamada pelo SAFE's countdown logic
        document.getElementById('modalTitle').textContent = 'Enviando Tarefas';
        updateModalStatus('Preparando respostas...');

        // Filtra tarefas de redação (não são suportadas para envio automático)
        const redacaoTasks = tasksToProcess.filter(isRedacao);
        const outrasTasks = tasksToProcess.filter(task => !isRedacao(task));
        const orderedTasks = [...outrasTasks, ...redacaoTasks]; // Processa tarefas não-redação primeiro

        let failedTasks = 0;
        const timeRemainingElement = document.getElementById('timeRemaining'); // Atualiza o progresso no modal
        timeRemainingElement.textContent = `${String(completedTasksCount + failedTasks).padStart(2, '0')}/${totalTasksCount}`;


        for (const task of orderedTasks) {
            if (shouldStopExecution) break; // Verifica se o usuário cancelou

            try {
                updateModalStatus(`Enviando: ${task.title.substring(0, 30)}...`);
                const taskDetails = await getTaskDetails(task.id, token);
                await submitTaskNow(task, taskDetails, token); // Função adaptada para enviar ao backend do proxy
                completedTasksCount++;

                const currentTaskNumber = completedTasksCount + failedTasks;
                timeRemainingElement.textContent = `${String(currentTaskNumber).padStart(2, '0')}/${totalTasksCount}`;
                const progress = Math.round((currentTaskNumber / totalTasksCount) * 100);
                document.getElementById('progressBar').style.width = `${progress}%`;

                if (orderedTasks.length > 1) await delay(500); // Pequeno atraso entre tarefas
            } catch (err) {
                failedTasks++;
                console.error(`❌ Falha ao enviar tarefa ${task.title}:`, err);
                const currentTaskNumber = completedTasksCount + failedTasks;
                timeRemainingElement.textContent = `${String(currentTaskNumber).padStart(2, '0')}/${totalTasksCount}`;
                showNotification('Erro de Envio', `Falha ao enviar: ${task.title.substring(0, 30)}`, 'error');
            }
        }

        const progressModal = document.getElementById('progressModal');
        if (progressModal) progressModal.style.display = 'none'; // Esconde o modal após a conclusão
        if (completedTasksCount > 0) {
            showNotification('Concluído!', `${completedTasksCount} tarefas enviadas!`, 'success');
        } else {
            showNotification('Erro', 'Nenhuma tarefa enviada.', 'error');
        }
        travar(false); // Libera o "trava"
    };
}


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para enviar respostas (adaptada do submitTaskNow do SAFE.html)
async function submitTaskNow(task, answersData, token) {
    if (isRedacao(task)) {
        console.warn(`Tarefa de redação "${task.title}" ignorada. Auto-redação não suportada.`);
        return; // Ignora tarefas de redação
    }

    const payload = {
        taskId: task.id, // Adicionado taskId para o proxy
        token: token,    // Adicionado token para o proxy
        tipo: task.tipo, // Adicionado tipo para o proxy
        tempo: (parseInt(document.getElementById('tempoMin').value) + parseInt(document.getElementById('tempoMax').value)) / 2, // Tempo médio em minutos
        status: 'submitted',
        accessed_on: 'room', // Ou use task.accessed_on se disponível
        executed_on: task.room, // Ou use task.executed_on se disponível
        answers: answersData,
    };

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    try {
        const url = `${urlG}?type=submit`; // Endpoint do proxy para submissão
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ao submeter tarefa ${task.id}: ${response.statusText}`);
        }
        const response_json = await response.json();
        console.log("Resposta da submissão:", response_json);
        showNotification('TAREFA-SP',`✅ Atividade "${task.title}" processada no servidor.`);

        // Se a API retornar um ID de resposta, tenta corrigir (comportamento do SAFE.html)
        if (response_json.id) {
            await fetchAndUpdateCorrectAnswers(task.id, response_json.id, token);
        }
        window.saveTaskToHistory(task.title); // Salvar no histórico de tarefas

    } catch (error) {
        console.error('Erro ao submeter tarefa:', error);
        throw new Error(`Falha ao submeter tarefa ${task.title}: ${error.message}`);
    }
}

// Funções de interação com a API EDUSP (mantidas como no SAFE.html)
async function getTaskDetails(taskId, token) {
    const url = `https://edusp-api.ip.tv/tms/task/${taskId}/apply?preview_mode=false`;
    const headers = { ...getDefaultHeaders(), 'x-api-key': token };
    const response = await makeRequest(url, 'GET', headers);
    return processTaskDetails(response);
}

function processTaskDetails(details) {
    const answersData = {};

    details.questions?.forEach(question => {
        if (question.type === 'info') return;

        const questionId = question.id;
        let answer = {};

        if (question.type === 'media') {
            answer = { status: 'error', message: 'Type=media system require url' };
        } else if (question.options && typeof question.options === 'object') {
            const options = Object.values(question.options);
            const correctIndex = Math.floor(Math.random() * options.length);

            options.forEach((_, i) => {
                answer[i] = i === correctIndex;
            });
        }

        answersData[questionId] = {
            question_id: questionId,
            question_type: question.type,
            answer
        };
    });

    return answersData;
}

async function fetchAndUpdateCorrectAnswers(taskId, answerId, token) {
    try {
        const url = `https://edusp-api.ip.tv/tms/task/${taskId}/answer/${answerId}?with_task=true&with_genre=true&with_questions=true&with_assessed_skills=true`;
        const respostasAnteriores = await makeRequest(url, 'GET', { 'x-api-key': token });
        await putAnswer(respostasAnteriores, taskId, answerId, token);
    } catch (error) {
        console.error("Erro em fetchAndUpdateCorrectAnswers:", error);
        throw new Error('Falha ao atualizar respostas');
    }
}

async function putAnswer(respostasAnteriores, taskId, answerId, token) {
    try {
        const url = `https://edusp-api.ip.tv/tms/task/${taskId}/answer/${answerId}`;
        const novasRespostasPayload = transformJson(respostasAnteriores);
        await makeRequest(url, 'PUT', { 'x-api-key': token }, novasRespostasPayload);
    } catch (error) {
        console.error("Erro em putAnswer:", error);
        throw new Error('Falha ao colocar resposta');
    }
}

function transformJson(jsonOriginal) {
    if (!jsonOriginal?.task?.questions) throw new Error("Estrutura de dados inválida");

    const novoJson = {
        accessed_on: jsonOriginal.accessed_on,
        executed_on: jsonOriginal.executed_on,
        answers: {}
    };

    for (const questionId in jsonOriginal.answers) {
        const questionData = jsonOriginal.answers[questionId];
        const taskQuestion = jsonOriginal.task.questions.find(q => q.id === parseInt(questionId));

        if (!taskQuestion) continue;

        try {
            const answerPayload = createAnswerPayload(taskQuestion);
            if (answerPayload) novoJson.answers[questionId] = answerPayload;
        } catch (error) {
            console.warn(`Não foi possível criar o payload de resposta para a pergunta ${questionId}:`, error);
            continue;
        }
    }

    return novoJson;
}

function createAnswerPayload(taskQuestion) {
    const answerPayload = {
        question_id: taskQuestion.id,
        question_type: taskQuestion.type,
        answer: null
    };

    switch (taskQuestion.type) {
        case "order-sentences":
            if (taskQuestion.options?.sentences?.length) {
                answerPayload.answer = taskQuestion.options.sentences.map(s => s.value);
            }
            break;
        case "fill-words":
            if (taskQuestion.options?.phrase?.length) {
                answerPayload.answer = taskQuestion.options.phrase
                    .map((item, index) => index % 2 !== 0 ? item.value : null)
                    .filter(Boolean);
            }
            break;
        case "text_ai":
            answerPayload.answer = { "0": removeTags(taskQuestion.comment || '') };
            break;
        case "fill-letters":
            if (taskQuestion.options?.answer !== undefined) {
                answerPayload.answer = taskQuestion.options.answer;
            }
            break;
        case "cloud":
            if (taskQuestion.options?.ids?.length) {
                answerPayload.answer = taskQuestion.options.ids;
            }
            break;
        default:
            if (taskQuestion.options && typeof taskQuestion.options === 'object') {
                answerPayload.answer = Object.fromEntries(
                    Object.entries(taskQuestion.options).map(([id, opt]) => [
                        id,
                        opt?.answer !== undefined ? opt.answer : false
                    ])
                );
            }
            break;
    }

    return answerPayload;
}

function isRedacao(task) {
    return task.tags?.some(t => t.toLowerCase().includes('redacao')) ||
        task.title.toLowerCase().includes('redação');
}

function removeTags(htmlString) {
    return htmlString.replace(/<[^>]*>?/gm, '');
}

function getDefaultHeaders() {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-realm': 'edusp',
        'x-api-platform': 'webclient',
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    };
}

async function makeRequest(url, method = 'GET', headers = {}, body = null) {
    const options = {
        method,
        headers: {
            'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            'Content-Type': 'application/json',
            ...headers
        }
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${method} ${url} => ${response.status}`);
    return response.json();
}

// Global countdown interval (precisa ser global para ser limpado de qualquer lugar)
let countdownInterval;

// Global flag to indicate if execution should stop
// let shouldStopExecution = false; // Já declarado no topo

// Funções para os botões do seletor de tarefas (copiado do SAFE.html)
document.getElementById("startSelectedTasks").onclick = async () => {
  const checkboxes = document.querySelectorAll(".task-checkbox");
  const selected = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => parseInt(cb.getAttribute("data-index")));

  if (selected.length === 0) {
    showNotification("Alerta", "Selecione pelo menos uma tarefa.", "info");
    return;
  }

  const selectedTasks = selected.map(i => allTasks[i]); // Usa as tarefas armazenadas globalmente
  document.getElementById("taskSelectorModal").style.display = "none";
  const minSeconds = parseInt(document.getElementById('tempoMin').value) * 60;
  const maxSeconds = parseInt(document.getElementById('tempoMax').value) * 60;
  processAndSubmitTasks(selectedTasks, lastUsedToken, minSeconds, maxSeconds);
};

document.getElementById("startAllTasks").onclick = () => {
  document.getElementById("taskSelectorModal").style.display = "none";
  const minSeconds = parseInt(document.getElementById('tempoMin').value) * 60;
  const maxSeconds = parseInt(document.getElementById('tempoMax').value) * 60;
  processAndSubmitTasks(allTasks, lastUsedToken, minSeconds, maxSeconds); // Processa todas as tarefas
};


// Listener para o botão de cancelar no modal de progresso
document.getElementById('closeModal').addEventListener('click', () => {
    shouldStopExecution = true; // Define a flag para parar a execução
    clearInterval(countdownInterval); // Garante que o countdown pare imediatamente
    const progressModal = document.getElementById('progressModal');
    if (progressModal) progressModal.style.display = 'none'; // Esconde o modal
    showNotification('Processo interrompido', 'A execução foi cancelada.', 'info');
    travar(false); // Libera o "trava"
});


// Funções para gerenciamento de perfis (copiadas do SAFE.html)
const profileSelect = document.getElementById("profile");
const saveProfileButton = document.getElementById("saveProfile");
const deleteProfileButton = document.getElementById("deleteProfile");
const raField = document.getElementById("ra");
const senhaField = document.getElementById("senha");

function loadProfiles() {
    const profiles = JSON.parse(localStorage.getItem("safeProfiles") || "[]");
    // Verifica se profileSelect existe antes de tentar manipulá-lo
    if (profileSelect) {
        profileSelect.innerHTML = '<option value="" disabled selected>Select a profile</option>';
        profiles.forEach((p, i) => {
            const opt = document.createElement("option");
            opt.value = i.toString();
            opt.textContent = p.name;
            profileSelect.appendChild(opt);
        });
    }
}

// Event listeners para gerenciamento de perfil
if (saveProfileButton) {
  saveProfileButton.onclick = () => {
    const name = prompt("Enter a name for this profile:");
    const ra = raField.value.trim();
    const senha = senhaField.value.trim();
    if (!name || !ra || !senha) {
      alert("Please fill in RA, password and a name.");
      return;
    }
    const profiles = JSON.parse(localStorage.getItem("safeProfiles") || "[]");
    profiles.push({ name, ra, senha });
    localStorage.setItem("safeProfiles", JSON.stringify(profiles));
    loadProfiles();
    alert("Profile saved!");
  };
}

if (deleteProfileButton) {
  deleteProfileButton.onclick = () => {
    const index = profileSelect.value;
    if (index === "") {
      alert("Select a profile to delete.");
      return;
    }
    const profiles = JSON.parse(localStorage.getItem("safeProfiles") || "[]");
    if (confirm("Are you sure you want to delete this profile?")) {
      profiles.splice(Number(index), 1);
      localStorage.setItem("safeProfiles", JSON.stringify(profiles));
      loadProfiles();
      profileSelect.selectedIndex = 0;
      raField.value = "";
      senhaField.value = "";
      alert("Profile deleted.");
    }
  };
}

if (profileSelect) {
  profileSelect.onchange = () => {
    const profiles = JSON.parse(localStorage.getItem("safeProfiles") || "[]");
    const index = parseInt(profileSelect.value, 10);
    const p = profiles[index];
    if (p) {
      raField.value = p.ra;
      senhaField.value = p.senha;
    }
  };
}

// Carregar perfis ao carregar a página
window.addEventListener("load", loadProfiles);


// Funções de agendamento automático (copiadas do SAFE.html, mas com comportamento simplificado para Cebolitos)
document.addEventListener("DOMContentLoaded", function () {
    const openSchedulerBtn = document.getElementById("openScheduler");
    const schedulerModal = document.getElementById("schedulerModal");
    const closeSchedulerBtn = schedulerModal.querySelector(".close-modal");
    const saveScheduleBtn = document.getElementById("saveSchedule");
    const clearScheduleBtn = document.getElementById("clearSchedule");
    const autoScheduleProfile = document.getElementById("autoScheduleProfile");
    const autoScheduleTime = document.getElementById("autoScheduleTime");
    const autoScheduleType = document.getElementById("autoScheduleType");
    const autoScheduleMin = document.getElementById("autoScheduleMin");
    const autoScheduleMax = document.getElementById("autoScheduleMax");
    const schedulePreview = document.getElementById("schedulePreview");

    // Adiciona opções de perfil (mesmo que não tenha a funcionalidade ADD/DEL, para o modal funcionar)
    function fillAutoProfileOptions() {
        const profiles = JSON.parse(localStorage.getItem("safeProfiles") || "[]");
        // Verifica se autoScheduleProfile existe antes de tentar manipulá-lo
        if (autoScheduleProfile) {
            autoScheduleProfile.innerHTML = "";
            if (profiles.length === 0) {
                autoScheduleProfile.innerHTML = '<option value="" disabled selected>No profiles saved (Save your RA/Password first)</option>';
            }
            profiles.forEach((p, i) => {
                const opt = document.createElement("option");
                opt.value = i.toString();
                opt.textContent = p.name;
                autoScheduleProfile.appendChild(opt);
            });
            if (profiles.length > 0) {
                autoScheduleProfile.value = profiles[0].value; // Seleciona o primeiro por padrão
            }
        }
    }

    if (openSchedulerBtn) {
        openSchedulerBtn.onclick = () => {
            schedulerModal.style.display = "flex";
            fillAutoProfileOptions(); // Preenche as opções do select de perfil
            updateSchedulePreview();
        };
    }

    if (closeSchedulerBtn) {
        closeSchedulerBtn.onclick = () => {
            schedulerModal.style.display = "none";
        };
    }

    if (saveScheduleBtn) {
        saveScheduleBtn.onclick = () => {
            const time = autoScheduleTime.value;
            const profileIndex = autoScheduleProfile.value;
            const taskType = autoScheduleType.value;
            const timeMin = autoScheduleMin.value;
            const timeMax = autoScheduleMax.value;

            if (!time || profileIndex === "" || parseInt(timeMin) > parseInt(timeMax)) {
                alert("Please fill in all fields correctly and ensure Min time <= Max time.");
                return;
            }

            const data = { time, profileIndex, taskType, timeMin, timeMax };
            localStorage.setItem("autoSchedule", JSON.stringify(data));
            alert("Scheduled successfully for " + time);
            schedulerModal.style.display = "none";
            updateSchedulePreview();
        };
    }

    if (clearScheduleBtn) {
        clearScheduleBtn.onclick = () => {
            if (confirm("Are you sure you want to delete the schedule?")) {
                localStorage.removeItem("autoSchedule");
                alert("Auto-schedule removed.");
                schedulerModal.style.display = "none";
                updateSchedulePreview();
            }
        };
    }

    function updateSchedulePreview() {
        const schedule = JSON.parse(localStorage.getItem("autoSchedule") || "null");
        if (!schedule) {
            schedulePreview.innerHTML = "No schedule saved.";
            return;
        }

        const profiles = JSON.parse(localStorage.getItem("safeProfiles") || "[]");
        const profile = profiles[parseInt(schedule.profileIndex)];
        const profileName = profile ? profile.name : "Unknown";

        schedulePreview.innerHTML = `
            <strong>Saved Schedule:</strong><br>
            Time: ${schedule.time}<br>
            Profile: ${profileName}<br>
            Type: ${schedule.taskType}<br>
            Time Range: ${schedule.timeMin} to ${schedule.timeMax} minutes
        `;
    }

    // Chama a função para atualizar a visualização do agendamento ao carregar
    updateSchedulePreview();

    // Função para verificar e executar a tarefa agendada (se necessário)
    async function checkAndRunScheduledTask() {
        const schedule = JSON.parse(localStorage.getItem("autoSchedule") || "null");
        if (!schedule) return;

        const now = new Date();
        const currentTime = now.toTimeString().slice(0,5);
        if (currentTime === schedule.time) {
            const profiles = JSON.parse(localStorage.getItem("safeProfiles") || "[]");
            const profile = profiles[parseInt(schedule.profileIndex)];
            if (profile) {
                raField.value = profile.ra; // Preenche RA do perfil agendado
                senhaField.value = profile.senha; // Preenche Senha do perfil agendado
                document.getElementById("tempoMin").value = schedule.timeMin;
                document.getElementById("tempoMax").value = schedule.timeMax;

                // Definir o tipo de tarefa a ser executada com base no agendamento
                if (schedule.taskType === 'corrected') {
                    window.correct = true; // Define a flag global de correção
                    window.prova = false;
                } else if (schedule.taskType === 'exam') {
                    window.correct = false;
                    window.prova = true; // Define a flag global de prova
                } else { // 'all' ou 'pending'
                    window.correct = false;
                    window.prova = false;
                }
                // Chama a função principal de envio, passando os tempos em segundos
                await sendRequest(parseInt(schedule.timeMin) * 60, parseInt(schedule.timeMax) * 60);
            }
        }
    }

    // Verifica a cada minuto se há uma tarefa agendada para rodar
    setInterval(checkAndRunScheduledTask, 60000);
});
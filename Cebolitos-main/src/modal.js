let tempoRestanteGlobal = 0; // Variável global para o tempo restante
let tempoInterval; // Intervalo de tempo global
let tituloInterval;
let filaDeTitulos = []; // Fila de títulos das tarefas
let tempoPorAtividade = {}; // Tempo restante por atividade
let atived = false;

// Função que substitui e adapta a lógica de solicitação de tempo/tarefas para o estilo do SAFE.html
function solicitarTempoUsuario(tasks) {
  return new Promise((resolve) => {
    // Overlay e Modal Box (estruturas idênticas ao SAFE.html)
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '10000',
      opacity: 0, transition: 'opacity 0.3s ease-in-out'
    });
    setTimeout(() => (overlay.style.opacity = 1), 10);

    const caixa = document.createElement('div');
    Object.assign(caixa.style, {
      background: 'var(--bg-secondary)', color: 'var(--text-primary)',
      padding: '30px', borderRadius: 'var(--border-radius)',
      boxShadow: 'var(--box-shadow)', textAlign: 'center',
      fontFamily: 'Poppins, sans-serif', width: '95%', maxWidth: '500px',
      maxHeight: '90vh', transform: 'scale(0.8)', transition: 'transform 0.4s ease',
      border: '1px solid #333'
    });
    setTimeout(() => (caixa.style.transform = 'scale(1)'), 100);

    const botaoFechar = document.createElement('button');
    botaoFechar.textContent = '✖';
    Object.assign(botaoFechar.style, {
      position: 'absolute', right: '15px', top: '15px',
      background: 'transparent', border: 'none', color: '#ccc',
      fontSize: '22px', cursor: 'pointer', transition: 'color 0.2s ease',
      padding: '4px', userSelect: 'none', lineHeight: '1'
    });
    botaoFechar.onmouseover = () => (botaoFechar.style.color = 'white');
    botaoFechar.onmouseout = () => (botaoFechar.style.color = '#ccc');
    botaoFechar.onclick = () => {
      document.body.removeChild(overlay);
      if (typeof correct !== 'undefined') {
        correct = false;
      }
      if (typeof prova !== 'undefined') {
        prova = false;
      }
    };

    const titulo = document.createElement('h2');
    titulo.textContent = (typeof correct !== 'undefined' && correct) ? '📝 Corrigir Atividades' : '📝 Atividades';
    Object.assign(titulo.style, { marginBottom: '18px', fontSize: '22px', color: 'var(--accent-color)' });
    caixa.appendChild(titulo);

    const atividadesContainer = document.createElement('div');
    Object.assign(atividadesContainer.style, {
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      paddingLeft: '10px', gap: '10px', marginBottom: '24px',
      maxHeight: '220px', overflowY: 'auto'
    });

    const checkboxElements = [];
    tasks.forEach((task, idx) => {
      const label = document.createElement('label');
      Object.assign(label.style, {
        display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15.5px',
        cursor: 'pointer', padding: '6px 10px', fontWeight: 'bold',
        borderRadius: '8px', backgroundColor: '#1a1a1a', transition: 'background 0.2s', width: '100%'
      });

      label.onmouseenter = () => label.style.background = 'rgba(255,255,255,0.05)';
      label.onmouseleave = () => label.style.background = '#1a1a1a';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.style.transform = 'scale(1.2)';
      checkbox.style.cursor = 'pointer';

      const span = document.createElement('span');
      const title = task.title || task.nome || `Tarefa ${idx + 1}`;
      const tipo = (typeof correct !== 'undefined' && correct)
        ? (task.tipo ? ` - ${task.tipo} - NOTA: ${task.nota}` : '')
        : (task.tipo ? ` - ${task.tipo}` : '');

      let emoji = '🔹';
      const tipoLower = (task.tipo || '').toLowerCase();
      if (['pendente'].includes(tipoLower)) {
        emoji = '🔸';
      } else if (['expirada'].includes(tipoLower)) {
        emoji = '🔺';
      }
      span.textContent = `${emoji} ${title}${tipo}`;

      label.appendChild(checkbox);
      label.appendChild(span);
      atividadesContainer.appendChild(label);
      checkboxElements.push({ checkbox, task });
    });

    caixa.appendChild(atividadesContainer);

    const tituloTempo = document.createElement('p');
    tituloTempo.textContent = '⏱️ Tempo por atividade (minutos)';
    Object.assign(tituloTempo.style, { fontWeight: 'bold', fontSize: '16px', marginBottom: '12px', color: '#dddddd' });
    if (!(typeof correct !== 'undefined' && correct)) {
      caixa.appendChild(tituloTempo);
    }

    const inputContainer = document.createElement('div');
    Object.assign(inputContainer.style, {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
    });
    caixa.appendChild(inputContainer);

    const decrementButton = document.createElement('button');
    decrementButton.textContent = '-';
    Object.assign(decrementButton.style, {
      padding: '8px 12px', fontSize: '18px', background: '#4CAF50', color: '#fff',
      border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s ease'
    });
    decrementButton.onmouseover = () => decrementButton.style.background = '#43a047';
    decrementButton.onmouseout = () => decrementButton.style.background = '#4CAF50';

    const inputTempo = document.createElement('input');
    inputTempo.value = 3; // Default value for Cebolitos
    inputTempo.min = 1;
    inputTempo.max = 6;
    Object.assign(inputTempo.style, {
      width: '80px', padding: '8px', fontSize: '16px', textAlign: 'center',
      border: '1px solid #555', borderRadius: '10px', background: '#333', color: '#fff'
    });

    const incrementButton = document.createElement('button');
    incrementButton.textContent = '+';
    Object.assign(incrementButton.style, {
      padding: '8px 12px', fontSize: '18px', background: '#4CAF50', color: '#fff',
      border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s ease'
    });
    incrementButton.onmouseover = () => incrementButton.style.background = '#43a047';
    incrementButton.onmouseout = () => incrementButton.style.background = '#4CAF50';

    incrementButton.onclick = () => {
      if (parseInt(inputTempo.value) < 6) { // Max 6 minutes
        inputTempo.value = parseInt(inputTempo.value) + 1;
      }
    };
    decrementButton.onclick = () => {
      if (parseInt(inputTempo.value) > 1) {
        inputTempo.value = parseInt(inputTempo.value) - 1;
      }
    };

    if (!(typeof correct !== 'undefined' && correct)) {
      inputContainer.appendChild(decrementButton);
      inputContainer.appendChild(inputTempo);
      inputContainer.appendChild(incrementButton);
    } else {
      const msg = document.createElement('p');
      Object.assign(msg.style, { marginBottom: '18px', fontSize: '12px', color: '#f2f2f2' });
      msg.textContent = 'Selecione as atividades que você ja finalizou e que errou alguma pergunta, ai é so confirmar que o script vai estar corrigindo seu erro!';
      caixa.appendChild(msg);
      const msg2 = document.createElement('p');
      Object.assign(msg2.style, {
        marginBottom: '18px', fontSize: '13px', color: '#f1c40f', fontWeight: 'bold',
        backgroundColor: '#2c2c2c', padding: '10px', borderRadius: '5px',
        display: 'flex', alignItems: 'center', gap: '8px'
      });
      msg2.textContent = '⚠️ OBS: ele só corrige até 24 horas, depois disso ele não arruma mais! Se você tiver alguma tarefa com a NOTA [NaN], ele corrige também!';
      caixa.appendChild(msg2);
    }

    const erro = document.createElement('p');
    Object.assign(erro.style, { color: 'tomato', fontSize: '14px', margin: '6px 0', display: 'none' });
    caixa.appendChild(erro);

    const botao = document.createElement('button');
    botao.textContent = '✅ Confirmar';
    Object.assign(botao.style, {
      marginTop: '15px', padding: '12px 28px', background: '#4CAF50',
      border: 'none', borderRadius: '12px', color: 'white', fontSize: '16px',
      cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'all 0.2s ease-in-out'
    });
    botao.onmouseover = () => botao.style.background = '#43a047';
    botao.onmousedown = () => botao.style.transform = 'scale(0.96)';
    botao.onmouseup = () => botao.style.transform = 'scale(1)';
    botao.onmouseout = () => {
      botao.style.background = '#4CAF50';
      botao.style.transform = 'scale(1)';
    };

    botao.onclick = () => {
      const valor = parseInt(inputTempo.value);
      if (isNaN(valor) || valor < 1 || valor > 6) {
        erro.textContent = 'Digite um número válido de 1 a 6.';
        erro.style.display = 'block';
        return;
      }

      const tarefasSelecionadas = checkboxElements
        .filter(({ checkbox }) => checkbox.checked)
        .map(({ task }) => task);

      if (tarefasSelecionadas.length === 0) {
        erro.textContent = 'Selecione pelo menos uma tarefa.';
        erro.style.display = 'block';
        return;
      }

      document.body.removeChild(overlay);
      resolve({ tempo: valor, tarefasSelecionadas });
    };

    caixa.appendChild(botao);
    caixa.appendChild(botaoFechar);
    overlay.appendChild(caixa);
    document.body.appendChild(overlay);
  });
}

// Função para solicitar prova (adaptada para o estilo do SAFE.html)
function solicitarProva(tasks) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '10000',
      opacity: 0, transition: 'opacity 0.3s ease-in-out'
    });
    setTimeout(() => (overlay.style.opacity = 1), 10);

    const caixa = document.createElement('div');
    Object.assign(caixa.style, {
      background: 'var(--bg-secondary)', color: 'var(--text-primary)',
      padding: '30px', borderRadius: 'var(--border-radius)',
      boxShadow: 'var(--box-shadow)', textAlign: 'center',
      fontFamily: 'Poppins, sans-serif', width: '95%', maxWidth: '500px',
      maxHeight: '90vh', transform: 'scale(0.8)', transition: 'transform 0.4s ease',
      border: '1px solid #333'
    });
    setTimeout(() => (caixa.style.transform = 'scale(1)'), 100);

    const botaoFechar = document.createElement('button');
    botaoFechar.textContent = '✖';
    Object.assign(botaoFechar.style, {
      position: 'absolute', right: '15px', top: '15px',
      background: 'transparent', border: 'none', color: '#ccc',
      fontSize: '22px', cursor: 'pointer', transition: 'color 0.2s ease',
      padding: '4px', userSelect: 'none', lineHeight: '1'
    });
    botaoFechar.onmouseover = () => (botaoFechar.style.color = 'white');
    botaoFechar.onmouseout = () => (botaoFechar.style.color = '#ccc');
    botaoFechar.onclick = () => {
      document.body.removeChild(overlay);
      if (typeof correct !== 'undefined') {
        correct = false;
      }
      if (typeof prova !== 'undefined') {
        prova = false;
      }
    };

    const titulo = document.createElement('h2');
    titulo.textContent = '📝 Enviar Prova';
    Object.assign(titulo.style, { marginBottom: '18px', fontSize: '22px', color: 'var(--accent-color)' });
    caixa.appendChild(titulo);

    const atividadesContainer = document.createElement('div');
    Object.assign(atividadesContainer.style, {
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      paddingLeft: '10px', gap: '10px', marginBottom: '24px',
      maxHeight: '220px', overflowY: 'auto'
    });

    const checkboxElements = [];
    tasks.forEach((task) => {
      const label = document.createElement('label');
      Object.assign(label.style, {
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px',
        fontSize: '15.5px', cursor: 'pointer', padding: '10px 12px', fontWeight: 'bold',
        borderRadius: '8px', backgroundColor: '#1a1a1a', transition: 'background 0.2s', width: '100%'
      });

      label.onmouseenter = () => label.style.background = 'rgba(255,255,255,0.05)';
      label.onmouseleave = () => label.style.background = '#1a1a1a';

      const topRow = document.createElement('div');
      topRow.style.display = 'flex';
      topRow.style.alignItems = 'center';
      topRow.style.gap = '10px';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.style.transform = 'scale(1.2)';
      checkbox.style.cursor = 'pointer';

      const totalQuestoes = Object.keys(task.answer_answers).length;
      const nota = task.result_score;
      const restante = totalQuestoes - nota;

      const span = document.createElement('span');
      const title = task.title || `Tarefa`;
      let emoji = '🔹';
      span.textContent = `${emoji} ${title}`;

      topRow.appendChild(checkbox);
      topRow.appendChild(span);
      label.appendChild(topRow);

      const inputContainer = document.createElement('div');
      inputContainer.style.display = 'none';
      inputContainer.style.flexDirection = 'column';
      inputContainer.style.gap = '6px';
      inputContainer.style.marginTop = '6px';

      const labelInput = document.createElement('label');
      labelInput.textContent = `Selecione Quantidade: MAXIMO [${totalQuestoes}]`;
      labelInput.style.fontSize = '13px';
      labelInput.style.color = '#ccc';

      const input = document.createElement('input');
      input.type = 'number';
      input.min = 1;
      input.max = restante;
      input.value = 1;
      Object.assign(input.style, {
        width: '100%', padding: '6px 10px', border: '1px solid #444',
        borderRadius: '6px', backgroundColor: '#2a2a2a', color: '#fff'
      });

      inputContainer.appendChild(labelInput);
      inputContainer.appendChild(input);
      label.appendChild(inputContainer);

      atividadesContainer.appendChild(label);

      checkbox.addEventListener('change', () => {
        checkboxElements.forEach(({ checkbox: cb, inputContainer: ic, input: inp }) => {
          if (cb !== checkbox) {
            cb.checked = false;
            ic.style.display = 'none';
          }
        });

        if (checkbox.checked) {
          if (restante === 0) {
            input.disabled = true;
            input.value = 'Máximo';
            input.style.textAlign = 'center';
            input.style.color = '#aaa';
            input.style.cursor = 'not-allowed';
            botao.disabled = true;
            botao.style.opacity = '0.6';
            botao.style.cursor = 'not-allowed';
          } else {
            input.disabled = false;
            input.value = 1;
            input.style.textAlign = 'left';
            input.style.color = '#fff';
            input.style.cursor = 'text';
            botao.disabled = false;
            botao.style.opacity = '1';
            botao.style.cursor = 'pointer';
          }
          inputContainer.style.display = 'flex';
        } else {
          inputContainer.style.display = 'none';
          botao.disabled = false;
          botao.style.opacity = '1';
          botao.style.cursor = 'pointer';
        }
      });

      checkboxElements.push({ checkbox, task, input, inputContainer });
    });

    caixa.appendChild(atividadesContainer);

    const msg = document.createElement('p');
    Object.assign(msg.style, { marginBottom: '18px', fontSize: '12px', color: '#f2f2f2' });
    msg.textContent = 'Selecione a prova para enviar, tenha certeza que a prova está em rascunho pelo menos todas as questões respondidas, e que a prova não esteja enviada!, e que o tempo minimo ja esteja atingido!';
    caixa.appendChild(msg);
    const msg2 = document.createElement('p');
    Object.assign(msg2.style, {
      marginBottom: '18px', fontSize: '13px', color: '#f1c40f', fontWeight: 'bold',
      backgroundColor: '#2c2c2c', padding: '10px', borderRadius: '5px',
      display: 'flex', alignItems: 'center', gap: '8px'
    });
    msg2.textContent = '⚠️ OBS: ELE SO CORRIGE A PROVA QUE VOCÊ FEZ NO DIA!!! SE PASSAR DO DIA ELE NAO ARRUMA MAIS!';
    caixa.appendChild(msg2);

    const erro = document.createElement('p');
    Object.assign(erro.style, { color: 'tomato', fontSize: '14px', margin: '6px 0', display: 'none' });
    caixa.appendChild(erro);

    const botao = document.createElement('button');
    botao.textContent = '✅ Confirmar';
    Object.assign(botao.style, {
      marginTop: '15px', padding: '12px 28px', background: '#4CAF50',
      border: 'none', borderRadius: '12px', color: 'white', fontSize: '16px',
      cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'all 0.2s ease-in-out'
    });
    botao.onmouseover = () => botao.style.background = '#43a047';
    botao.onmousedown = () => botao.style.transform = 'scale(0.96)';
    botao.onmouseup = () => botao.style.transform = 'scale(1)';
    botao.onmouseout = () => {
      botao.style.background = '#4CAF50';
      botao.style.transform = 'scale(1)';
    };

    botao.onclick = () => {
      const tarefasSelecionadas = checkboxElements
        .filter(({ checkbox }) => checkbox.checked)
        .map(({ task }) => task);

      if (tarefasSelecionadas.length === 0) {
        erro.textContent = 'Selecione pelo menos uma tarefa.';
        erro.style.display = 'block';
        return;
      }
      const selecionado = checkboxElements.find(({ checkbox }) => checkbox.checked);
      const quantidadeSelecionada = selecionado
        ? (selecionado.input.disabled ? 'Máximo' : parseInt(selecionado.input.value, 10))
        : 0;

      document.body.removeChild(overlay);
      resolve({ quantidade: quantidadeSelecionada, tarefasSelecionadas });
    };

    caixa.appendChild(botao);
    caixa.appendChild(botaoFechar);
    overlay.appendChild(caixa);
    document.body.appendChild(overlay);
  });
}


// Funções de controle de modais e exibição de progresso (Copiado e adaptado do SAFE.html)
function iniciarModalCarregamento() {
    const progressModal = document.getElementById('progressModal');
    document.getElementById('modalTitle').textContent = 'Buscando Tarefas Disponíveis';
    document.getElementById('currentStatus').textContent = 'Iniciando conexão com a plataforma...';
    document.getElementById('totalTasksFound').textContent = '0';
    document.getElementById('progressBar').style.width = '0%';
    const timeRow = document.getElementById('timeRow');
    if (timeRow) timeRow.style.display = 'none';
    const foundTasksRow = document.getElementById('foundTasksRow');
    if (foundTasksRow) foundTasksRow.style.display = '';
    progressModal.style.display = 'flex';
}

function iniciarModalExecucao(minSeconds, maxSeconds, duration) {
    const progressModal = document.getElementById('progressModal');
    document.getElementById('modalTitle').textContent = 'Contabilizando Tempo';
    updateModalStatus(`Aguardando: entre ${getTimeLabel(minSeconds)} e ${getTimeLabel(maxSeconds)} (${getTimeLabel(duration)})`);
    const timeRow = document.getElementById('timeRow');
    if (timeRow) timeRow.style.display = '';
    const foundTasksRow = document.getElementById('foundTasksRow');
    if (foundTasksRow) foundTasksRow.style.display = 'none';
    progressModal.style.display = 'flex';
}

function updateModalStatus(status) {
    document.getElementById('currentStatus').textContent = status;
}

function updateTimeDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('timeRemaining').textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function getTimeLabel(seconds) {
    const sec = parseInt(seconds);
    if (sec < 60) return `${sec} segundos`;
    if (sec === 60) return '1 minuto';
    return `${Math.floor(sec / 60)} minutos`;
}

// Função para exibir o modal de seleção de tarefas (Copiado e adaptado do SAFE.html)
function showTaskSelector(tasks) {
  const modal = document.getElementById("taskSelectorModal");
  const list = document.getElementById("taskSelectorList");
  list.innerHTML = "";

  tasks.forEach((task, index) => {
    const item = document.createElement("div");
    item.innerHTML = `
      <label>
        <input type="checkbox" class="task-checkbox" data-index="${index}" />
        <span class="task-label">${task.title} (${task.roomName || 'N/A'})</span>
      </label>
    `;
    list.appendChild(item);
  });

  modal.style.display = "flex";
}

// Funções para gerenciamento de perfis (copiadas do SAFE.html e adaptadas para Cebolitos)
const profileSelect = document.getElementById("profile"); // Certifique-se de que este elemento existe no index.html
const saveProfileButton = document.getElementById("saveProfile"); // Certifique-se de que este elemento existe no index.html
const deleteProfileButton = document.getElementById("deleteProfile"); // Certifique-se de que este elemento existe no index.html
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
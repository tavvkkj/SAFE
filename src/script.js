document.addEventListener("DOMContentLoaded", () => {
    // --- Elementos do HTML ---
    const profileSelect = document.getElementById("profile");
    const saveButton = document.getElementById("saveProfile");
    const raField = document.getElementById("ra");
    const senhaField = document.getElementById("senha");
    const deleteButton = document.getElementById("deleteProfile");
    const enviarForm = document.getElementById('Enviar');
    const MostrarSenha = document.getElementById("VerSenha");
    const Senha = document.getElementById("senha");
    const imagem = document.getElementById("OlhoVer");

    // --- Estado Global e Configuração ---
    let trava = false;
    let correct = false;
    let prova = false;
    const urlG = 'https://api.moonscripts.cloud/';

    // --- Gerenciamento de Perfil ---
    function loadProfiles() {
        const profiles = JSON.parse(localStorage.getItem("cebolitosProfiles") || "[]");
        profileSelect.innerHTML = '<option value="" disabled selected>Select a profile</option>';
        profiles.forEach((p, i) => {
            const opt = document.createElement("option");
            opt.value = i.toString();
            opt.textContent = p.name;
            profileSelect.appendChild(opt);
        });
        if (profileSelect.selectedIndex <= 0) {
            raField.value = "";
            senhaField.value = "";
        }
    }

    if (saveButton) {
        saveButton.onclick = () => {
            const name = prompt("Enter a name for this profile:");
            if (!name) return;
            const ra = raField.value.trim();
            const senha = senhaField.value.trim();
            if (!ra || !senha) {
                alert("Please fill in the RA and Password fields before saving a profile.");
                return;
            }
            const profiles = JSON.parse(localStorage.getItem("cebolitosProfiles") || "[]");
            profiles.push({ name, ra, senha });
            localStorage.setItem("cebolitosProfiles", JSON.stringify(profiles));
            loadProfiles();
            profileSelect.value = (profiles.length - 1).toString();
            alert("Profile saved!");
        };
    }

    if (profileSelect) {
        profileSelect.onchange = () => {
            const profiles = JSON.parse(localStorage.getItem("cebolitosProfiles") || "[]");
            const index = parseInt(profileSelect.value, 10);
            if (!isNaN(index) && profiles[index]) {
                const p = profiles[index];
                raField.value = p.ra;
                senhaField.value = p.senha;
            }
        };
    }
    
    if (deleteButton) {
        deleteButton.onclick = () => {
            const index = profileSelect.value;
            if (index === "" || profileSelect.options[profileSelect.selectedIndex].disabled) {
                alert("Select a profile to delete.");
                return;
            }
            const profiles = JSON.parse(localStorage.getItem("cebolitosProfiles") || "[]");
            if (confirm(`Are you sure you want to delete the profile: "${profileSelect.options[profileSelect.selectedIndex].textContent}"?`)) {
                profiles.splice(Number(index), 1);
                localStorage.setItem("cebolitosProfiles", JSON.stringify(profiles));
                loadProfiles();
                alert("Profile deleted.");
            }
        };
    }
    
    loadProfiles();

    // --- Lógica de API do Cebolitos Original ---
    
    function travar(asd) {
      if (asd === true) {
        if (!trava) {
          trava = true;
          setTimeout(() => { trava = false; }, 8000);
        }
      } else if (typeof asd === 'boolean') {
        trava = asd;
      }
    }

    if (MostrarSenha && imagem) {
        MostrarSenha.addEventListener("click", () => {
            if (Senha.type === "password") {
                Senha.type = "text";
                imagem.src = "visivel.png";
            } else {
                Senha.type = "password";
                imagem.src = "olho.png";
            }
        });
    }

    // --- Sistema de Notificação do S.A.F.E. ---
    function showNotification(title, message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`; // Tipos: info, success, error
        notification.innerHTML = `
            <div class="notification-header"><div class="notification-title">${title}</div></div>
            <div class="notification-message">${message}</div>`;
        document.body.appendChild(notification);
        notification.style.animation = 'slideInRight 0.3s ease-out forwards';
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            notification.addEventListener('animationend', () => notification.remove());
        }, duration);
    }
    
    if(enviarForm) {
        enviarForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const botaoClicado = e.submitter;
            correct = (botaoClicado.id === 'Corrigir');
            prova = (botaoClicado.id === 'prova');
            sendRequest();
        });
    }

    function sendRequest() {
      if (trava) return;
      travar(true);
      let raInput = raField.value.trim().toUpperCase().replace(/SP$/i, '') + 'SP';
      const requestUrl = `${urlG}?type=token`;
      const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
      fetch(requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: raInput, password: senhaField.value }),
      })
      .then(response => {
        if (!response.ok) {
          showNotification('SALA-DO-FUTURO', 'RA/SENHA Incorreto!', 'error');
          throw new Error(`Problema no servidor: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        showNotification('SALA-DO-FUTURO', 'Logado com sucesso!', 'success');
        fetchUserRooms(data.auth_token, data.nick);
      })
      .catch(error => {
        console.error(error);
        travar(false);
      });
    }

    async function fetchUserRooms(token, nick) {
      try {
        const response = await fetch(`${urlG}?type=room`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ apiKey: token }),
        });
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        const data = await response.json();
        if (data.rooms && data.rooms.length > 0) {
          showNotification('TAREFA-SP', 'Procurando atividades...', 'info');
          const fetchPromises = data.rooms.map(room => {
            if (correct) {
              return fetchTeste(token, room.name, room.topic, room.group_categories, nick);
            } else if (prova) {
              return fetchProva(token, room.name, room.topic, room.group_categories, nick);
            } else {
              return fetchTasks(token, room.name, room.topic, room.group_categories);
            }
          });
          await Promise.all(fetchPromises);
        } else {
          showNotification('TAREFA-SP', 'Nenhuma sala encontrada.', 'info');
          travar(false);
        }
      } catch (error) {
        showNotification('Erro de Rede', 'Não foi possível buscar as salas.', 'error');
        console.error('Erro ao buscar salas:', error);
        travar(false);
      }
    }

    // As funções abaixo usam a lógica do script original mas com as notificações do S.A.F.E.
    async function fetchTasks(token, room, name, groups) {
      showNotification('Sistema', 'O modo "START TASKS" está em manutenção.', 'info', 6000);
      travar(false);
      return;
    }

    async function fetchTeste(token, room, name, groups, nick) {
      try {
        const response = await fetch(`${urlG}?type=teste`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ token, room, groups, nick }),
        });
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        const data = await response.json();
        const atividadesValidas = data.filter(item => (new Date() - new Date(item.upado)) < 24 * 60 * 60 * 1000);

        if (atividadesValidas.length > 0) {
          const config = await solicitarTempoUsuario(atividadesValidas); // `solicitarTempoUsuario` vem de modal.js
          for (const tarefa of config.tarefasSelecionadas) {
            showNotification('TAREFA-SP', 'Corrigindo atividade: ' + tarefa.title, 'info');
            // ...lógica de correção...
          }
        } else {
          showNotification('TAREFA-SP', `SALA:[${name}] Nenhuma atividade recente para corrigir!`, 'info');
        }
      } catch (error) {
        showNotification('Erro de Rede', 'Falha ao buscar tarefas para corrigir.', 'error');
        console.error('Erro ao buscar testes:', error);
      }
    }

    async function fetchProva(token, room, name, groups, nick) {
        showNotification('PROVA-PAULISTA', 'Sistema de provas desativado temporariamente.', 'info', 6000);
        travar(false);
        return;
    }
});

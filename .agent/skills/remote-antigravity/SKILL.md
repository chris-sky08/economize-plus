---
name: remote-antigravity
description: Guia e configuracao do Remote Antigravity para conversar por voz ou texto com o agente diretamente pelo celular (via Painel Oficial Web/PWA do Google Antigravity ou via Ponte Telegram).
---

# Remote Antigravity — Controle e Conversa pelo Celular (`Mobile Remote Control`)

Use esta skill sempre que o usuário pedir ajuda para configurar, ativar ou usar o **Antigravity pelo celular** (voz ou texto).

## Método 1: Remote Control Oficial do Google Antigravity (Recomendado — Suporta Voz e Tela Ao Vivo)

O Google Antigravity possui **Remote Control nativo** que espelha sua sessão do computador no navegador do celular (Android ou iPhone) com suporte a conversa por voz, aprovação de tarefas e visualização de artefatos.

### Passo 1 — Ativar no Computador (Windows)
1. No aplicativo **Antigravity** aberto no seu PC, pressione **`Ctrl + ,`** (ou clique no ícone de engrenagem **Settings** no canto inferior esquerdo).
2. No menu lateral das configurações, clique em **Application**.
3. Ative a chave **Enable Remote Control** (`On`).
4. *(Opcional)* Em **Device Name**, dê um nome fácil para o seu PC, por exemplo: `PC-Economize`.
   - *Alternativa via terminal CLI:* Se estiver usando o terminal, basta digitar `/remote-control` dentro da sessão ou iniciar com `agy --remote-control`.

### Passo 2 — Conectar pelo Celular (Android ou iPhone)
1. Pegue o seu celular, abra o navegador (**Chrome** no Android ou **Safari** no iPhone) e acesse:
   - **`https://antigravity.google`** (ou o link do **Remote Control Dashboard** exibido nas configurações do seu app).
2. Faça login com **exatamente a mesma Conta Google** que você usa no Antigravity do computador.
3. Selecione a sua máquina (`PC-Economize`) na lista de dispositivos conectados.
4. **Dica de Ouro (Instalar como App no Celular — PWA):**
   - No menu do navegador do celular, toque em **"Adicionar à tela inicial"** (*Add to Home Screen*).
   - Isso cria o ícone do Antigravity direto na tela do seu celular com notificações push quando uma tarefa terminar!

### Passo 3 — Como Conversar por Voz no Celular
1. Abra a conversa do **Economize+** no celular.
2. Toque no ícone de **Microfone / Live Voice** na barra de mensagem.
3. Fale normalmente em português (ex.: *"Antigravity, cria um post novo pro Instagram do Economize e sobe pra Vercel"*). O agente de voz conversa com você em tempo real e envia as tarefas pesadas de código direto para o seu PC executar!

> **Importante:** Para o Remote Control funcionar, o seu PC precisa estar ligado, conectado à internet e com o Antigravity aberto (evite que o Windows entre em suspensão/hibernação quando sair de casa).

---

## Método 2: Controle via Bot do Telegram (Alternativa Open-Source)

Caso queira mandar mensagens ou áudios de dentro do **Telegram**:
1. No Telegram, abra o `@BotFather`, envie `/newbot` e copie o `TELEGRAM_BOT_TOKEN`.
2. Descubra seu ID numérico no `@userinfobot` (`TELEGRAM_ALLOWED_USER_ID`).
3. Use uma ponte MCP/CLI compatível (como `Telegravity` ou `antigravity-telegram-suite`) conectada ao workspace local para receber notificações e enviar comandos pelo chat do Telegram.

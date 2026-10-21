# Deploy manual do Piccola

Depois de enviar as alterações para `main`, entre no Droplet como `yuriven` e execute:

```bash
piccola-deploy
```

O comando faz `git pull --ff-only`, identifica mudanças em `frontend/` e `backend/`, executa os builds necessários como usuário normal e só então publica uma nova versão. Não instala agendamento, webhook ou GitHub Actions. O repositório público é clonado por HTTPS, sem chave ou token do GitHub.

## Instalação inicial

No computador, coloque estes arquivos na raiz do repositório e envie-os para `main`:

```powershell
git add .gitattributes ops
git commit -m "chore: add manual server deployment"
git push origin main
```

No servidor (onde o backend, Nginx e PostgreSQL já estão configurados):

```bash
mkdir -p ~/apps
git clone --branch main https://github.com/YSVenturin/piccola-arte-atelier.git ~/apps/piccola-arte-atelier
cd ~/apps/piccola-arte-atelier
sudo bash ops/install-deploy.sh
piccola-deploy
```

O instalador precisa de acesso à internet e instala o JDK 21 e Node 24 LTS. O Node é obtido da distribuição oficial com validação SHA-256. O Maven Wrapper já versionado no backend baixa a distribuição Maven configurada pelo projeto. Não é necessário instalar `mvn` separadamente.

Se `~/apps/piccola-arte-atelier` já existir, use esse clone, confirme que pertence a `yuriven`, está em `main`, sem alterações locais e atualizado, e execute as duas últimas linhas.

## Comportamento

- Frontend: `npm ci --include=dev` e `npm run build`, com `VITE_API_BASE_URL=https://piccolaarteatelier.com.br/api/` definido no processo do build. Não depende do `.env.production` de cada PC.
- Backend: `bash ./mvnw -B -ntp -DskipTests clean package`, usando JDK 21. Os testes não são executados no servidor de produção, nem recebem as credenciais de produção. Execute os testes no ambiente de desenvolvimento antes de enviar alterações; este deploy não é uma pipeline de testes.
- Os builds são sequenciais; heap do Node limitado a 384 MiB e do Maven a 256 MiB. Esses valores não limitam a memória total dos processos. O swap de 2 GiB já configurado ajuda nos picos. O primeiro build pode levar mais tempo para baixar dependências.
- Uma falha no build encerra o comando sem mudar a versão publicada.
- Antes de trocar o backend, `pg_dump` cria uma cópia local, privada, do banco `piccola_arte` em `/var/backups/piccola/deploy/`. Uma falha nesse dump interrompe a publicação. Isso ainda não substitui o backup externo no Google Drive.
- A primeira publicação preserva os arquivos já existentes em uma versão inicial. Converte `/var/www/piccola` e `/opt/piccola/backend/app.jar` em links para uma versão em `/opt/piccola/releases/`. Nginx e a unidade systemd continuam usando os mesmos caminhos.
- `/etc/piccola/backend.env`, PostgreSQL e `/var/lib/piccola/uploads/products` ficam fora das versões de código. O deploy não substitui esses arquivos ou as imagens cadastradas.
- O backend só reinicia quando o JAR muda. Essa reinicialização pode causar uma breve indisponibilidade da API e encerrar sessões de login administrativo.
- Após publicar, a rotina verifica se a API local responde HTTP 200 e se o serviço está ativo. Se falhar, tenta restaurar os links e o código anterior, reiniciar quando necessário e verificar novamente.
- O retorno de código não desfaz alterações no esquema ou nos dados realizadas pela nova aplicação. Se uma migração incompatível tiver sido aplicada, pode ser necessária restauração manual do banco; o script não sobrescreve o banco automaticamente.
- Mantém as cinco versões recentes de código, preservando também a ativa e a anterior, e os cinco dumps completos mais recentes. A primeira cópia do frontend anterior também fica em `/var/www/piccola.before-deploy-*`.
- Alterações locais no clone e histórico Git que não permita fast-forward fazem o comando parar; nenhum `git reset --hard` é executado.

## Comandos adicionais

```bash
# Reconstruir e publicar mesmo que o commit não tenha mudado:
piccola-deploy --force

# Voltar o código para a versão anterior, sem git pull nem novo build:
piccola-deploy --rollback

# Consultar logs do backend:
sudo journalctl -u piccola-backend -n 80 --no-pager
```

Se você alterar os scripts em `ops/`, a rotina pedirá que reinstale as cópias protegidas antes de continuar:

```bash
cd ~/apps/piccola-arte-atelier
sudo bash ops/install-deploy.sh
piccola-deploy
```

As URLs e o caminho do clone ficam no arquivo sem segredos `/etc/piccola-deploy.conf`, instalado como root:root 644. Não coloque senhas nesse arquivo. As credenciais do backend continuam exclusivamente em `/etc/piccola/backend.env`.

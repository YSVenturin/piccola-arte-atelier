# Backups do Piccola Arte Atelier

Backup diário criptografado do PostgreSQL `piccola_arte`, das imagens em
`/var/lib/piccola/uploads/products` e das configurações do backend/Nginx.
Destino: `piccola_drive:Piccola-Backups/restic`. Não contém credenciais neste pacote.

## Instalação

Extraia o pacote na raiz do repositório, preservando os arquivos existentes.
Versione os scripts no GitHub e atualize o checkout do servidor:

```powershell
git add ops/install-backup.sh ops/backup ops/tests/test_backup.py
git commit -m "feat: add encrypted daily backups to Google Drive"
git push origin main
```

No servidor:

```bash
cd ~/apps/piccola-arte-atelier
git pull --ff-only origin main
sudo bash ops/install-backup.sh
```

O instalador pedirá duas vezes uma senha de criptografia exclusiva de pelo menos
20 caracteres, sem exibi-la. Gere e guarde essa senha no seu gerenciador de senhas,
fora do Droplet, antes de digitá-la. Ela não é a senha do Google nem a do SSH.
Se o servidor for perdido, somente o arquivo no servidor não será suficiente.
Restic não permite recuperar dados sem a senha. Não a coloque no Git, no chat ou
no histórico de comandos.

O instalador usa o rclone já autorizado em `/etc/piccola-backup/rclone.conf` e
preserva a senha existente se for executado novamente. Instala comandos e unidades,
mas não inicializa o repositório nem ativa o timer.

Na primeira instalação, execute separadamente, conferindo o resultado de cada um:

```bash
sudo piccola-restic init
sudo systemctl start piccola-backup.service
sudo journalctl -u piccola-backup.service -n 80 --no-pager
sudo piccola-backup --verify
sudo systemctl enable --now piccola-backup.timer
systemctl list-timers piccola-backup.timer --all
```

Se `init` disser que o repositório já existe, não exclua nada: teste o acesso com
`sudo piccola-restic snapshots`. Uma senha incorreta deve ser corrigida, sem
substituir os arquivos no Drive. Ative o timer somente após o primeiro backup e
o teste de restauração terminarem com sucesso.

## Funcionamento

- Todos os dias às **03:00, America/Sao_Paulo**. `Persistent=true` executa uma
  tarefa perdida quando o servidor voltar. O deploy continua exclusivamente manual.
- Mantém snapshots de **7 dias, 4 semanas e 3 meses**, combinados pelo Restic.
  Isso não significa 14 cópias completas: os blocos repetidos são reutilizados.
- Faz uma pré-cópia das imagens; aguarda o mesmo lock utilizado pelo deploy;
  pausa o backend, alinha as imagens e exporta o banco; inicia e testa a API;
  libera o lock do deploy; só então envia os dados criptografados ao Drive.
- A pausa também encerra sessões administrativas em memória. O Nginx continua
  servindo o frontend; chamadas à API podem falhar durante essa pausa.
- Se o dump ou a cópia falhar, tenta iniciar o backend e não executa a retenção.
  Um marcador permite nova tentativa de recuperação pelo `ExecStopPost` do serviço.
  Se houver falha no próprio backend, ela fica no log e requer correção.
- A consistência pressupõe que o backend é o único processo que altera os dados
  do catálogo. Não há dump com senha de banco na linha de comando: usa o usuário
  local `postgres` via autenticação local.
- A limpeza aplica-se aos snapshots desse conjunto. Blocos expirados são
  excluídos definitivamente da pasta do repositório, para não acumular na lixeira
  do Drive. Não altere manualmente os arquivos internos da pasta `restic`.
- Depois da retenção, `restic check` verifica a estrutura. Ele não equivale a
  baixar todos os dados; o teste `--verify` faz a restauração efetiva.

Os dados ficam em um estágio local privado (`/var/lib/piccola-backup/staging`),
reutilizado a cada execução, além do cache `/var/cache/piccola-backup`. É necessário
espaço local para uma cópia das imagens e um dump. O teste de restauração precisa
de espaço adicional para baixar os arquivos e criar um banco temporário.
O Google Drive compartilha a cota da conta com Gmail/Google Fotos; acompanhe o uso.
Estes backups não impedem exclusão maliciosa por quem tiver acesso administrativo
ao servidor ou à conta do Drive.

Configurações e credenciais no servidor são restritas ao root. A cópia de
`backend.env` contém a senha do banco e é enviada criptografada. A senha de
criptografia e o token do rclone não são incluídos no snapshot: mantenha a senha
fora do servidor. Em um servidor novo, pode ser necessário autorizar novamente o
rclone com o mesmo cliente OAuth e a mesma conta Google. Preserve também o acesso
à conta e ao projeto Google Cloud, especialmente porque usamos `drive.file`.

## Uso e acompanhamento

```bash
# Backup manual com logs no systemd
sudo systemctl start piccola-backup.service
sudo journalctl -u piccola-backup.service -n 80 --no-pager

# Histórico remoto e uso lógico dos snapshots
sudo piccola-restic snapshots
sudo piccola-restic stats --mode raw-data

# Horário da próxima execução e resultado da última
systemctl list-timers piccola-backup.timer --all
systemctl show piccola-backup.service -p Result -p ExecMainStatus
sudo cat /var/lib/piccola-backup/last-success

# Teste mensal e após mudanças importantes
sudo piccola-backup --verify
sudo cat /var/lib/piccola-backup/last-verified

# Recuperar backend caso tenha ficado com marcador de pausa
sudo piccola-backup --recover

# Suspender próximos backups
sudo systemctl disable --now piccola-backup.timer
```

`last-upload` registra o envio; `last-success` só avança se retenção e checagem
também terminarem bem; `last-verified` registra o teste de restauração.
`last-error` guarda o último erro histórico e não é apagado no sucesso.
Falhas ficam no journal; não há alerta por e-mail configurado. Confira o resultado
regularmente, inclusive a idade de `last-success`.

O teste `--verify` seleciona e fixa o último snapshot, baixa e verifica seus arquivos,
importa o dump com `pg_restore --exit-on-error` em um banco temporário com prefixo
`piccola_restore_test_` e confere a presença de tabelas. Depois remove o banco de
teste e os arquivos temporários, inclusive em falhas comuns. Ele não substitui
arquivos do site ou dados do banco de produção.

Se a conexão SSH cair durante o primeiro backup, o serviço iniciado com
`systemctl start` continua executando. Reconecte e consulte o journal antes de
iniciar outra execução. Não use `unlock` ou `forget` para resolver erros sem
verificar se há um backup em andamento.

## Recuperação em caso de perda do servidor

1. Recrie Ubuntu, Java, PostgreSQL e o usuário/serviço do Piccola. Instale Restic e
   rclone; autorize o mesmo cliente OAuth para a mesma conta do Drive.
2. Recrie `/etc/piccola-backup/restic-password` com a senha guardada fora do
   Droplet (root, modo 600), e reinstale os scripts. Não execute `init` novamente.
3. Liste os snapshots e restaure o escolhido **em um diretório privado separado**:

   ```bash
   sudo install -d -m 700 /var/lib/piccola-restore
   sudo piccola-restic snapshots
   sudo piccola-restic restore ID_DO_SNAPSHOT --target /var/lib/piccola-restore --verify
   ```

4. Os arquivos estarão em
   `/var/lib/piccola-restore/var/lib/piccola-backup/staging/`: `database.dump`,
   `uploads/`, `config/` e `manifest.txt`, que informa o commit publicado.
   Confira os arquivos e importe primeiro em um banco temporário, como no teste.
5. Com a versão do código indicada no manifesto, planeje a substituição do banco
   e das imagens com o backend parado. Recrie a role e suas permissões; use
   `pg_restore --no-owner --no-acl` com o dono adequado. Reaplique o proprietário
   `piccola:piccola` às imagens e proteja `backend.env`. Reemita os certificados
   HTTPS e confira a configuração Nginx antes de iniciar.

Uma restauração destrutiva de produção não é automatizada neste pacote.

## Validação dos scripts

```bash
python3 ops/tests/test_backup.py
```

Os testes usam Restic e rsync reais com repositório local criptografado; simulam
systemd/PostgreSQL para validar falhas e recuperação sem acessar produção. A
integração real com PostgreSQL e Google Drive é validada pelo `--verify` no servidor.

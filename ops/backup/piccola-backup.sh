#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export TZ=America/Sao_Paulo
[[ $EUID -eq 0 ]] || { echo 'Use sudo piccola-backup.' >&2; exit 1; }
PICCOLA_STATE=/var/lib/piccola-backup
PICCOLA_STAGE=$PICCOLA_STATE/staging
PICCOLA_UPLOADS=/var/lib/piccola/uploads/products
PICCOLA_SERVICE=piccola-backend
PICCOLA_RESTIC=/usr/local/bin/piccola-restic
PICCOLA_MARKER=$PICCOLA_STATE/backend-paused
PICCOLA_HOST=piccola-prod
PICCOLA_TEST_DIR=''
PICCOLA_TEST_DB=''
PICCOLA_CAN_RESUME=false

piccola_health() {
    local piccola_attempt piccola_status
    for piccola_attempt in {1..40}; do
        piccola_status=$(curl -s --connect-timeout 2 --max-time 3 -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/api/products || true)
        if [[ $piccola_status == 200 ]] && systemctl is-active --quiet "$PICCOLA_SERVICE"; then return 0; fi
        sleep 2
    done
    return 1
}
piccola_resume() {
    [[ -f $PICCOLA_MARKER ]] || return 0
    echo 'Iniciando o backend...'
    systemctl start "$PICCOLA_SERVICE" || return 1
    piccola_health || { echo 'A API não voltou a responder. Consulte piccola-backend.' >&2; return 1; }
    rm -f -- "$PICCOLA_MARKER"
}

# ExecStopPost também passa aqui se o systemd precisar encerrar o backup.
if [[ ${1:-} == --recover && $# -eq 1 ]]; then
    [[ -f $PICCOLA_MARKER ]] || exit 0
    exec 8> /run/lock/piccola-publish.lock
    flock -w 300 8 || exit 1
    piccola_resume
    exit
fi
[[ $# -eq 0 || ( $# -eq 1 && $1 == --verify ) ]] || {
    echo 'Uso: sudo piccola-backup [--verify]' >&2; exit 2;
}
[[ -d $PICCOLA_STATE && -x $PICCOLA_RESTIC ]]
exec 9> /run/lock/piccola-backup.lock
flock -n 9 || { echo 'Outro backup/teste de restauração está em execução.' >&2; exit 1; }

piccola_cleanup() {
    local piccola_status=$?
    trap - EXIT INT TERM
    if [[ $PICCOLA_CAN_RESUME == true && -f $PICCOLA_MARKER ]]; then
        if ! piccola_resume; then piccola_status=1; fi
    fi
    if [[ -n $PICCOLA_TEST_DB ]]; then
        if ! runuser -u postgres -- dropdb --if-exists "$PICCOLA_TEST_DB"; then
            echo "Não foi possível remover o banco temporário $PICCOLA_TEST_DB." >&2
            piccola_status=1
        fi
    fi
    if [[ -n $PICCOLA_TEST_DIR ]]; then rm -rf -- "$PICCOLA_TEST_DIR"; fi
    if [[ $piccola_status -ne 0 ]]; then
        date --iso-8601=seconds > "$PICCOLA_STATE/last-error"
        echo 'Operação falhou. O horário está em /var/lib/piccola-backup/last-error.' >&2
    fi
    exit "$piccola_status"
}
trap piccola_cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [[ ${1:-} == --verify ]]; then
    # Nenhum arquivo de produção nem o banco piccola_arte é substituído.
    PICCOLA_SNAPSHOT=$("$PICCOLA_RESTIC" snapshots --host "$PICCOLA_HOST" --tag piccola --latest 1 --json |
        python3 -c 'import json,sys; s=json.load(sys.stdin); assert len(s)==1, "Nenhum snapshot encontrado"; print(s[0]["id"])')
    [[ $PICCOLA_SNAPSHOT =~ ^[0-9a-f]{64}$ ]]
    PICCOLA_TEST_DIR=$(mktemp -d "$PICCOLA_STATE/restore-test.XXXXXXXX")
    echo "Baixando e verificando o snapshot $PICCOLA_SNAPSHOT..."
    "$PICCOLA_RESTIC" restore "$PICCOLA_SNAPSHOT" --target "$PICCOLA_TEST_DIR" --verify
    PICCOLA_RESTORED=$PICCOLA_TEST_DIR$PICCOLA_STAGE
    [[ -s $PICCOLA_RESTORED/database.dump && -d $PICCOLA_RESTORED/uploads && -s $PICCOLA_RESTORED/config/backend.env ]]
    # stdin evita conceder acesso do postgres ao diretório privado de restauração.
    PICCOLA_TEST_NAME=piccola_restore_test_$(date -u +%Y%m%d%H%M%S)_$$
    runuser -u postgres -- createdb --template=template0 "$PICCOLA_TEST_NAME"
    PICCOLA_TEST_DB=$PICCOLA_TEST_NAME
    timeout 600 runuser -u postgres -- pg_restore --exit-on-error --no-owner --no-acl \
        --dbname="$PICCOLA_TEST_DB" < "$PICCOLA_RESTORED/database.dump"
    PICCOLA_TABLES=$(runuser -u postgres -- psql -X -v ON_ERROR_STOP=1 -At --dbname="$PICCOLA_TEST_DB" \
        -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")
    [[ $PICCOLA_TABLES =~ ^[0-9]+$ && $PICCOLA_TABLES -gt 0 ]]
    date --iso-8601=seconds > "$PICCOLA_STATE/last-verified"
    echo "Restauração testada: arquivos verificados e $PICCOLA_TABLES tabelas importadas no banco temporário."
    exit
fi

[[ -d $PICCOLA_UPLOADS && -s /etc/piccola/backend.env ]]
install -d -m 700 "$PICCOLA_STAGE" "$PICCOLA_STAGE/uploads" "$PICCOLA_STAGE/config"
# Detecta credencial/repositório inacessível antes de pausar a aplicação.
"$PICCOLA_RESTIC" snapshots > /dev/null
PICCOLA_LIVE_BYTES=$(du -sb "$PICCOLA_UPLOADS" | cut -f1)
PICCOLA_STAGE_BYTES=$(du -sb "$PICCOLA_STAGE/uploads" | cut -f1)
PICCOLA_DB_BYTES=$(runuser -u postgres -- psql -X -v ON_ERROR_STOP=1 -At --dbname=piccola_arte -c 'SELECT pg_database_size(current_database())')
PICCOLA_FREE_BYTES=$(df -PB1 "$PICCOLA_STATE" | awk 'NR==2 {print $4}')
PICCOLA_EXTRA_BYTES=$(( PICCOLA_LIVE_BYTES > PICCOLA_STAGE_BYTES ? PICCOLA_LIVE_BYTES - PICCOLA_STAGE_BYTES : 0 ))
(( PICCOLA_FREE_BYTES > PICCOLA_EXTRA_BYTES + PICCOLA_DB_BYTES + 536870912 )) || {
    echo 'Espaço insuficiente para a cópia temporária e uma margem de 512 MiB.' >&2; exit 1;
}
echo 'Preparando a cópia das imagens com o site funcionando...'
PICCOLA_PRECOPY_STATUS=0
rsync -a --delete -- "$PICCOLA_UPLOADS/" "$PICCOLA_STAGE/uploads/" || PICCOLA_PRECOPY_STATUS=$?
# Arquivo removido enquanto o site funciona será resolvido na cópia final.
[[ $PICCOLA_PRECOPY_STATUS -eq 0 || $PICCOLA_PRECOPY_STATUS -eq 24 ]]

# Mesmo lock do publicador: deploy/rollback não pode iniciar o app durante o dump.
exec 8> /run/lock/piccola-publish.lock
flock -w 300 8 || { echo 'Deploy em andamento; tente novamente depois.' >&2; exit 1; }
PICCOLA_CAN_RESUME=true
piccola_resume
systemctl is-active --quiet "$PICCOLA_SERVICE" || {
    echo 'Backend já estava parado. Backup cancelado sem iniciá-lo.' >&2; exit 1;
}
echo 'Pausando o backend para alinhar banco e imagens...'
date --iso-8601=seconds > "$PICCOLA_MARKER"
systemctl stop "$PICCOLA_SERVICE"
timeout 120 rsync -a --delete --checksum -- "$PICCOLA_UPLOADS/" "$PICCOLA_STAGE/uploads/"
timeout 180 runuser -u postgres -- pg_dump --format=custom --no-owner --no-acl \
    --lock-wait-timeout=30s piccola_arte > "$PICCOLA_STAGE/database.dump.partial"
pg_restore --list < "$PICCOLA_STAGE/database.dump.partial" > /dev/null
mv -- "$PICCOLA_STAGE/database.dump.partial" "$PICCOLA_STAGE/database.dump"
install -m 600 /etc/piccola/backend.env "$PICCOLA_STAGE/config/backend.env"
install -m 600 /etc/systemd/system/piccola-backend.service "$PICCOLA_STAGE/config/piccola-backend.service"
if [[ -d /etc/nginx ]]; then
    rsync -a --delete -- /etc/nginx/ "$PICCOLA_STAGE/config/nginx/"
fi
{
    printf 'captured_at=%s\n' "$(date --iso-8601=seconds)"
    printf 'database=piccola_arte\nupload_source=%s\n' "$PICCOLA_UPLOADS"
    if [[ -f /opt/piccola/deploy-state/current/.commit ]]; then
        printf 'deployed_commit=%s\n' "$(cat /opt/piccola/deploy-state/current/.commit)"
    fi
} > "$PICCOLA_STAGE/manifest.txt"
piccola_resume
flock -u 8

echo 'Backend disponível. Enviando o backup criptografado ao Google Drive...'
"$PICCOLA_RESTIC" backup --host "$PICCOLA_HOST" --tag piccola "$PICCOLA_STAGE"
date --iso-8601=seconds > "$PICCOLA_STATE/last-upload"
# A retenção só roda depois de um backup completo; escopo limitado a estes snapshots.
"$PICCOLA_RESTIC" forget --host "$PICCOLA_HOST" --tag piccola --group-by host,paths \
    --keep-daily 7 --keep-weekly 4 --keep-monthly 3 --prune --max-unused 10% --max-repack-size 128M
"$PICCOLA_RESTIC" check
date --iso-8601=seconds > "$PICCOLA_STATE/last-success"
echo 'Backup concluído, retenção aplicada e estrutura do repositório verificada.'

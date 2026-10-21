#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
[[ $EUID -eq 0 ]] || { echo 'A publicação requer sudo.' >&2; exit 1; }
source /etc/piccola-deploy.conf
PICCOLA_BASE=/opt/piccola
PICCOLA_WEB=/var/www/piccola
PICCOLA_BACKUPS=/var/backups/piccola/deploy
PICCOLA_GROUP=piccola
PICCOLA_SERVICE=piccola-backend
PICCOLA_STATE="$PICCOLA_BASE/deploy-state"
PICCOLA_RELEASES="$PICCOLA_BASE/releases"
exec 8> /run/lock/piccola-publish.lock
flock -n 8 || { echo 'Outra publicação/rollback está em execução.' >&2; exit 1; }
install -d -m 755 "$PICCOLA_BASE" "$PICCOLA_STATE" "$PICCOLA_RELEASES"
install -d -m 700 "$PICCOLA_BACKUPS"
PICCOLA_SWITCHED=false
PICCOLA_RESTART=false
PICCOLA_OLD=''

piccola_link() {
    local piccola_target=$1 piccola_link=$2
    rm -f -- "$piccola_link.next.$$"
    ln -s -- "$piccola_target" "$piccola_link.next.$$"
    mv -Tf -- "$piccola_link.next.$$" "$piccola_link"
}
piccola_health() {
    local piccola_attempt piccola_status
    for piccola_attempt in {1..60}; do
        piccola_status=$(curl -s --connect-timeout 2 --max-time 3 -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/api/products || true)
        if [[ $piccola_status == 200 ]] && systemctl is-active --quiet "$PICCOLA_SERVICE"; then return 0; fi
        sleep 2
    done
    return 1
}
piccola_exit() {
    local piccola_status=$?
    trap - EXIT INT TERM
    if [[ $piccola_status -ne 0 && $PICCOLA_SWITCHED == true && -n $PICCOLA_OLD ]]; then
        echo 'Publicação falhou. Retornando o código para a versão anterior...' >&2
        if piccola_link "$PICCOLA_OLD" "$PICCOLA_STATE/current" \
            && piccola_link "$PICCOLA_STATE/current/frontend" "$PICCOLA_WEB" \
            && piccola_link "$PICCOLA_STATE/current/backend/app.jar" "$PICCOLA_BASE/backend/app.jar"; then
            if [[ $PICCOLA_RESTART == false ]] || systemctl restart "$PICCOLA_SERVICE"; then
                if piccola_health; then echo 'Código anterior restaurado.' >&2; else echo 'Verifique o serviço: a versão anterior também não respondeu.' >&2; fi
            else
                echo 'Falha ao reiniciar a versão anterior; consulte journalctl.' >&2
            fi
        else
            echo "Falha no retorno dos links. Versão anterior: $PICCOLA_OLD" >&2
        fi
        echo 'O banco não é revertido automaticamente. Dump local em /var/backups/piccola/deploy.' >&2
        journalctl -u "$PICCOLA_SERVICE" -n 40 --no-pager >&2 || true
    fi
    exit "$piccola_status"
}
trap piccola_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

piccola_dump() {
    local piccola_dump
    piccola_dump="$PICCOLA_BACKUPS/pre-deploy-$(date -u +%Y%m%dT%H%M%SZ)-$$.dump"
    echo 'Criando dump local antes da troca do backend...'
    timeout 180 runuser -u postgres -- pg_dump --format=custom --no-owner --no-acl --lock-wait-timeout=30s piccola_arte > "$piccola_dump.partial"
    pg_restore --list < "$piccola_dump.partial" > /dev/null
    mv -- "$piccola_dump.partial" "$piccola_dump"
    echo "Dump: $piccola_dump"
}
piccola_baseline() {
    local piccola_baseline piccola_legacy
    [[ ! -L $PICCOLA_WEB && ! -L $PICCOLA_BASE/backend/app.jar ]] || {
        echo 'Publicação existente usa links diferentes dos esperados. Nada foi substituído.' >&2; exit 1;
    }
    [[ -s $PICCOLA_BASE/backend/app.jar && -s $PICCOLA_WEB/index.html ]]
    piccola_baseline=$(mktemp -d "$PICCOLA_RELEASES/release-initial-XXXXXXXX")
    chmod 755 "$piccola_baseline"
    install -d -o root -g "$PICCOLA_GROUP" -m 750 "$piccola_baseline/backend"
    install -o root -g "$PICCOLA_GROUP" -m 640 "$PICCOLA_BASE/backend/app.jar" "$piccola_baseline/backend/app.jar"
    install -d -m 755 "$piccola_baseline/frontend"
    rsync -a --safe-links --chown=root:root --chmod=D755,F644 -- "$PICCOLA_WEB/" "$piccola_baseline/frontend/"
    printf 'initial\n' > "$piccola_baseline/.commit"
    chmod 644 "$piccola_baseline/.commit"
    piccola_link "$piccola_baseline" "$PICCOLA_STATE/current"
    PICCOLA_OLD=$piccola_baseline
    PICCOLA_SWITCHED=true
    piccola_legacy="$PICCOLA_WEB.before-deploy-$(date -u +%Y%m%dT%H%M%SZ)-$$"
    mv -- "$PICCOLA_WEB" "$piccola_legacy"
    piccola_link "$PICCOLA_STATE/current/frontend" "$PICCOLA_WEB"
    piccola_link "$PICCOLA_STATE/current/backend/app.jar" "$PICCOLA_BASE/backend/app.jar"
    echo "Frontend original preservado em $piccola_legacy"
    PICCOLA_SWITCHED=false
}

nginx -t
if [[ ${1:-} == --rollback ]]; then
    [[ $# -eq 1 && -L $PICCOLA_STATE/previous ]] || { echo 'Ainda não há versão anterior para rollback.' >&2; exit 1; }
    PICCOLA_NEW=$(readlink -f "$PICCOLA_STATE/previous")
else
    [[ $# -eq 2 && $2 =~ ^[0-9a-f]{40}$ ]] || { echo 'Argumentos de publicação inválidos.' >&2; exit 2; }
    PICCOLA_STAGE=$(readlink -f -- "$1")
    [[ $PICCOLA_STAGE == "$PICCOLA_REPO"/.git/piccola-deploy.* && -d $PICCOLA_STAGE ]]
    PICCOLA_NEW=$(mktemp -d "$PICCOLA_RELEASES/release-$(date -u +%Y%m%dT%H%M%SZ)-${2:0:12}-XXXXXXXX")
    chmod 755 "$PICCOLA_NEW"
    install -d -o root -g "$PICCOLA_GROUP" -m 750 "$PICCOLA_NEW/backend"
    install -d -m 755 "$PICCOLA_NEW/frontend"
    if [[ -s $PICCOLA_STAGE/app.jar ]]; then
        unzip -tqq "$PICCOLA_STAGE/app.jar"
        install -o root -g "$PICCOLA_GROUP" -m 640 "$PICCOLA_STAGE/app.jar" "$PICCOLA_NEW/backend/app.jar"
    else
        install -o root -g "$PICCOLA_GROUP" -m 640 "$PICCOLA_STATE/current/backend/app.jar" "$PICCOLA_NEW/backend/app.jar"
    fi
    if [[ -s $PICCOLA_STAGE/frontend/index.html ]]; then
        rsync -a --safe-links --chown=root:root --chmod=D755,F644 -- "$PICCOLA_STAGE/frontend/" "$PICCOLA_NEW/frontend/"
    else
        rsync -a --safe-links --chown=root:root --chmod=D755,F644 -- "$PICCOLA_STATE/current/frontend/" "$PICCOLA_NEW/frontend/"
    fi
    printf '%s\n' "$2" > "$PICCOLA_NEW/.commit"
    chmod 644 "$PICCOLA_NEW/.commit"
fi
[[ $PICCOLA_NEW == "$PICCOLA_RELEASES"/release-* && -s $PICCOLA_NEW/backend/app.jar && -s $PICCOLA_NEW/frontend/index.html ]]
if [[ ! -L $PICCOLA_STATE/current ]] || ! cmp -s "$PICCOLA_STATE/current/backend/app.jar" "$PICCOLA_NEW/backend/app.jar"; then
    PICCOLA_RESTART=true
    piccola_dump
fi
[[ -L $PICCOLA_STATE/current ]] || piccola_baseline
PICCOLA_OLD=$(readlink -f "$PICCOLA_STATE/current")
[[ $(readlink -f "$PICCOLA_WEB") == "$PICCOLA_OLD/frontend" \
    && $(readlink -f "$PICCOLA_BASE/backend/app.jar") == "$PICCOLA_OLD/backend/app.jar" ]] || {
    echo 'Os links de produção foram alterados fora do deploy. Confira antes de continuar.' >&2; exit 1;
}
PICCOLA_SWITCHED=true
piccola_link "$PICCOLA_NEW" "$PICCOLA_STATE/current"
if [[ $PICCOLA_RESTART == true ]]; then systemctl restart "$PICCOLA_SERVICE"; fi
if ! piccola_health; then echo 'A API não retornou HTTP 200 dentro do prazo.' >&2; exit 1; fi
piccola_link "$PICCOLA_OLD" "$PICCOLA_STATE/previous"
PICCOLA_SWITCHED=false
echo "Publicado: $(cat "$PICCOLA_NEW/.commit")"

# Limpa apenas os diretórios/arquivos criados por este mecanismo.
# Ativa e anterior são sempre preservadas, além das cinco mais recentes.
python3 - "$PICCOLA_RELEASES" "$PICCOLA_STATE" "$PICCOLA_BACKUPS" <<'PY'
from pathlib import Path
import shutil
import sys
releases, state, backups = map(Path, sys.argv[1:])
protected = {(state / name).resolve() for name in ('current', 'previous')}
items = sorted((p for p in releases.iterdir() if p.name.startswith('release-') and p.is_dir() and not p.is_symlink()), key=lambda p: p.stat().st_mtime_ns, reverse=True)
for item in items[5:]:
    if item.resolve() not in protected:
        shutil.rmtree(item)
dumps = sorted(backups.glob('pre-deploy-*.dump'), key=lambda p: p.stat().st_mtime_ns, reverse=True)
for item in dumps[5:]:
    if item.is_file() and not item.is_symlink():
        item.unlink()
PY

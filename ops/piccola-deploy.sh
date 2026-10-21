#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

[[ $EUID -ne 0 ]] || { echo 'Execute piccola-deploy sem sudo.' >&2; exit 1; }
# Arquivo sem segredos, instalado como root:root 644.
source /etc/piccola-deploy.conf
PICCOLA_FORCE=false
PICCOLA_ROLLBACK=false
case ${1:-} in
    '') ;;
    --force) PICCOLA_FORCE=true ;;
    --rollback) PICCOLA_ROLLBACK=true ;;
    *) echo 'Uso: piccola-deploy [--force|--rollback]' >&2; exit 2 ;;
esac
[[ $# -le 1 ]]
cd -- "$PICCOLA_REPO"
exec 9> .git/piccola-deploy.lock
flock -n 9 || { echo 'Outro deploy já está em execução.' >&2; exit 1; }
if [[ $PICCOLA_ROLLBACK == true ]]; then
    sudo /usr/local/libexec/piccola-publish --rollback
    exit 0
fi
[[ $(git branch --show-current) == main ]] || { echo 'O clone do servidor precisa estar na branch main.' >&2; exit 1; }
[[ -z $(git status --porcelain) ]] || {
    echo 'Há alterações locais no clone do servidor. Resolva-as antes do deploy; nada foi descartado.' >&2; exit 1;
}

sudo -v
git pull --ff-only origin main
PICCOLA_COMMIT=$(git rev-parse HEAD)
for PICCOLA_PAIR in 'piccola-deploy.sh:/usr/local/bin/piccola-deploy' 'piccola-publish.sh:/usr/local/libexec/piccola-publish'; do
    [[ $(sha256sum "ops/${PICCOLA_PAIR%%:*}" | cut -d ' ' -f 1) == $(sha256sum "${PICCOLA_PAIR#*:}" | cut -d ' ' -f 1) ]] || {
        echo 'Os scripts de deploy mudaram. Execute sudo bash ops/install-deploy.sh e repita piccola-deploy.' >&2; exit 1;
    }
done
PICCOLA_PREVIOUS=$(cat /opt/piccola/deploy-state/current/.commit 2>/dev/null || true)
if [[ $PICCOLA_FORCE == false && $PICCOLA_PREVIOUS == "$PICCOLA_COMMIT" ]]; then
    echo "Já publicado: ${PICCOLA_COMMIT:0:12}. Para reconstruir: piccola-deploy --force"
    exit 0
fi
PICCOLA_FRONTEND=true
PICCOLA_BACKEND=true
if [[ $PICCOLA_FORCE == false && $PICCOLA_PREVIOUS =~ ^[0-9a-f]{40}$ ]] && git cat-file -e "$PICCOLA_PREVIOUS^{commit}" 2>/dev/null; then
    if git diff --quiet "$PICCOLA_PREVIOUS" "$PICCOLA_COMMIT" -- frontend; then PICCOLA_FRONTEND=false; fi
    if git diff --quiet "$PICCOLA_PREVIOUS" "$PICCOLA_COMMIT" -- backend; then PICCOLA_BACKEND=false; fi
fi
[[ $(df -Pk . | awk 'END {print $4}') -ge 1048576 ]] || { echo 'Libere ao menos 1 GiB no disco antes do build.' >&2; exit 1; }
PICCOLA_STAGE=$(mktemp -d "$PICCOLA_REPO/.git/piccola-deploy.XXXXXX")
trap 'rm -rf -- "$PICCOLA_STAGE"' EXIT

# Os builds rodam como yuriven; as credenciais do backend não são carregadas.
if [[ $PICCOLA_FRONTEND == true ]]; then
    echo 'Gerando frontend...'
    (
        cd frontend
        export NODE_OPTIONS='--max-old-space-size=384'
        npm ci --include=dev --no-audit --no-fund
        VITE_API_BASE_URL="$PICCOLA_API_URL" npm run build
    )
    [[ -s frontend/dist/index.html ]]
    mkdir "$PICCOLA_STAGE/frontend"
    rsync -a -- frontend/dist/ "$PICCOLA_STAGE/frontend/"
fi
if [[ $PICCOLA_BACKEND == true ]]; then
    echo 'Empacotando backend (testes devem rodar no ambiente de desenvolvimento)...'
    (
        cd backend
        export JAVA_HOME="$PICCOLA_JAVA_HOME"
        export MAVEN_OPTS='-Xms32m -Xmx256m -XX:MaxMetaspaceSize=192m -XX:+UseSerialGC'
        bash ./mvnw -B -ntp -DskipTests clean package
    )
    PICCOLA_JARS=(backend/target/*.jar)
    [[ ${#PICCOLA_JARS[@]} -eq 1 && -s ${PICCOLA_JARS[0]} ]] || { echo 'Esperava exatamente um JAR em backend/target.' >&2; exit 1; }
    cp -- "${PICCOLA_JARS[0]}" "$PICCOLA_STAGE/app.jar"
fi
[[ $(git rev-parse HEAD) == "$PICCOLA_COMMIT" && -z $(git status --porcelain) ]] || {
    echo 'O código mudou durante o build. Repita o deploy.' >&2; exit 1;
}
sudo /usr/local/libexec/piccola-publish "$PICCOLA_STAGE" "$PICCOLA_COMMIT"

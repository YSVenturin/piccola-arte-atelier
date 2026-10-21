#!/usr/bin/env bash
set -Eeuo pipefail

# Instala o comando manual para o Droplet que já hospeda o Piccola.
[[ $EUID -eq 0 && -n ${SUDO_USER:-} && $SUDO_USER != root ]] || {
    echo 'Execute como yuriven: sudo bash ops/install-deploy.sh' >&2; exit 1;
}
PICCOLA_SOURCE=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
[[ $(stat -c %U "$PICCOLA_SOURCE") == "$SUDO_USER" ]] || {
    echo 'O clone precisa pertencer ao usuário que executou sudo.' >&2; exit 1;
}
runuser -u "$SUDO_USER" -- git -C "$PICCOLA_SOURCE" rev-parse --is-inside-work-tree >/dev/null
getent passwd piccola >/dev/null
getent group piccola >/dev/null
systemctl cat piccola-backend.service >/dev/null
[[ -s /opt/piccola/backend/app.jar && -d /var/www/piccola ]] || {
    echo 'Não encontrei o backend/frontend já publicados nos caminhos esperados.' >&2; exit 1;
}

apt-get update
apt-get install -y git curl ca-certificates xz-utils unzip rsync util-linux python3 openjdk-21-jdk-headless

# Distribuição oficial do Node 24 LTS, validada com seu SHA-256.
# Usa a versão exata indicada pelo índice, mesmo que latest-v24.x mude depois.
if ! command -v node >/dev/null || [[ $(node -p 'process.versions.node.split(".")[0]') != 24 ]]; then
    case $(dpkg --print-architecture) in
        amd64) PICCOLA_ARCH=x64 ;;
        arm64) PICCOLA_ARCH=arm64 ;;
        *) echo 'Arquitetura não suportada por este instalador.' >&2; exit 1 ;;
    esac
    PICCOLA_DOWNLOAD=$(mktemp -d)
    trap 'rm -rf -- "$PICCOLA_DOWNLOAD"' EXIT
    curl -fSL --retry 3 https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt -o "$PICCOLA_DOWNLOAD/SHASUMS256.txt"
    read -r PICCOLA_CHECKSUM PICCOLA_ARCHIVE < <(
        awk -v arch="$PICCOLA_ARCH" '$2 ~ ("^node-v24\\.[0-9]+\\.[0-9]+-linux-" arch "\\.tar\\.xz$") {print $1, $2; exit}' "$PICCOLA_DOWNLOAD/SHASUMS256.txt"
    )
    [[ $PICCOLA_ARCHIVE =~ ^node-v24\.[0-9]+\.[0-9]+-linux-(x64|arm64)\.tar\.xz$ ]]
    PICCOLA_NODE_VERSION=${PICCOLA_ARCHIVE%-linux-*}
    PICCOLA_NODE_VERSION=${PICCOLA_NODE_VERSION#node-}
    curl -fSL --retry 3 "https://nodejs.org/dist/$PICCOLA_NODE_VERSION/$PICCOLA_ARCHIVE" -o "$PICCOLA_DOWNLOAD/$PICCOLA_ARCHIVE"
    (cd "$PICCOLA_DOWNLOAD" && printf '%s  %s\n' "$PICCOLA_CHECKSUM" "$PICCOLA_ARCHIVE" | sha256sum --check)
    install -d -m 755 /opt/piccola-tools
    tar --extract --xz --file "$PICCOLA_DOWNLOAD/$PICCOLA_ARCHIVE" --directory /opt/piccola-tools --no-same-owner
    PICCOLA_NODE_DIR="/opt/piccola-tools/${PICCOLA_ARCHIVE%.tar.xz}"
    for PICCOLA_TOOL in node npm npx; do
        ln -sfn "$PICCOLA_NODE_DIR/bin/$PICCOLA_TOOL" "/usr/local/bin/$PICCOLA_TOOL"
    done
fi

PICCOLA_JDK="/usr/lib/jvm/java-21-openjdk-$(dpkg --print-architecture)"
[[ -x $PICCOLA_JDK/bin/javac ]]
PICCOLA_CONF=$(mktemp)
printf 'PICCOLA_REPO=%q\nPICCOLA_JAVA_HOME=%q\nPICCOLA_API_URL=%q\n' \
    "$PICCOLA_SOURCE" "$PICCOLA_JDK" 'https://piccolaarteatelier.com.br/api/' > "$PICCOLA_CONF"
install -o root -g root -m 644 "$PICCOLA_CONF" /etc/piccola-deploy.conf
rm -f -- "$PICCOLA_CONF"
install -d -m 755 /usr/local/libexec
install -o root -g root -m 755 "$PICCOLA_SOURCE/ops/piccola-deploy.sh" /usr/local/bin/piccola-deploy
install -o root -g root -m 755 "$PICCOLA_SOURCE/ops/piccola-publish.sh" /usr/local/libexec/piccola-publish
printf '\nInstalado. Node: %s; Java: %s\n' "$(node --version)" "$PICCOLA_JDK"
echo 'Execute como usuário normal: piccola-deploy'
echo 'Este instalador não cria cron, timer, webhook ou runner.'

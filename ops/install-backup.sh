#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
[[ $EUID -eq 0 ]] || { echo 'Execute sudo bash ops/install-backup.sh.' >&2; exit 1; }
exec 9> /run/lock/piccola-backup.lock
flock -n 9 || { echo 'Aguarde o backup/teste em execução antes de instalar.' >&2; exit 1; }
PICCOLA_SOURCE=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/backup" && pwd)
[[ -s /etc/piccola-backup/rclone.conf ]] || {
    echo 'Configure primeiro o remote piccola_drive em /etc/piccola-backup/rclone.conf.' >&2; exit 1;
}
[[ -d /var/lib/piccola/uploads/products && -s /etc/piccola/backend.env \
    && -f /etc/systemd/system/piccola-backend.service ]] || {
    echo 'Os caminhos de produção do Piccola não foram encontrados.' >&2; exit 1;
}
apt-get update
apt-get install -y restic rclone rsync python3 curl util-linux postgresql-client
install -d -o root -g root -m 700 /etc/piccola-backup /var/lib/piccola-backup /var/cache/piccola-backup
chown root:root /etc/piccola-backup/rclone.conf
chmod 600 /etc/piccola-backup/rclone.conf
PICCOLA_PASSWORD_FILE=/etc/piccola-backup/restic-password
if [[ ! -e $PICCOLA_PASSWORD_FILE ]]; then
    echo 'Crie e guarde no seu gerenciador uma senha exclusiva de pelo menos 20 caracteres.'
    echo 'Ela será necessária para restaurar os backups se o servidor for perdido.'
    IFS= read -r -s -p 'Senha de criptografia: ' PICCOLA_PASSWORD
    printf '\n'
    IFS= read -r -s -p 'Repita a senha: ' PICCOLA_CONFIRM
    printf '\n'
    [[ ${#PICCOLA_PASSWORD} -ge 20 && $PICCOLA_PASSWORD == "$PICCOLA_CONFIRM" ]] || {
        unset PICCOLA_PASSWORD PICCOLA_CONFIRM
        echo 'Senhas diferentes ou senha com menos de 20 caracteres. Execute novamente.' >&2; exit 1;
    }
    ( set -o noclobber; printf '%s\n' "$PICCOLA_PASSWORD" > "$PICCOLA_PASSWORD_FILE" )
    unset PICCOLA_PASSWORD PICCOLA_CONFIRM
fi
[[ -s $PICCOLA_PASSWORD_FILE && ! -L $PICCOLA_PASSWORD_FILE ]]
chown root:root "$PICCOLA_PASSWORD_FILE"
chmod 600 "$PICCOLA_PASSWORD_FILE"
install -o root -g root -m 755 "$PICCOLA_SOURCE/piccola-restic.sh" /usr/local/bin/piccola-restic
install -o root -g root -m 755 "$PICCOLA_SOURCE/piccola-backup.sh" /usr/local/bin/piccola-backup
install -o root -g root -m 644 "$PICCOLA_SOURCE/piccola-backup.service" /etc/systemd/system/piccola-backup.service
install -o root -g root -m 644 "$PICCOLA_SOURCE/piccola-backup.timer" /etc/systemd/system/piccola-backup.timer
systemctl daemon-reload
echo
echo 'Instalado. A senha anterior é preservada em reinstalações.'
echo 'Na primeira instalação, execute nesta ordem:'
echo '  sudo piccola-restic init'
echo '  sudo systemctl start piccola-backup.service'
echo '  sudo piccola-backup --verify'
echo '  sudo systemctl enable --now piccola-backup.timer'
echo 'O agendamento só será ativado pelo último comando.'

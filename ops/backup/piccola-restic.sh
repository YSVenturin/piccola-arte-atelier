#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
[[ $EUID -eq 0 ]] || { echo 'Use sudo piccola-restic.' >&2; exit 1; }
export RESTIC_REPOSITORY='rclone:piccola_drive:Piccola-Backups/restic'
export RESTIC_PASSWORD_FILE=/etc/piccola-backup/restic-password
export RCLONE_CONFIG=/etc/piccola-backup/rclone.conf
export RESTIC_CACHE_DIR=/var/cache/piccola-backup
# Somente o repositório acima: a retenção elimina os blocos expirados do Drive.
export RCLONE_DRIVE_USE_TRASH=false
export GOMAXPROCS=1 GOGC=50 GOMEMLIMIT=160MiB
[[ -s $RESTIC_PASSWORD_FILE && -s $RCLONE_CONFIG ]] || {
    echo 'Faltam as credenciais em /etc/piccola-backup.' >&2; exit 1;
}
exec /usr/bin/restic -o rclone.connections=2 "$@"

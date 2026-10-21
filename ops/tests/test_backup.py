"""Integração em diretórios temporários: Restic/rsync reais, systemd/Postgres simulados.

Não acessa Google Drive nem a instalação de produção. Use RESTIC_BIN para indicar
o binário Restic; caso contrário usa restic do PATH.
"""
import json
import fcntl
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

OPS = Path(__file__).resolve().parents[1]
RESTIC = os.environ.get("RESTIC_BIN") or shutil.which("restic")

MOCK = r'''#!/usr/bin/env python3
import json, os, pathlib, sys
p=pathlib.Path(os.environ['FIXTURE'])
name=pathlib.Path(sys.argv[0]).name
args=sys.argv[1:]
with (p/'calls').open('a') as f: f.write(json.dumps([name,*args])+'\n')
fail=os.environ.get('FAIL','')
if name=='systemctl':
    if args[0]=='is-active': sys.exit(0 if (p/'active').exists() else 3)
    if args[0]=='stop': (p/'active').unlink(missing_ok=True)
    if args[0]=='start':
        if fail=='start': sys.exit(1)
        (p/'active').touch()
elif name=='curl': print('200' if (p/'active').exists() else '503',end='')
elif name=='runuser':
    assert args[:3]==['-u','postgres','--']
    cmd=args[3:]
    if cmd[0]=='pg_dump':
        if fail=='dump': sys.exit(1)
        sys.stdout.buffer.write(b'PGDMP fixture category product image data\n')
    elif cmd[0]=='psql': print('32768' if any('pg_database_size' in a for a in cmd) else '3')
    elif cmd[0]=='createdb':
        assert cmd[-1].startswith('piccola_restore_test_')
        (p/'test-db').write_text(cmd[-1])
    elif cmd[0]=='pg_restore':
        assert any(a.startswith('--dbname=piccola_restore_test_') for a in cmd)
        assert sys.stdin.buffer.read().startswith(b'PGDMP')
        if fail=='restore-db': sys.exit(1)
    elif cmd[0]=='dropdb':
        assert cmd[-1].startswith('piccola_restore_test_')
        (p/'test-db').unlink(missing_ok=True)
    else: raise AssertionError(cmd)
elif name=='pg_restore':
    assert args==['--list']
    assert sys.stdin.buffer.read().startswith(b'PGDMP')
else: raise AssertionError(name)
'''


@unittest.skipUnless(RESTIC and shutil.which("rsync"), "Requer restic e rsync")
class BackupTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="piccola-backup-test-")
        self.p = Path(self.temp.name)
        for name in ("state", "live/products", "etc/piccola", "etc/systemd/system", "bin", "locks", "cache"):
            (self.p / name).mkdir(parents=True)
        (self.p / "active").touch()
        (self.p / "password").write_text("fixture-only-encryption-password\n")
        (self.p / "live/products/image.jpg").write_bytes(b"image fixture\x00\xff")
        (self.p / "etc/piccola/backend.env").write_text("DB_PASSWORD=fixture-not-a-real-secret\n")
        (self.p / "etc/systemd/system/piccola-backend.service").write_text("[Service]\nType=simple\n")
        mock = self.p / "bin/mock"
        mock.write_text(MOCK)
        mock.chmod(0o755)
        for name in ("systemctl", "curl", "runuser", "pg_restore"):
            (self.p / f"bin/{name}").symlink_to(mock)
        self.env = dict(os.environ, FIXTURE=str(self.p),
                        RESTIC_REPOSITORY=str(self.p / "repo"),
                        RESTIC_PASSWORD_FILE=str(self.p / "password"),
                        RESTIC_CACHE_DIR=str(self.p / "cache"), GOMAXPROCS="1")
        # Exatamente o runner distribuído, com caminhos isolados e limites menores.
        script = (OPS / "backup/piccola-backup.sh").read_text()
        script = script.replace("export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
                                f"export PATH={self.p}/bin:/usr/bin:/bin")
        script = script.replace("[[ $EUID -eq 0 ]]", "[[ 0 -eq 0 ]]")
        for old, new in (("/var/lib/piccola-backup", str(self.p / "state")),
                         ("/var/lib/piccola/uploads", str(self.p / "live")),
                         ("/usr/local/bin/piccola-restic", str(self.p / "restic-wrapper")),
                         ("/run/lock", str(self.p / "locks")),
                         ("/etc/", str(self.p / "etc") + "/"),
                         ("/opt/piccola/", str(self.p / "opt") + "/")):
            script = script.replace(old, new)
        script = script.replace("flock -w 300", "flock -w 0")
        self.runner = self.p / "runner"
        self.runner.write_text(script)
        self.runner.chmod(0o755)
        wrapper = self.p / "restic-wrapper"
        wrapper.write_text(f'''#!/usr/bin/env python3
import json,os,sys
from pathlib import Path
with Path(os.environ['FIXTURE'],'calls').open('a') as f:
    f.write(json.dumps(['restic',*sys.argv[1:]])+'\\n')
if os.environ.get('FAIL')==sys.argv[1]: sys.exit(1)
os.execv({RESTIC!r},[{RESTIC!r},'-o','rclone.connections=2',*sys.argv[1:]])
''')
        wrapper.chmod(0o755)
        subprocess.run([RESTIC, "init"], env=self.env, check=True, capture_output=True)

    def tearDown(self):
        self.temp.cleanup()

    def run_backup(self, *args, fail="", success=True):
        r = subprocess.run([str(self.runner), *args], env=dict(self.env, FAIL=fail),
                           text=True, capture_output=True, timeout=40)
        if success:
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        else:
            self.assertNotEqual(r.returncode, 0, r.stdout + r.stderr)
        return r

    def calls(self):
        return [json.loads(line) for line in (self.p / "calls").read_text().splitlines()]

    def snapshots(self):
        r = subprocess.run([RESTIC, "snapshots", "--json"], env=self.env, check=True, capture_output=True)
        return json.loads(r.stdout)

    def test_encrypted_backup_and_restore(self):
        self.run_backup()
        self.assertTrue((self.p / "active").exists())
        self.assertFalse((self.p / "state/backend-paused").exists())
        self.assertTrue((self.p / "state/last-success").exists())
        self.assertEqual(len(self.snapshots()), 1)
        target = self.p / "restored"
        subprocess.run([RESTIC, "restore", "latest", "--target", str(target), "--verify"],
                       env=self.env, check=True, capture_output=True)
        restored = target / str(self.p / "state/staging").lstrip("/")
        self.assertEqual((restored / "uploads/image.jpg").read_bytes(), b"image fixture\x00\xff")
        self.assertEqual((restored / "database.dump").read_bytes(), b"PGDMP fixture category product image data\n")
        self.assertIn("DB_PASSWORD=fixture", (restored / "config/backend.env").read_text())
        calls = self.calls()
        self.assertLess(calls.index(["systemctl", "start", "piccola-backend"]),
                        next(i for i, c in enumerate(calls) if c[:2] == ["restic", "backup"]))

    def test_dump_failure_resumes_backend_without_upload_or_retention(self):
        self.run_backup(fail="dump", success=False)
        self.assertTrue((self.p / "active").exists())
        self.assertFalse((self.p / "state/backend-paused").exists())
        self.assertEqual(self.snapshots(), [])
        self.assertFalse(any(c[:2] in (["restic", "backup"], ["restic", "forget"]) for c in self.calls()))

    def test_upload_failure_does_not_prune_previous_backups(self):
        self.run_backup()
        original = self.snapshots()[0]["id"]
        (self.p / "calls").write_text("")
        self.run_backup(fail="backup", success=False)
        self.assertTrue((self.p / "active").exists())
        self.assertEqual(self.snapshots()[0]["id"], original)
        self.assertFalse(any(c[:2] == ["restic", "forget"] for c in self.calls()))

    def test_backend_already_stopped_is_preserved(self):
        (self.p / "active").unlink()
        self.run_backup(success=False)
        self.assertFalse((self.p / "active").exists())
        self.assertFalse(any(c[:2] == ["systemctl", "start"] for c in self.calls()))

    def test_repo_failure_does_not_stop_backend(self):
        self.run_backup(fail="snapshots", success=False)
        self.assertTrue((self.p / "active").exists())
        self.assertFalse(any(c[:2] == ["systemctl", "stop"] for c in self.calls()))

    def test_deploy_lock_prevents_pausing_the_backend(self):
        with (self.p / "locks/piccola-publish.lock").open("w") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            self.run_backup(success=False)
        self.assertTrue((self.p / "active").exists())
        self.assertFalse(any(c[:2] == ["systemctl", "stop"] for c in self.calls()))
        self.assertEqual(self.snapshots(), [])

    def test_restore_test_downloads_files_and_uses_only_temporary_database(self):
        self.run_backup()
        self.run_backup("--verify")
        self.assertTrue((self.p / "state/last-verified").exists())
        self.assertFalse((self.p / "test-db").exists())
        self.assertEqual(list((self.p / "state").glob("restore-test.*")), [])
        self.assertTrue((self.p / "active").exists())

    def test_failed_restore_cleans_temporary_db_and_files(self):
        self.run_backup()
        self.run_backup("--verify", fail="restore-db", success=False)
        self.assertFalse((self.p / "state/last-verified").exists())
        self.assertFalse((self.p / "test-db").exists())
        self.assertEqual(list((self.p / "state").glob("restore-test.*")), [])
        self.assertTrue((self.p / "active").exists())

    def test_recover_restarts_a_paused_backend(self):
        (self.p / "active").unlink()
        (self.p / "state/backend-paused").touch()
        self.run_backup("--recover")
        self.assertTrue((self.p / "active").exists())
        self.assertFalse((self.p / "state/backend-paused").exists())

    def test_failed_resume_keeps_marker_for_recovery(self):
        self.run_backup(fail="start", success=False)
        self.assertTrue((self.p / "state/backend-paused").exists())
        self.assertEqual(self.snapshots(), [])
        self.run_backup("--recover")
        self.assertTrue((self.p / "active").exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)

"""Integration tests using local Git and temporary production directories.

Network, builds, PostgreSQL and systemd are replaced by test doubles. Only the
fixture copies of the scripts have their privilege guards/absolute paths changed.
No real service, database or /opt directory is touched.
"""
from pathlib import Path
import os
import shutil
import subprocess
import tempfile
import unittest
import zipfile

OPS = Path(__file__).resolve().parents[1]


class DeployTest(unittest.TestCase):
    def run_cmd(self, *args, cwd=None, check=True, env=None):
        return subprocess.run(args, cwd=cwd, env=env, text=True, capture_output=True, check=check)

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="piccola-deploy-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.repo, self.seed = self.root / "repo", self.root / "seed"
        self.base, self.web = self.root / "opt/piccola", self.root / "www/piccola"
        self.backups = self.root / "backups"
        self.conf, self.events = self.root / "deploy.conf", self.root / "events"
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.driver, self.publisher = self.bin / "piccola-deploy", self.bin / "piccola-publish"
        self.replacements = {
            "/etc/piccola-deploy.conf": str(self.conf),
            "/opt/piccola": str(self.base),
            "/var/www/piccola": str(self.web),
            "/var/backups/piccola/deploy": str(self.backups),
            "/usr/local/libexec/piccola-publish": str(self.publisher),
            "/usr/local/bin/piccola-deploy": str(self.driver),
            "/run/lock/piccola-publish.lock": str(self.root / "publish.lock"),
        }
        rendered = {}
        for name, destination in (("piccola-deploy.sh", self.driver), ("piccola-publish.sh", self.publisher)):
            text = (OPS / name).read_text()
            for old, new in self.replacements.items():
                text = text.replace(old, new)
            text = "\n".join(line for line in text.splitlines() if not line.startswith("[[ $EUID")) + "\n"
            text = text.replace("export PATH=/usr/local", f"export PATH={self.bin}:/usr/local")
            destination.write_text(text)
            destination.chmod(0o755)
            rendered[name] = text

        fake = f'''#!/usr/bin/env python3
from pathlib import Path
import os,sys,subprocess
root=Path({str(self.root)!r})
name=Path(sys.argv[0]).name
args=sys.argv[1:]
with (root/'events').open('a') as out: out.write(name+' '+ ' '.join(args)+'\\n')
if name=='sudo':
    if args==['-v']: sys.exit(0)
    os.execv(args[0],args)
if name=='install':
    filtered=[]; i=0
    while i<len(args):
        if args[i] in ('-o','-g'): i+=2
        else: filtered.append(args[i]); i+=1
    sys.exit(subprocess.call(['/usr/bin/install',*filtered]))
if name=='rsync':
    sys.exit(subprocess.call(['/usr/bin/rsync',*[a for a in args if not a.startswith('--chown=')]]))
if name=='curl':
    current=root/'opt/piccola/deploy-state/current/.commit'
    failed=root/'bad-commit'
    print('503' if failed.exists() and current.exists() and failed.read_text().strip()==current.read_text().strip() else '200',end='')
elif name=='runuser':
    if (root/'dump-fails').exists(): sys.exit(17)
    print('test dump')
elif name=='npm' and args[:2]==['run','build']:
    target=Path('dist');target.mkdir(exist_ok=True)
    (target/'index.html').write_text(Path('frontend.txt').read_text())
'''
        for name in ("sudo", "install", "rsync", "curl", "runuser", "pg_restore", "systemctl", "nginx", "sleep", "journalctl", "npm"):
            path = self.bin / name
            path.write_text(fake)
            path.chmod(0o755)
        self.env = os.environ | {"PATH": str(self.bin) + ":" + os.environ["PATH"]}
        remote = self.root / "remote.git"
        self.run_cmd("git", "init", "--bare", "--initial-branch=main", str(remote))
        self.run_cmd("git", "init", "--initial-branch=main", str(self.seed))
        self.run_cmd("git", "config", "user.email", "test@example.invalid", cwd=self.seed)
        self.run_cmd("git", "config", "user.name", "Deployment Test", cwd=self.seed)
        (self.seed / "ops").mkdir()
        for name, text in rendered.items(): (self.seed / "ops" / name).write_text(text)
        (self.seed / "frontend").mkdir()
        (self.seed / "frontend/frontend.txt").write_text("new frontend")
        (self.seed / "backend").mkdir()
        (self.seed / "backend/backend.txt").write_text("new backend")
        (self.seed / "backend/mvnw").write_text(f'''#!/usr/bin/env bash
set -e
[[ ! -f '{self.root}/build-fails' ]] || exit 23
mkdir -p target
python3 - <<'PY'
from pathlib import Path
from zipfile import ZipFile
with ZipFile('target/app.jar','w') as z: z.writestr('version',Path('backend.txt').read_text())
PY
''')
        (self.seed / ".gitignore").write_text("dist/\ntarget/\n")
        self.commit("initial")
        self.run_cmd("git", "remote", "add", "origin", str(remote), cwd=self.seed)
        self.run_cmd("git", "push", "-u", "origin", "main", cwd=self.seed)
        self.run_cmd("git", "clone", str(remote), str(self.repo))
        self.conf.write_text(f"PICCOLA_REPO='{self.repo}'\nPICCOLA_JAVA_HOME=/usr\nPICCOLA_API_URL=https://piccolaarteatelier.com.br/api/\n")
        (self.base / "backend").mkdir(parents=True)
        with zipfile.ZipFile(self.base / "backend/app.jar", "w") as z: z.writestr("version", "old backend")
        self.web.mkdir(parents=True)
        (self.web / "index.html").write_text("old frontend")
        (self.root / "uploads").mkdir()
        (self.root / "uploads/photo.jpg").write_bytes(b"photo must survive")

    def commit(self, message):
        self.run_cmd("git", "add", ".", cwd=self.seed)
        self.run_cmd("git", "commit", "-m", message, cwd=self.seed)
        return self.run_cmd("git", "rev-parse", "HEAD", cwd=self.seed).stdout.strip()

    def push_change(self, path, text):
        (self.seed / path).write_text(text)
        commit = self.commit("change")
        self.run_cmd("git", "push", cwd=self.seed)
        return commit

    def deploy(self, *args, good=True):
        result = self.run_cmd("bash", str(self.driver), *args, env=self.env, check=False)
        if good: self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        else: self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        return result

    def current(self):
        return (self.base / "deploy-state/current").resolve()

    def test_initial_deploy_and_same_commit_noop(self):
        self.deploy()
        self.assertTrue(self.web.is_symlink())
        self.assertEqual((self.web / "index.html").read_text(), "new frontend")
        self.assertTrue(list(self.backups.glob("*.dump")))
        previous = self.current()
        self.events.write_text("")
        result = self.deploy()
        self.assertIn("Já publicado", result.stdout)
        self.assertEqual(previous, self.current())
        self.assertNotIn("npm", self.events.read_text())
        self.assertEqual((self.root / "uploads/photo.jpg").read_bytes(), b"photo must survive")

    def test_frontend_only_does_not_build_or_restart_backend(self):
        self.deploy()
        self.push_change("frontend/frontend.txt", "frontend two")
        self.events.write_text("")
        self.deploy()
        self.assertEqual((self.web / "index.html").read_text(), "frontend two")
        self.assertNotIn("systemctl restart", self.events.read_text())
        with zipfile.ZipFile(self.current() / "backend/app.jar") as z: self.assertEqual(z.read("version"), b"new backend")

    def test_backend_only_reuses_frontend(self):
        self.deploy()
        self.push_change("backend/backend.txt", "backend two")
        self.events.write_text("")
        self.deploy()
        self.assertNotIn("npm", self.events.read_text())
        self.assertIn("systemctl restart", self.events.read_text())
        self.assertEqual((self.web / "index.html").read_text(), "new frontend")

    def test_build_failure_keeps_published_version(self):
        self.deploy()
        previous = self.current()
        self.push_change("backend/backend.txt", "broken backend")
        (self.root / "build-fails").touch()
        self.events.write_text("")
        self.deploy(good=False)
        self.assertEqual(previous, self.current())
        self.assertNotIn("systemctl restart", self.events.read_text())

    def test_dump_failure_does_not_migrate_initial_site(self):
        (self.root / "dump-fails").touch()
        self.deploy(good=False)
        self.assertFalse(self.web.is_symlink())
        self.assertEqual((self.web / "index.html").read_text(), "old frontend")
        self.assertFalse((self.base / "deploy-state/current").exists())

    def test_health_failure_restores_previous_code(self):
        self.deploy()
        previous = self.current()
        bad = self.push_change("backend/backend.txt", "unhealthy backend")
        (self.root / "bad-commit").write_text(bad)
        result = self.deploy(good=False)
        self.assertEqual(previous, self.current())
        self.assertIn("Código anterior restaurado", result.stderr)

    def test_manual_rollback_and_force(self):
        self.deploy()
        initial = self.current()
        self.push_change("frontend/frontend.txt", "frontend two")
        self.deploy()
        self.deploy("--rollback")
        self.assertEqual(initial, self.current())
        self.deploy("--force")
        self.assertEqual((self.web / "index.html").read_text(), "frontend two")

    def test_dirty_clone_is_not_discarded(self):
        (self.repo / "frontend/frontend.txt").write_text("uncommitted")
        self.deploy(good=False)
        self.assertEqual((self.repo / "frontend/frontend.txt").read_text(), "uncommitted")
        self.assertFalse(self.web.is_symlink())


if __name__ == "__main__":
    unittest.main(verbosity=2)

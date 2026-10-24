import hashlib
import os
from pathlib import Path as path
import subprocess
import tempfile


installer = path(__file__).resolve().parents[1] / 'install'
binary = b'#!/usr/bin/env bash\nprintf "%s\\n" "deepthroat v0.1.8"\n'


def executable(file, text):
    file.write_text(text, encoding='utf-8')
    file.chmod(0o755)


with tempfile.TemporaryDirectory(prefix='deepthroat-installer-') as folder:
    root = path(folder)
    tools = root / 'tools'
    tools.mkdir()
    executable(tools / 'uname', '#!/usr/bin/env bash\nif [[ "$1" = -s ]]; then printf "%s\\n" "${fixtureos:-Linux}"; else printf "%s\\n" "${fixturearch:-x86_64}"; fi\n')
    executable(tools / 'getconf', '#!/usr/bin/env bash\n[[ "${fixturemode:-ok}" != musl ]] || exit 1\nprintf "%s\\n" "glibc 2.39"\n')
    executable(tools / 'curl', '''#!/usr/bin/env python3
import hashlib,os,sys
from pathlib import Path as path
args=sys.argv[1:]
url=next(value for value in args if value.startswith('https://'))
if url.endswith('/latest'):
    print('https://github.com/variablepy/deepthroat-cli/releases/tag/v0.1.8',end='')
    sys.exit(0)
output=path(args[args.index('-o')+1])
binary=b'#!/usr/bin/env bash\\nprintf "%s\\\\n" "deepthroat v0.1.8"\\n'
mode=os.environ.get('fixturemode','ok')
if url.endswith('/SHA256SUMS'):
    names=['deepthroat-linux-x64','deepthroat-linux-arm64']
    lines=[hashlib.sha256(binary).hexdigest()+'  '+name+'\\n' for name in names]
    if mode=='duplicate':lines+=lines
    if mode=='missing':lines=[]
    output.write_text(''.join(lines))
else:
    expected='arm64' if os.environ.get('fixturearch')=='aarch64' else 'x64'
    assert url.endswith('/deepthroat-linux-'+expected)
    output.write_bytes(binary if mode!='corrupt' else b'corrupted')
''')
    environment = dict(os.environ, PATH=str(tools) + os.pathsep + os.environ['PATH'])
    directory = root / 'install with spaces' / 'bin'
    for architecture in ('x86_64', 'aarch64'):
        for attempt in range(2):
            result = subprocess.run(['bash', str(installer), '--directory', str(directory)], env=dict(environment, fixturearch=architecture), capture_output=True, text=True)
            assert result.returncode == 0, result.stderr
            assert (directory / 'deepthroat').read_bytes() == binary
    for mode in ('corrupt', 'missing', 'duplicate', 'musl'):
        result = subprocess.run(['bash', str(installer), '--version', 'v0.1.8', '--directory', str(directory)], env=dict(environment, fixturemode=mode), capture_output=True, text=True)
        assert result.returncode != 0, mode
        assert (directory / 'deepthroat').read_bytes() == binary
    for options, overrides in ((['--version', '../bad'], {}), (['--version'], {}), (['--unknown'], {}), (['--directory', 'relative'], {}), ([], {'fixturearch': 'riscv64'}), ([], {'fixtureos': 'Darwin'})):
        result = subprocess.run(['bash', str(installer), *options], env=dict(environment, **overrides), capture_output=True)
        assert result.returncode != 0, options
    link = root / 'linked'
    link.mkdir()
    (link / 'deepthroat').symlink_to(directory / 'deepthroat')
    source = root / 'source'
    source.write_bytes(binary)
    source.chmod(0o755)
    result = subprocess.run(['bash', str(installer), '--binary', str(source), '--directory', str(link)], env=environment, capture_output=True)
    assert result.returncode != 0 and (link / 'deepthroat').is_symlink()
    result = subprocess.run(['bash', str(installer), '--binary', str(source), '--directory', str(directory)], env=environment, capture_output=True)
    assert result.returncode == 0 and (directory / 'deepthroat').read_bytes() == binary
print('Linux installer passed: x64/ARM64 detection, reinstall, paths with spaces, corruption/missing/duplicate checksums, invalid flags, unsupported systems and symlink preservation')

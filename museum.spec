# -*- mode: python ; coding: utf-8 -*-

import sys
import os

block_cipher = None

def find_mediapipe_dll():
    import mediapipe
    mp_path = os.path.dirname(mediapipe.__file__)
    dll_name = 'libmediapipe.dll' if sys.platform == 'win32' else 'libmediapipe.so'
    dll_path = os.path.join(mp_path, 'tasks', 'c', dll_name)
    if os.path.exists(dll_path):
        return dll_path
    return None

mediapipe_dll = find_mediapipe_dll()
binaries_list = []
if mediapipe_dll:
    binaries_list.append((mediapipe_dll, 'mediapipe/tasks/c'))

a = Analysis(
    ['backend/app.py'],
    pathex=[],
    binaries=binaries_list,
    datas=[
        ('dist', 'static'),
        ('models', 'models'),
        ('dynamic_gestures/models', 'dynamic_gestures/models'),
        ('dynamic_gestures/utils', 'dynamic_gestures/utils'),
        ('dynamic_gestures/__init__.py', 'dynamic_gestures'),
        ('dynamic_gestures/onnx_models.py', 'dynamic_gestures'),
        ('public', 'public'),
        ('backend/data', 'backend/data'),
        ('.env', '.'),
    ],
    hiddenimports=[
        'flask',
        'flask_cors',
        'eventlet',
        'eventlet.wsgi',
        'eventlet.hubs',
        'eventlet.hubs.epolls',
        'eventlet.hubs.poll',
        'eventlet.hubs.selects',
        'eventlet.hubs.hub',
        'socketio',
        'socketio.server',
        'cv2',
        'numpy',
        'mediapipe',
        'mediapipe.tasks',
        'mediapipe.tasks.python',
        'mediapipe.tasks.python.vision',
        'mediapipe.tasks.c',
        'onnxruntime',
        'PIL',
        'scipy',
        'scipy.ndimage',
        'requests',
        'dotenv',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'PyQt5',
        'PyQt6',
        'PySide2',
        'PySide6',
        'tkinter',
        'jupyter',
        'jupyterlab',
        'notebook',
        'IPython',
        'ipykernel',
        'ipywidgets',
        'sphinx',
        'docutils',
        'nbconvert',
        'nbformat',
        'pandas',
        'sklearn',
        'scikit-learn',
        'bokeh',
        'plotly',
        'statsmodels',
        'sympy',
        'h5py',
        'tables',
        'sqlalchemy',
        'gevent',
        'pytest',
        'pyarrow',
        'xarray',
        'patsy',
        'openpyxl',
        'xlrd',
        'xlwt',
        'fsspec',
        's3fs',
        'gcsfs',
        'dask',
        'distributed',
        'prefect',
        'airflow',
        'celery',
        'kombu',
        'billiard',
        'win32com',
        'pythoncom',
        'pywintypes',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='Museum3D',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    name='Museum3D',
)

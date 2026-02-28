import { spawn } from 'child_process'
import { platform } from 'os'
import { existsSync } from 'fs'

const isWindows = platform() === 'win32'

const CONDA_ENV_PATH = 'D:\\Anaconda\\envs\\dynamic'
const PYTHON_PATH = isWindows 
  ? `${CONDA_ENV_PATH}\\python.exe`
  : `${CONDA_ENV_PATH}/bin/python`

function startBackend() {
  console.log('[Backend] Starting backend server...')
  
  const pythonExe = existsSync(PYTHON_PATH) ? PYTHON_PATH : 'python'
  console.log(`[Backend] Using Python: ${pythonExe}`)
  
  const backend = spawn(
    pythonExe,
    ['backend/app.py'],
    {
      cwd: process.cwd(),
      env: { 
        ...process.env, 
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1'
      },
      stdio: 'inherit'
    }
  )
  
  backend.on('error', (err) => {
    console.error('[Backend] Failed to start:', err)
  })
  
  backend.on('exit', (code) => {
    console.log(`[Backend] Process exited with code ${code}`)
  })
  
  return backend
}

function startFrontend() {
  console.log('[Frontend] Starting Vite dev server...')
  
  const frontend = spawn(
    'npm',
    ['run', 'dev'],
    {
      cwd: process.cwd(),
      shell: true,
      stdio: 'inherit'
    }
  )
  
  frontend.on('error', (err) => {
    console.error('[Frontend] Failed to start:', err)
  })
  
  frontend.on('exit', (code) => {
    console.log(`[Frontend] Process exited with code ${code}`)
  })
  
  return frontend
}

const backendProcess = startBackend()
const frontendProcess = startFrontend()

process.on('SIGINT', () => {
  console.log('\n[Main] Shutting down...')
  backendProcess.kill()
  frontendProcess.kill()
  process.exit(0)
})

process.on('SIGTERM', () => {
  backendProcess.kill()
  frontendProcess.kill()
  process.exit(0)
})

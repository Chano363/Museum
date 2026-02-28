import { spawn } from 'child_process'
import { platform } from 'os'
import { existsSync } from 'fs'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env') })

const isWindows = platform() === 'win32'

function getPythonPath() {
  if (process.env.PYTHON_PATH) {
    return process.env.PYTHON_PATH
  }
  
  if (isWindows) {
    const condaEnvName = process.env.CONDA_ENV_NAME || 'dynamic'
    const condaPrefix = process.env.CONDA_PREFIX || 'D:\\Anaconda\\envs'
    const condaPath = `${condaPrefix}\\${condaEnvName}`
    const pythonExe = `${condaPath}\\python.exe`
    if (existsSync(pythonExe)) {
      return pythonExe
    }
  }
  
  return isWindows ? 'python' : 'python3'
}

const PYTHON_PATH = getPythonPath()

function logConfig() {
  console.log('[Config] Environment configuration:')
  console.log(`[Config]   CONDA_ENV_NAME: ${process.env.CONDA_ENV_NAME || 'dynamic (default)'}`)
  console.log(`[Config]   CONDA_PREFIX: ${process.env.CONDA_PREFIX || 'D:\\Anaconda\\envs (default)'}`)
  console.log(`[Config]   PYTHON_PATH: ${process.env.PYTHON_PATH || 'not set (auto-detect)'}`)
  console.log(`[Config]   Resolved Python: ${PYTHON_PATH}`)
}

function startBackend() {
  console.log('[Backend] Starting backend server...')
  console.log(`[Backend] Using Python: ${PYTHON_PATH}`)
  
  const backend = spawn(
    PYTHON_PATH,
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

logConfig()

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

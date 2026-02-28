import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

console.log('=======================================');
console.log('  Museum 3D Exhibition System');
console.log('  Network Server Starter');
console.log('=======================================');
console.log('');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cloudflaredPath = path.join(__dirname, 'cloudflared.exe');
if (!fs.existsSync(cloudflaredPath)) {
    console.error('❌ cloudflared.exe not found!');
    console.error('Please download cloudflared from https://github.com/cloudflare/cloudflared/releases');
    console.error('and place it in the project root directory');
    process.exit(1);
}

const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    console.error('Please create .env file based on .env.example');
    process.exit(1);
}

console.log('✅ Environment check passed');
console.log('');

console.log('🚀 Starting backend service...');
const backend = spawn('python', ['backend/app.py'], {
    env: { ...process.env, PORT: '5000' },
    stdio: 'inherit'
});

backend.on('error', (err) => {
    console.error('❌ Backend error:', err);
});

setTimeout(() => {
    console.log('');
    console.log('🚀 Starting frontend service...');
    const frontend = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        shell: true
    });

    frontend.on('error', (err) => {
        console.error('❌ Frontend error:', err);
    });

    setTimeout(() => {
        console.log('');
        console.log('🚀 Starting Cloudflare Tunnel for frontend...');
        const frontendTunnel = spawn(cloudflaredPath, ['tunnel', '--url', 'http://localhost:3002'], {
            stdio: ['inherit', 'pipe', 'inherit']
        });

        let frontendUrl = '';
        let backendUrl = '';

        frontendTunnel.stdout.on('data', (data) => {
            const output = data.toString();
            const match = output.match(/https:\/\/[^\s]+\.trycloudflare\.com/);
            if (match && !frontendUrl) {
                frontendUrl = match[0];
                console.log(`✅ Frontend tunnel established: ${frontendUrl}`);
            }
        });

        frontendTunnel.on('error', (err) => {
            console.error('❌ Frontend tunnel error:', err);
        });

        setTimeout(() => {
            console.log('');
            console.log('🚀 Starting Cloudflare Tunnel for backend...');
            const backendTunnel = spawn(cloudflaredPath, ['tunnel', '--url', 'http://localhost:5000'], {
                stdio: ['inherit', 'pipe', 'inherit']
            });

            backendTunnel.stdout.on('data', (data) => {
                const output = data.toString();
                const match = output.match(/https:\/\/[^\s]+\.trycloudflare\.com/);
                if (match && !backendUrl) {
                    backendUrl = match[0];
                    console.log(`✅ Backend tunnel established: ${backendUrl}`);
                }
            });

            backendTunnel.on('error', (err) => {
                console.error('❌ Backend tunnel error:', err);
            });

            const checkUrls = () => {
                if (frontendUrl && backendUrl) {
                    console.log('');
                    console.log('=======================================');
                    console.log('  ✅ All services started successfully!');
                    console.log('=======================================');
                    console.log('');
                    console.log('🔗 Complete Access URL (Copy this):');
                    console.log('');
                    console.log(`${frontendUrl}/?backend=${backendUrl}`);
                    console.log('');
                    console.log('📡 Local Services:');
                    console.log('   Frontend: http://localhost:3002');
                    console.log('   Backend: http://localhost:5000');
                    console.log('');
                    console.log('=======================================');
                    console.log('  Press Ctrl+C to stop all services');
                    console.log('=======================================');
                } else {
                    setTimeout(checkUrls, 1000);
                }
            };

            setTimeout(checkUrls, 3000);

            process.on('SIGINT', () => {
                console.log('');
                console.log('🛑 Stopping services...');
                backendTunnel.kill();
                frontendTunnel.kill();
                frontend.kill();
                backend.kill();
                process.exit(0);
            });

        }, 3000);

    }, 5000);

}, 3000);
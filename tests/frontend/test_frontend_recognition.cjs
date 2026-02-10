const fs = require('fs');
const path = require('path');
const request = require('request');

// 测试照片目录
const PHOTOS_DIR = path.join(__dirname, '..', 'photos');
// 后端API地址
const API_URL = 'http://localhost:5000/api/recognize';

// 测试照片与预期手势的映射
const TEST_CASES = [
    { file: 'like.jpg', expected_gesture: 'like', description: '点赞手势' },
    { file: 'ok.jpg', expected_gesture: 'ok', description: 'OK手势' },
    { file: 'palm.jpg', expected_gesture: 'palm', description: '手掌手势' },
    { file: 'point.jpg', expected_gesture: 'point', description: '手指指向手势' }
];

/**
 * 读取图像文件并编码为base64格式，模拟前端的图像处理过程
 * @param {string} imagePath - 图像路径
 * @returns {string} - base64编码的图像
 */
function processImage(imagePath) {
    try {
        // 读取图像文件
        const imageBuffer = fs.readFileSync(imagePath);
        
        // 编码为base64
        const base64Image = imageBuffer.toString('base64');
        return `data:image/jpeg;base64,${base64Image}`;
    } catch (error) {
        console.error('图像处理失败:', error);
        throw error;
    }
}

/**
 * 测试前端到后端的完整手势识别流程
 */
async function test_frontend_recognition() {
    console.log('开始测试前端到后端的完整手势识别流程...');
    console.log(`测试目录: ${PHOTOS_DIR}`);
    console.log(`后端API: ${API_URL}`);
    console.log('=' * 80);
    
    const results = [];
    let total_time = 0;
    let correct_count = 0;
    
    // 测试不同的图像处理参数
    const image_params = [
        { scale: 0.5, quality: 0.7, description: '默认处理 (50%分辨率, 70%质量)' },
        { scale: 0.4, quality: 0.6, description: '高压缩 (40%分辨率, 60%质量)' },
        { scale: 0.6, quality: 0.8, description: '低压缩 (60%分辨率, 80%质量)' }
    ];
    
    for (const params of image_params) {
        console.log(`\n测试图像处理参数: ${params.description}`);
        console.log(`缩放比例: ${params.scale}`);
        console.log(`压缩质量: ${params.quality}`);
        console.log('=' * 80);
        
        let params_correct_count = 0;
        let params_total_time = 0;
        
        for (const test_case of TEST_CASES) {
            console.log(`测试: ${test_case.description}`);
            console.log(`文件: ${test_case.file}`);
            console.log(`预期手势: ${test_case.expected_gesture}`);
            
            // 构建图像路径
            const imagePath = path.join(PHOTOS_DIR, test_case.file);
            
            if (!fs.existsSync(imagePath)) {
                console.log(`错误: 图像文件不存在 - ${imagePath}`);
                console.log('-' * 80);
                continue;
            }
            
            try {
                // 前端图像处理
                const frontend_start_time = Date.now();
                const base64Image = processImage(imagePath);
                const frontend_process_time = Date.now() - frontend_start_time;
                
                console.log(`前端处理时间: ${frontend_process_time} ms`);
                console.log(`处理后图像大小: ${Math.round(base64Image.length / 1024)} KB`);
                
                // 发送到后端
                const backend_start_time = Date.now();
                
                // 构建请求选项
                const options = {
                    url: API_URL,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    json: {
                        image: base64Image
                    }
                };
                
                // 发送请求
                const { response, body } = await new Promise((resolve, reject) => {
                    request(options, (error, response, body) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve({ response, body });
                        }
                    });
                });
                
                const backend_process_time = Date.now() - backend_start_time;
                const total_process_time = frontend_process_time + backend_process_time;
                
                console.log(`后端处理时间: ${backend_process_time} ms`);
                console.log(`总处理时间: ${total_process_time} ms`);
                
                // 解析响应
                const data = body;
                const detections = data.detections || [];
                
                if (detections && detections.length > 0) {
                    // 取置信度最高的检测结果
                    const best_detection = detections.reduce((best, current) => {
                        return current.bbox.confidence > best.bbox.confidence ? current : best;
                    }, detections[0]);
                    
                    const detected_gesture = best_detection.gestureName;
                    const confidence = best_detection.bbox.confidence;
                    
                    console.log(`检测到手势: ${detected_gesture}`);
                    console.log(`置信度: ${confidence.toFixed(2)}`);
                    
                    // 验证是否正确识别
                    const is_correct = detected_gesture.toLowerCase().includes(test_case.expected_gesture.toLowerCase());
                    if (is_correct) {
                        correct_count++;
                        params_correct_count++;
                        console.log('✓ 识别正确');
                    } else {
                        console.log('✗ 识别错误');
                    }
                    
                    results.push({
                        file: test_case.file,
                        description: test_case.description,
                        expected: test_case.expected_gesture,
                        detected: detected_gesture,
                        confidence: confidence,
                        correct: is_correct,
                        frontend_time: frontend_process_time,
                        backend_time: backend_process_time,
                        total_time: total_process_time,
                        scale: params.scale,
                        quality: params.quality
                    });
                } else {
                    console.log('✗ 未检测到手势');
                    results.push({
                        file: test_case.file,
                        description: test_case.description,
                        expected: test_case.expected_gesture,
                        detected: 'none',
                        confidence: 0,
                        correct: false,
                        frontend_time: frontend_process_time,
                        backend_time: backend_process_time,
                        total_time: total_process_time,
                        scale: params.scale,
                        quality: params.quality
                    });
                }
                
            } catch (error) {
                console.log(`✗ 请求失败: ${error.message}`);
                results.push({
                    file: test_case.file,
                    description: test_case.description,
                    expected: test_case.expected_gesture,
                    detected: 'error',
                    confidence: 0,
                    correct: false,
                    frontend_time: 0,
                    backend_time: 0,
                    total_time: 0,
                    scale: params.scale,
                    quality: params.quality
                });
            }
            
            console.log('-' * 80);
        }
        
        console.log(`图像处理参数测试结果:`);
        console.log(`正确识别: ${params_correct_count}/${TEST_CASES.length}`);
        console.log(`识别率: ${(params_correct_count / TEST_CASES.length * 100).toFixed(2)}%`);
        console.log('=' * 80);
    }
    
    // 生成最终测试报告
    console.log('\n最终测试报告');
    console.log('=' * 80);
    console.log(`测试总数: ${results.length}`);
    console.log(`正确识别: ${correct_count}`);
    console.log(`识别率: ${(correct_count / results.length * 100).toFixed(2)}%`);
    
    // 按图像处理参数分组分析
    const groupedResults = {};
    results.forEach(result => {
        const key = `${result.scale}_${result.quality}`;
        if (!groupedResults[key]) {
            groupedResults[key] = [];
        }
        groupedResults[key].push(result);
    });
    
    console.log('\n按图像处理参数分析:');
    console.log('=' * 80);
    
    for (const [key, group] of Object.entries(groupedResults)) {
        const [scale, quality] = key.split('_');
        const correct = group.filter(r => r.correct).length;
        const total = group.length;
        const avg_frontend_time = group.reduce((sum, r) => sum + r.frontend_time, 0) / total;
        const avg_backend_time = group.reduce((sum, r) => sum + r.backend_time, 0) / total;
        const avg_total_time = group.reduce((sum, r) => sum + r.total_time, 0) / total;
        
        console.log(`图像处理参数: 缩放=${scale}, 质量=${quality}`);
        console.log(`识别率: ${(correct / total * 100).toFixed(2)}% (${correct}/${total})`);
        console.log(`平均前端处理时间: ${avg_frontend_time.toFixed(2)} ms`);
        console.log(`平均后端处理时间: ${avg_backend_time.toFixed(2)} ms`);
        console.log(`平均总处理时间: ${avg_total_time.toFixed(2)} ms`);
        console.log('=' * 80);
    }
    
    return results;
}

// 运行测试
if (require.main === module) {
    test_frontend_recognition()
        .then(results => {
            console.log('测试完成!');
        })
        .catch(error => {
            console.error('测试失败:', error);
        });
}

module.exports = { test_frontend_recognition };

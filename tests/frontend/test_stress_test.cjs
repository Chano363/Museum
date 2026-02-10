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
 * 读取图像文件并编码为base64格式
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
 * 测试单次手势识别
 * @param {string} imagePath - 图像路径
 * @param {Object} testCase - 测试用例
 * @returns {Promise<Object>} - 测试结果
 */
async function testSingleRecognition(imagePath, testCase) {
    return new Promise((resolve) => {
        try {
            // 前端图像处理
            const frontendStartTime = Date.now();
            const base64Image = processImage(imagePath);
            const frontendProcessTime = Date.now() - frontendStartTime;
            
            // 发送到后端
            const backendStartTime = Date.now();
            
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
            request(options, (error, response, body) => {
                const backendProcessTime = Date.now() - backendStartTime;
                const totalProcessTime = frontendProcessTime + backendProcessTime;
                
                if (error) {
                    console.log(`✗ 请求失败: ${error.message}`);
                    resolve({
                        file: testCase.file,
                        description: testCase.description,
                        expected: testCase.expected_gesture,
                        detected: 'error',
                        confidence: 0,
                        correct: false,
                        frontendTime: frontendProcessTime,
                        backendTime: backendProcessTime,
                        totalTime: totalProcessTime,
                        error: error.message
                    });
                } else if (body && body.detections && body.detections.length > 0) {
                    // 取置信度最高的检测结果
                    const bestDetection = body.detections.reduce((best, current) => {
                        return current.bbox.confidence > best.bbox.confidence ? current : best;
                    }, body.detections[0]);
                    
                    const detectedGesture = bestDetection.gestureName;
                    const confidence = bestDetection.bbox.confidence;
                    
                    // 验证是否正确识别
                    const isCorrect = detectedGesture.toLowerCase().includes(testCase.expected_gesture.toLowerCase());
                    
                    resolve({
                        file: testCase.file,
                        description: testCase.description,
                        expected: testCase.expected_gesture,
                        detected: detectedGesture,
                        confidence: confidence,
                        correct: isCorrect,
                        frontendTime: frontendProcessTime,
                        backendTime: backendProcessTime,
                        totalTime: totalProcessTime
                    });
                } else {
                    console.log('✗ 未检测到手势');
                    resolve({
                        file: testCase.file,
                        description: testCase.description,
                        expected: testCase.expected_gesture,
                        detected: 'none',
                        confidence: 0,
                        correct: false,
                        frontendTime: frontendProcessTime,
                        backendTime: backendProcessTime,
                        totalTime: totalProcessTime
                    });
                }
            });
        } catch (error) {
            console.log(`✗ 处理失败: ${error.message}`);
            resolve({
                file: testCase.file,
                description: testCase.description,
                expected: testCase.expected_gesture,
                detected: 'error',
                confidence: 0,
                correct: false,
                frontendTime: 0,
                backendTime: 0,
                totalTime: 0,
                error: error.message
            });
        }
    });
}

/**
 * 运行压力测试
 * @param {number} iterations - 迭代次数
 * @param {number} fps - 目标帧率
 */
async function runStressTest(iterations, fps) {
    console.log('开始压力测试...');
    console.log(`测试配置: ${iterations}次迭代, 目标帧率: ${fps} FPS`);
    console.log(`测试目录: ${PHOTOS_DIR}`);
    console.log(`后端API: ${API_URL}`);
    console.log('=' * 80);
    
    const frameInterval = 1000 / fps; // 每帧间隔时间
    const results = [];
    let totalProcessingTime = 0;
    let totalFrames = 0;
    let correctCount = 0;
    let errorCount = 0;
    let noDetectionCount = 0;
    
    // 记录开始时间
    const startTime = Date.now();
    
    // 运行压力测试
    for (let i = 0; i < iterations; i++) {
        console.log(`\n迭代 ${i + 1}/${iterations}`);
        console.log('-' * 60);
        
        // 随机选择一张图片进行测试
        const randomIndex = Math.floor(Math.random() * TEST_CASES.length);
        const testCase = TEST_CASES[randomIndex];
        const imagePath = path.join(PHOTOS_DIR, testCase.file);
        
        if (!fs.existsSync(imagePath)) {
            console.log(`错误: 图像文件不存在 - ${imagePath}`);
            continue;
        }
        
        console.log(`测试: ${testCase.description}`);
        console.log(`文件: ${testCase.file}`);
        
        // 执行测试
        const result = await testSingleRecognition(imagePath, testCase);
        results.push(result);
        
        // 统计结果
        totalFrames++;
        totalProcessingTime += result.totalTime;
        
        if (result.correct) {
            correctCount++;
            console.log(`✓ 识别正确: ${result.detected} (${result.confidence.toFixed(2)})`);
        } else if (result.detected === 'error') {
            errorCount++;
            console.log(`✗ 请求错误: ${result.error}`);
        } else if (result.detected === 'none') {
            noDetectionCount++;
            console.log(`✗ 未检测到手势`);
        } else {
            console.log(`✗ 识别错误: 预期 ${result.expected}, 实际 ${result.detected}`);
        }
        
        console.log(`处理时间: 前端 ${result.frontendTime}ms, 后端 ${result.backendTime}ms, 总 ${result.totalTime}ms`);
        
        // 等待到目标帧间隔
        const actualInterval = Date.now() - (startTime + i * frameInterval);
        if (actualInterval < frameInterval) {
            const waitTime = frameInterval - actualInterval;
            console.log(`等待 ${waitTime.toFixed(2)}ms 以达到目标帧率`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
            console.log(`⚠️  处理时间超过目标帧间隔 ${(actualInterval - frameInterval).toFixed(2)}ms`);
        }
    }
    
    // 计算总耗时
    const totalTime = Date.now() - startTime;
    const actualFps = totalFrames / (totalTime / 1000);
    
    // 生成测试报告
    console.log('\n' + '=' * 80);
    console.log('压力测试报告');
    console.log('=' * 80);
    console.log(`总迭代次数: ${iterations}`);
    console.log(`实际处理帧数: ${totalFrames}`);
    console.log(`总耗时: ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log(`目标帧率: ${fps} FPS`);
    console.log(`实际帧率: ${actualFps.toFixed(2)} FPS`);
    console.log(`平均处理时间: ${(totalProcessingTime / totalFrames).toFixed(2)}ms/帧`);
    console.log('\n识别结果统计:');
    console.log(`正确识别: ${correctCount} (${(correctCount / totalFrames * 100).toFixed(2)}%)`);
    console.log(`识别错误: ${totalFrames - correctCount - errorCount - noDetectionCount} (${((totalFrames - correctCount - errorCount - noDetectionCount) / totalFrames * 100).toFixed(2)}%)`);
    console.log(`未检测到: ${noDetectionCount} (${(noDetectionCount / totalFrames * 100).toFixed(2)}%)`);
    console.log(`请求错误: ${errorCount} (${(errorCount / totalFrames * 100).toFixed(2)}%)`);
    
    // 按图像类型分析
    console.log('\n' + '=' * 80);
    console.log('按图像类型分析');
    console.log('=' * 80);
    
    const imageStats = {};
    results.forEach(result => {
        if (!imageStats[result.file]) {
            imageStats[result.file] = {
                count: 0,
                correct: 0,
                totalTime: 0,
                frontendTime: 0,
                backendTime: 0
            };
        }
        imageStats[result.file].count++;
        if (result.correct) {
            imageStats[result.file].correct++;
        }
        imageStats[result.file].totalTime += result.totalTime;
        imageStats[result.file].frontendTime += result.frontendTime;
        imageStats[result.file].backendTime += result.backendTime;
    });
    
    for (const [file, stats] of Object.entries(imageStats)) {
        const testCase = TEST_CASES.find(tc => tc.file === file);
        console.log(`\n图像: ${file} (${testCase?.description})`);
        console.log(`处理次数: ${stats.count}`);
        console.log(`识别率: ${(stats.correct / stats.count * 100).toFixed(2)}% (${stats.correct}/${stats.count})`);
        console.log(`平均处理时间: ${(stats.totalTime / stats.count).toFixed(2)}ms`);
        console.log(`平均前端时间: ${(stats.frontendTime / stats.count).toFixed(2)}ms`);
        console.log(`平均后端时间: ${(stats.backendTime / stats.count).toFixed(2)}ms`);
    }
    
    // 性能趋势分析
    console.log('\n' + '=' * 80);
    console.log('性能趋势分析');
    console.log('=' * 80);
    
    const batchSize = Math.max(1, Math.floor(totalFrames / 5));
    for (let i = 0; i < totalFrames; i += batchSize) {
        const batchEnd = Math.min(i + batchSize, totalFrames);
        const batchResults = results.slice(i, batchEnd);
        const batchTime = batchResults.reduce((sum, r) => sum + r.totalTime, 0) / batchResults.length;
        const batchBackendTime = batchResults.reduce((sum, r) => sum + r.backendTime, 0) / batchResults.length;
        const batchCorrect = batchResults.filter(r => r.correct).length;
        const batchAccuracy = batchCorrect / batchResults.length * 100;
        
        console.log(`批次 ${Math.floor(i / batchSize) + 1}: 平均处理时间 ${batchTime.toFixed(2)}ms, 平均后端时间 ${batchBackendTime.toFixed(2)}ms, 准确率 ${batchAccuracy.toFixed(2)}%`);
    }
    
    return {
        iterations,
        targetFps: fps,
        actualFps,
        totalTime,
        totalFrames,
        correctCount,
        errorCount,
        noDetectionCount,
        averageProcessingTime: totalProcessingTime / totalFrames,
        accuracy: correctCount / totalFrames * 100,
        results
    };
}

// 运行不同帧率的压力测试
async function runMultipleStressTests() {
    console.log('开始多组压力测试...');
    console.log('=' * 100);
    
    // 测试不同的帧率
    const fpsValues = [5, 10, 15, 20];
    const iterations = 50; // 每组测试的迭代次数
    
    const testResults = [];
    
    for (const fps of fpsValues) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`测试帧率: ${fps} FPS`);
        console.log(`${'='.repeat(80)}`);
        
        const result = await runStressTest(iterations, fps);
        testResults.push(result);
        
        // 短暂休息，让系统恢复
        console.log('\n系统休息 2 秒...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 生成综合报告
    console.log('\n' + '=' * 100);
    console.log('综合压力测试报告');
    console.log('=' * 100);
    
    console.log('\n各帧率测试结果:');
    console.log('-' * 80);
    console.log('帧率 | 实际帧率 | 准确率 | 平均处理时间 | 错误率');
    console.log('-' * 80);
    
    for (const result of testResults) {
        const errorRate = (result.errorCount / result.totalFrames) * 100;
        console.log(`${result.targetFps} FPS | ${result.actualFps.toFixed(2)} FPS | ${result.accuracy.toFixed(2)}% | ${result.averageProcessingTime.toFixed(2)}ms | ${errorRate.toFixed(2)}%`);
    }
    
    // 找出最佳配置
    const bestResult = testResults.reduce((best, current) => {
        // 优先考虑准确率，然后是实际帧率，最后是处理时间
        if (current.accuracy > best.accuracy) return current;
        if (current.accuracy === best.accuracy && current.actualFps > best.actualFps) return current;
        if (current.accuracy === best.accuracy && current.actualFps === best.actualFps && current.averageProcessingTime < best.averageProcessingTime) return current;
        return best;
    });
    
    console.log('\n' + '=' * 80);
    console.log('最佳配置推荐');
    console.log('=' * 80);
    console.log(`推荐帧率: ${bestResult.targetFps} FPS`);
    console.log(`实际帧率: ${bestResult.actualFps.toFixed(2)} FPS`);
    console.log(`准确率: ${bestResult.accuracy.toFixed(2)}%`);
    console.log(`平均处理时间: ${bestResult.averageProcessingTime.toFixed(2)}ms`);
    console.log(`错误率: ${(bestResult.errorCount / bestResult.totalFrames * 100).toFixed(2)}%`);
    
    return testResults;
}

// 运行测试
if (require.main === module) {
    runMultipleStressTests()
        .then(results => {
            console.log('\n所有压力测试完成!');
        })
        .catch(error => {
            console.error('压力测试失败:', error);
        });
}

module.exports = { runStressTest, runMultipleStressTests };
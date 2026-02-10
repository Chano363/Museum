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
 * 模拟网络延迟
 * @param {number} delay - 延迟时间(ms)
 */
async function simulateNetworkDelay(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 测试单次手势识别（带网络波动模拟）
 * @param {string} imagePath - 图像路径
 * @param {Object} testCase - 测试用例
 * @param {boolean} simulateNetworkIssues - 是否模拟网络问题
 * @returns {Promise<Object>} - 测试结果
 */
async function testSingleRecognition(imagePath, testCase, simulateNetworkIssues = false) {
    return new Promise((resolve) => {
        try {
            // 模拟网络延迟（随机）
            if (simulateNetworkIssues && Math.random() < 0.1) { // 10%概率出现网络延迟
                const randomDelay = Math.random() * 200 + 50; // 50-250ms延迟
                console.log(`⚠️  模拟网络延迟: ${randomDelay.toFixed(2)}ms`);
                setTimeout(async () => {
                    await performRecognition(imagePath, testCase, resolve, simulateNetworkIssues);
                }, randomDelay);
            } else {
                performRecognition(imagePath, testCase, resolve, simulateNetworkIssues);
            }
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
 * 执行实际的识别请求
 */
async function performRecognition(imagePath, testCase, resolve, simulateNetworkIssues) {
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
            },
            timeout: 5000 // 增加超时时间
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
}

/**
 * 并发测试函数
 * @param {number} concurrentRequests - 并发请求数
 * @param {number} duration - 测试持续时间(秒)
 */
async function runConcurrentTest(concurrentRequests, duration) {
    console.log(`\n${'='.repeat(100)}`);
    console.log(`并发测试: ${concurrentRequests}个并发请求, 持续${duration}秒`);
    console.log(`${'='.repeat(100)}`);
    
    const results = [];
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    let totalRequests = 0;
    let completedRequests = 0;
    let errorCount = 0;
    let correctCount = 0;
    let noDetectionCount = 0;
    let totalProcessingTime = 0;
    
    // 并发请求生成器
    async function generateRequests() {
        while (Date.now() < endTime) {
            totalRequests++;
            
            // 随机选择一张图片
            const randomIndex = Math.floor(Math.random() * TEST_CASES.length);
            const testCase = TEST_CASES[randomIndex];
            const imagePath = path.join(PHOTOS_DIR, testCase.file);
            
            if (!fs.existsSync(imagePath)) {
                console.log(`错误: 图像文件不存在 - ${imagePath}`);
                continue;
            }
            
            // 执行测试
            const result = await testSingleRecognition(imagePath, testCase, true);
            results.push(result);
            
            // 统计结果
            completedRequests++;
            totalProcessingTime += result.totalTime;
            
            if (result.correct) {
                correctCount++;
            } else if (result.detected === 'error') {
                errorCount++;
            } else if (result.detected === 'none') {
                noDetectionCount++;
            }
            
            // 短暂延迟，避免请求过于密集
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
    
    // 启动并发请求
    const requestPromises = [];
    for (let i = 0; i < concurrentRequests; i++) {
        requestPromises.push(generateRequests());
    }
    
    // 等待所有请求完成
    await Promise.all(requestPromises);
    
    // 计算统计数据
    const actualDuration = Date.now() - startTime;
    const throughput = completedRequests / (actualDuration / 1000); // 请求/秒
    const successRate = (completedRequests - errorCount) / completedRequests * 100;
    const accuracy = correctCount / completedRequests * 100;
    const avgProcessingTime = totalProcessingTime / completedRequests;
    
    // 生成报告
    console.log(`\n${'='.repeat(80)}`);
    console.log('并发测试报告');
    console.log('=' * 80);
    console.log(`并发请求数: ${concurrentRequests}`);
    console.log(`测试持续时间: ${(actualDuration / 1000).toFixed(2)}秒`);
    console.log(`总请求数: ${totalRequests}`);
    console.log(`完成请求数: ${completedRequests}`);
    console.log(`请求吞吐量: ${throughput.toFixed(2)}请求/秒`);
    console.log(`成功率: ${successRate.toFixed(2)}%`);
    console.log(`准确率: ${accuracy.toFixed(2)}%`);
    console.log(`平均处理时间: ${avgProcessingTime.toFixed(2)}ms/请求`);
    console.log('\n错误统计:');
    console.log(`请求错误: ${errorCount} (${(errorCount / completedRequests * 100).toFixed(2)}%)`);
    console.log(`未检测到手势: ${noDetectionCount} (${(noDetectionCount / completedRequests * 100).toFixed(2)}%)`);
    console.log(`识别错误: ${completedRequests - correctCount - errorCount - noDetectionCount} (${((completedRequests - correctCount - errorCount - noDetectionCount) / completedRequests * 100).toFixed(2)}%)`);
    
    return {
        concurrentRequests,
        duration: actualDuration / 1000,
        totalRequests,
        completedRequests,
        throughput,
        successRate,
        accuracy,
        avgProcessingTime,
        errorCount
    };
}

/**
 * 极限压力测试 - 长时间连续运行
 * @param {number} hours - 测试小时数
 */
async function runLongDurationTest(hours) {
    console.log(`\n${'='.repeat(100)}`);
    console.log(`长时间连续测试: ${hours}小时`);
    console.log(`${'='.repeat(100)}`);
    
    const results = [];
    const startTime = Date.now();
    const endTime = startTime + (hours * 60 * 60 * 1000);
    let iteration = 0;
    let totalRequests = 0;
    
    while (Date.now() < endTime) {
        iteration++;
        const elapsed = (Date.now() - startTime) / (1000 * 60); // 分钟
        
        console.log(`\n${'='.repeat(80)}`);
        console.log(`长时间测试 - 迭代 ${iteration} (已运行 ${elapsed.toFixed(1)} 分钟)`);
        console.log('=' * 80);
        
        // 随机选择测试参数
        const fps = [5, 10, 15][Math.floor(Math.random() * 3)];
        const iterations = 100;
        
        console.log(`当前配置: ${fps} FPS, ${iterations}次迭代`);
        
        // 执行测试
        const iterationResult = await runStressTest(iterations, fps, true);
        results.push(iterationResult);
        
        totalRequests += iterations;
        
        // 短暂休息
        console.log('\n系统休息 5 秒...');
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // 生成综合报告
    const actualDuration = (Date.now() - startTime) / (1000 * 60); // 分钟
    const totalCorrect = results.reduce((sum, r) => sum + r.correctCount, 0);
    const totalFrames = results.reduce((sum, r) => sum + r.totalFrames, 0);
    const totalProcessingTime = results.reduce((sum, r) => sum + r.totalProcessingTime, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
    
    console.log(`\n${'='.repeat(100)}`);
    console.log('长时间测试综合报告');
    console.log('=' * 100);
    console.log(`实际测试时间: ${actualDuration.toFixed(1)}分钟`);
    console.log(`总迭代次数: ${iteration}`);
    console.log(`总处理帧数: ${totalFrames}`);
    console.log(`总准确率: ${(totalCorrect / totalFrames * 100).toFixed(2)}%`);
    console.log(`平均处理时间: ${(totalProcessingTime / totalFrames).toFixed(2)}ms/帧`);
    console.log(`总错误率: ${(totalErrors / totalFrames * 100).toFixed(2)}%`);
    
    return {
        duration: actualDuration,
        iterations: iteration,
        totalFrames,
        accuracy: totalCorrect / totalFrames * 100,
        avgProcessingTime: totalProcessingTime / totalFrames,
        errorRate: totalErrors / totalFrames * 100
    };
}

/**
 * 运行压力测试
 * @param {number} iterations - 迭代次数
 * @param {number} fps - 目标帧率
 * @param {boolean} simulateNetworkIssues - 是否模拟网络问题
 */
async function runStressTest(iterations, fps, simulateNetworkIssues = false) {
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
        if (i % 10 === 0) {
            console.log(`\n迭代 ${i + 1}/${iterations}`);
            console.log('-' * 60);
        }
        
        // 随机选择一张图片进行测试
        const randomIndex = Math.floor(Math.random() * TEST_CASES.length);
        const testCase = TEST_CASES[randomIndex];
        const imagePath = path.join(PHOTOS_DIR, testCase.file);
        
        if (!fs.existsSync(imagePath)) {
            console.log(`错误: 图像文件不存在 - ${imagePath}`);
            continue;
        }
        
        // 执行测试
        const result = await testSingleRecognition(imagePath, testCase, simulateNetworkIssues);
        results.push(result);
        
        // 统计结果
        totalFrames++;
        totalProcessingTime += result.totalTime;
        
        if (result.correct) {
            correctCount++;
        } else if (result.detected === 'error') {
            errorCount++;
        } else if (result.detected === 'none') {
            noDetectionCount++;
        }
        
        // 等待到目标帧间隔
        const actualInterval = Date.now() - (startTime + i * frameInterval);
        if (actualInterval < frameInterval) {
            const waitTime = frameInterval - actualInterval;
            await new Promise(resolve => setTimeout(resolve, waitTime));
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
    
    return {
        iterations,
        fps,
        totalFrames,
        totalTime,
        actualFps,
        totalProcessingTime,
        correctCount,
        errorCount,
        noDetectionCount,
        accuracy: correctCount / totalFrames * 100
    };
}

/**
 * 运行极限压力测试套件
 */
async function runExtremeStressTestSuite() {
    console.log('开始极限压力测试套件...');
    console.log('=' * 120);
    
    const testResults = [];
    
    // 1. 并发测试
    console.log('\n' + '='.repeat(120));
    console.log('测试1: 并发请求测试');
    console.log('=' * 120);
    
    const concurrentLevels = [5, 10, 15, 20];
    for (const concurrency of concurrentLevels) {
        const result = await runConcurrentTest(concurrency, 60); // 每个并发级别测试60秒
        testResults.push(result);
        
        // 系统休息
        console.log('\n系统休息 10 秒...');
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    // 2. 极限帧率测试
    console.log('\n' + '='.repeat(120));
    console.log('测试2: 极限帧率测试');
    console.log('=' * 120);
    
    const extremeFpsLevels = [25, 30, 35, 40];
    for (const fps of extremeFpsLevels) {
        const result = await runStressTest(200, fps, true); // 每个帧率测试200次
        testResults.push(result);
        
        // 系统休息
        console.log('\n系统休息 5 秒...');
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // 3. 生成综合报告
    console.log('\n' + '='.repeat(120));
    console.log('极限压力测试综合报告');
    console.log('=' * 120);
    
    // 并发测试结果
    console.log('\n' + '='.repeat(80));
    console.log('并发测试结果');
    console.log('=' * 80);
    console.log('并发数 | 吞吐量(请求/秒) | 成功率 | 准确率 | 平均处理时间');
    console.log('-' * 80);
    
    testResults.filter(r => r.concurrentRequests).forEach(result => {
        console.log(`${result.concurrentRequests} | ${result.throughput.toFixed(2)} | ${result.successRate.toFixed(2)}% | ${result.accuracy.toFixed(2)}% | ${result.avgProcessingTime.toFixed(2)}ms`);
    });
    
    // 极限帧率测试结果
    console.log('\n' + '='.repeat(80));
    console.log('极限帧率测试结果');
    console.log('=' * 80);
    console.log('目标帧率 | 实际帧率 | 准确率 | 平均处理时间 | 错误率');
    console.log('-' * 80);
    
    testResults.filter(r => r.fps && r.fps >= 25).forEach(result => {
        const errorRate = (result.errorCount / result.totalFrames) * 100;
        console.log(`${result.fps} FPS | ${result.actualFps.toFixed(2)} FPS | ${result.accuracy.toFixed(2)}% | ${(result.totalProcessingTime / result.totalFrames).toFixed(2)}ms | ${errorRate.toFixed(2)}%`);
    });
    
    // 找出极限性能指标
    const maxThroughputResult = testResults.filter(r => r.throughput).reduce((max, current) => 
        current.throughput > max.throughput ? current : max
    );
    
    const maxFpsResult = testResults.filter(r => r.actualFps).reduce((max, current) => 
        current.actualFps > max.actualFps ? current : max
    );
    
    const bestAccuracyResult = testResults.reduce((best, current) => 
        current.accuracy > best.accuracy ? current : best
    );
    
    console.log('\n' + '='.repeat(100));
    console.log('极限性能指标');
    console.log('=' * 100);
    console.log(`最大吞吐量: ${maxThroughputResult.throughput.toFixed(2)} 请求/秒 (并发数: ${maxThroughputResult.concurrentRequests})`);
    console.log(`最大实际帧率: ${maxFpsResult.actualFps.toFixed(2)} FPS (目标: ${maxFpsResult.fps} FPS)`);
    console.log(`最高准确率: ${bestAccuracyResult.accuracy.toFixed(2)}%`);
    
    console.log('\n' + '=' * 120);
    console.log('极限压力测试套件完成!');
    console.log('=' * 120);
    
    return testResults;
}

// 运行测试
if (require.main === module) {
    runExtremeStressTestSuite()
        .then(results => {
            console.log('\n所有测试完成!');
        })
        .catch(error => {
            console.error('测试失败:', error);
        });
}

module.exports = { runExtremeStressTestSuite, runConcurrentTest, runLongDurationTest };
const fs = require('fs');
const path = require('path');
const request = require('request');

// 测试配置
const TEST_CONFIG = {
  testDuration: 60, // 测试持续时间（秒）
  frameInterval: 100, // 测试帧间隔（毫秒）
  testImages: [
    { file: 'like.jpg', expected_gesture: 'like', description: '点赞手势' },
    { file: 'ok.jpg', expected_gesture: 'ok', description: 'OK手势' },
    { file: 'palm.jpg', expected_gesture: 'palm', description: '手掌手势' },
    { file: 'point.jpg', expected_gesture: 'point', description: '手指指向手势' }
  ],
  backendUrl: 'http://localhost:5000/api/recognize'
};

// 测试照片目录
const PHOTOS_DIR = path.join(__dirname, '..', 'photos');

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
 * 模拟实时摄像头帧处理
 * @param {string} imagePath - 图像路径
 * @param {Object} testCase - 测试用例
 * @returns {Promise<Object>} - 测试结果
 */
async function simulateCameraFrame(imagePath, testCase) {
  return new Promise((resolve) => {
    try {
      // 模拟摄像头捕获延迟
      const captureDelay = Math.random() * 30 + 10; // 10-40ms捕获延迟
      
      setTimeout(async () => {
        // 前端图像处理
        const frontendStartTime = Date.now();
        const base64Image = processImage(imagePath);
        const frontendProcessTime = Date.now() - frontendStartTime;
        
        // 发送到后端
        const backendStartTime = Date.now();
        
        // 构建请求选项
        const options = {
          url: TEST_CONFIG.backendUrl,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          json: {
            image: base64Image
          },
          timeout: 5000
        };
        
        // 发送请求
        request(options, (error, response, body) => {
          const backendProcessTime = Date.now() - backendStartTime;
          const totalProcessTime = frontendProcessTime + backendProcessTime + captureDelay;
          
          if (error) {
            console.log(`✗ 请求失败: ${error.message}`);
            resolve({
              file: testCase.file,
              description: testCase.description,
              expected: testCase.expected_gesture,
              detected: 'error',
              confidence: 0,
              correct: false,
              captureDelay,
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
            const gestureId = bestDetection.gesture;
            
            // 验证是否正确识别
            const isCorrect = detectedGesture.toLowerCase().includes(testCase.expected_gesture.toLowerCase());
            
            resolve({
              file: testCase.file,
              description: testCase.description,
              expected: testCase.expected_gesture,
              detected: detectedGesture,
              gestureId,
              confidence,
              correct: isCorrect,
              captureDelay,
              frontendTime: frontendProcessTime,
              backendTime: backendProcessTime,
              totalTime: totalProcessTime,
              bbox: bestDetection.bbox
            });
          } else {
            console.log('✗ 未检测到手部');
            resolve({
              file: testCase.file,
              description: testCase.description,
              expected: testCase.expected_gesture,
              detected: 'none',
              confidence: 0,
              correct: false,
              captureDelay,
              frontendTime: frontendProcessTime,
              backendTime: backendProcessTime,
              totalTime: totalProcessTime
            });
          }
        });
      }, captureDelay);
    } catch (error) {
      console.log(`✗ 处理失败: ${error.message}`);
      resolve({
        file: testCase.file,
        description: testCase.description,
        expected: testCase.expected_gesture,
        detected: 'error',
        confidence: 0,
        correct: false,
        captureDelay: 0,
        frontendTime: 0,
        backendTime: 0,
        totalTime: 0,
        error: error.message
      });
    }
  });
}

/**
 * 运行实时摄像头模拟测试
 */
async function runRealtimeCameraTest() {
  console.log('开始实时摄像头模拟测试...');
  console.log('=' * 120);
  console.log(`测试配置:`);
  console.log(`- 测试持续时间: ${TEST_CONFIG.testDuration}秒`);
  console.log(`- 测试帧间隔: ${TEST_CONFIG.frameInterval}ms`);
  console.log(`- 测试图像: ${TEST_CONFIG.testImages.length}张`);
  console.log(`- 后端API: ${TEST_CONFIG.backendUrl}`);
  console.log('=' * 120);
  
  const results = [];
  const startTime = Date.now();
  const endTime = startTime + (TEST_CONFIG.testDuration * 1000);
  let frameCount = 0;
  let correctCount = 0;
  let errorCount = 0;
  let noDetectionCount = 0;
  let totalProcessingTime = 0;
  let totalCaptureDelay = 0;
  let totalFrontendTime = 0;
  let totalBackendTime = 0;
  
  // 图像识别统计
  const imageStats = {};
  TEST_CONFIG.testImages.forEach(image => {
    imageStats[image.file] = {
      count: 0,
      correct: 0,
      totalTime: 0,
      avgConfidence: 0
    };
  });
  
  console.log('\n开始测试...');
  console.log('-' * 80);
  
  while (Date.now() < endTime) {
    frameCount++;
    
    // 随机选择一张测试图像
    const randomIndex = Math.floor(Math.random() * TEST_CONFIG.testImages.length);
    const testCase = TEST_CONFIG.testImages[randomIndex];
    const imagePath = path.join(PHOTOS_DIR, testCase.file);
    
    if (!fs.existsSync(imagePath)) {
      console.log(`错误: 图像文件不存在 - ${imagePath}`);
      continue;
    }
    
    console.log(`\n测试帧 ${frameCount}`);
    console.log(`测试: ${testCase.description}`);
    console.log(`文件: ${testCase.file}`);
    
    // 执行测试
    const result = await simulateCameraFrame(imagePath, testCase);
    results.push(result);
    
    // 统计结果
    totalProcessingTime += result.totalTime;
    totalCaptureDelay += result.captureDelay;
    totalFrontendTime += result.frontendTime;
    totalBackendTime += result.backendTime;
    
    // 更新图像统计
    if (imageStats[result.file]) {
      imageStats[result.file].count++;
      if (result.correct) {
        imageStats[result.file].correct++;
      }
      imageStats[result.file].totalTime += result.totalTime;
      if (result.confidence > 0) {
        imageStats[result.file].avgConfidence += result.confidence;
      }
    }
    
    if (result.correct) {
      correctCount++;
      console.log(`✓ 识别正确: ${result.detected} (置信度: ${result.confidence.toFixed(2)})`);
    } else if (result.detected === 'error') {
      errorCount++;
      console.log(`✗ 请求错误: ${result.error}`);
    } else if (result.detected === 'none') {
      noDetectionCount++;
      console.log(`✗ 未检测到手部`);
    } else {
      console.log(`✗ 识别错误: 预期 ${result.expected}, 实际 ${result.detected}`);
    }
    
    console.log(`处理时间: 捕获 ${result.captureDelay.toFixed(2)}ms, 前端 ${result.frontendTime.toFixed(2)}ms, 后端 ${result.backendTime.toFixed(2)}ms, 总 ${result.totalTime.toFixed(2)}ms`);
    
    // 等待到下一帧
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.frameInterval));
  }
  
  // 计算统计数据
  const actualDuration = (Date.now() - startTime) / 1000;
  const fps = frameCount / actualDuration;
  const accuracy = (correctCount / frameCount) * 100;
  const avgProcessingTime = totalProcessingTime / frameCount;
  const avgCaptureDelay = totalCaptureDelay / frameCount;
  const avgFrontendTime = totalFrontendTime / frameCount;
  const avgBackendTime = totalBackendTime / frameCount;
  
  // 生成详细报告
  console.log('\n' + '='.repeat(120));
  console.log('实时摄像头测试详细报告');
  console.log('=' * 120);
  
  console.log('\n1. 测试概述');
  console.log('-' * 80);
  console.log(`测试持续时间: ${actualDuration.toFixed(2)}秒`);
  console.log(`处理帧数: ${frameCount}`);
  console.log(`实际帧率: ${fps.toFixed(2)} FPS`);
  console.log(`准确率: ${accuracy.toFixed(2)}% (${correctCount}/${frameCount})`);
  console.log(`错误率: ${(errorCount / frameCount * 100).toFixed(2)}% (${errorCount}个错误)`);
  console.log(`未检测率: ${(noDetectionCount / frameCount * 100).toFixed(2)}% (${noDetectionCount}个未检测)`);
  
  console.log('\n2. 性能指标');
  console.log('-' * 80);
  console.log(`平均总处理时间: ${avgProcessingTime.toFixed(2)}ms/帧`);
  console.log(`平均捕获延迟: ${avgCaptureDelay.toFixed(2)}ms`);
  console.log(`平均前端处理: ${avgFrontendTime.toFixed(2)}ms`);
  console.log(`平均后端处理: ${avgBackendTime.toFixed(2)}ms`);
  console.log(`性能分布: 捕获 ${(avgCaptureDelay/avgProcessingTime*100).toFixed(1)}%, 前端 ${(avgFrontendTime/avgProcessingTime*100).toFixed(1)}%, 后端 ${(avgBackendTime/avgProcessingTime*100).toFixed(1)}%`);
  
  console.log('\n3. 图像识别统计');
  console.log('-' * 80);
  console.log('图像 | 测试次数 | 正确次数 | 准确率 | 平均处理时间 | 平均置信度');
  console.log('-' * 80);
  
  for (const [file, stats] of Object.entries(imageStats)) {
    const testCase = TEST_CONFIG.testImages.find(tc => tc.file === file);
    const accuracy = stats.count > 0 ? (stats.correct / stats.count * 100) : 0;
    const avgTime = stats.count > 0 ? (stats.totalTime / stats.count) : 0;
    const avgConfidence = stats.count > 0 ? (stats.avgConfidence / stats.count) : 0;
    
    console.log(`${testCase?.description} | ${stats.count} | ${stats.correct} | ${accuracy.toFixed(2)}% | ${avgTime.toFixed(2)}ms | ${avgConfidence.toFixed(2)}`);
  }
  
  console.log('\n4. 手势识别详情');
  console.log('-' * 80);
  
  // 手势识别统计
  const gestureStats = {};
  results.forEach(result => {
    if (result.detected !== 'error' && result.detected !== 'none') {
      if (!gestureStats[result.detected]) {
        gestureStats[result.detected] = {
          count: 0,
          correct: 0,
          avgConfidence: 0
        };
      }
      gestureStats[result.detected].count++;
      if (result.correct) {
        gestureStats[result.detected].correct++;
      }
      gestureStats[result.detected].avgConfidence += result.confidence;
    }
  });
  
  console.log('检测到的手势:');
  for (const [gesture, stats] of Object.entries(gestureStats)) {
    const accuracy = (stats.correct / stats.count * 100).toFixed(2);
    const avgConfidence = (stats.avgConfidence / stats.count).toFixed(2);
    console.log(`- ${gesture}: ${stats.count}次, 准确率 ${accuracy}%, 平均置信度 ${avgConfidence}`);
  }
  
  console.log('\n5. 错误分析');
  console.log('-' * 80);
  
  // 错误类型分析
  const errorTypes = {
    '请求错误': errorCount,
    '未检测到手部': noDetectionCount,
    '识别错误': frameCount - correctCount - errorCount - noDetectionCount
  };
  
  for (const [type, count] of Object.entries(errorTypes)) {
    if (count > 0) {
      const percentage = (count / frameCount * 100).toFixed(2);
      console.log(`${type}: ${count}次 (${percentage}%)`);
    }
  }
  
  console.log('\n6. 性能趋势分析');
  console.log('-' * 80);
  
  // 按时间段分析性能
  const batchSize = Math.max(1, Math.floor(frameCount / 5));
  for (let i = 0; i < frameCount; i += batchSize) {
    const batchEnd = Math.min(i + batchSize, frameCount);
    const batchResults = results.slice(i, batchEnd);
    const batchTime = batchResults.reduce((sum, r) => sum + r.totalTime, 0) / batchResults.length;
    const batchCorrect = batchResults.filter(r => r.correct).length;
    const batchAccuracy = (batchCorrect / batchResults.length * 100).toFixed(2);
    
    console.log(`时间段 ${Math.floor(i/batchSize) + 1}: 平均处理时间 ${batchTime.toFixed(2)}ms, 准确率 ${batchAccuracy}%`);
  }
  
  console.log('\n' + '=' * 120);
  console.log('测试结论');
  console.log('=' * 120);
  
  // 生成结论
  let conclusion = '';
  if (accuracy >= 90) {
    conclusion = '🎉 实时摄像头手势识别表现优秀！';
  } else if (accuracy >= 70) {
    conclusion = '✅ 实时摄像头手势识别表现良好。';
  } else if (accuracy >= 50) {
    conclusion = '⚠️  实时摄像头手势识别表现一般，需要优化。';
  } else {
    conclusion = '❌ 实时摄像头手势识别表现较差，需要重大改进。';
  }
  
  console.log(conclusion);
  console.log(`\n关键发现:`);
  console.log(`- 准确率: ${accuracy.toFixed(2)}%`);
  console.log(`- 实际帧率: ${fps.toFixed(2)} FPS`);
  console.log(`- 平均处理时间: ${avgProcessingTime.toFixed(2)}ms/帧`);
  
  // 优化建议
  console.log('\n优化建议:');
  if (avgBackendTime > 100) {
    console.log('- 后端处理时间较长，建议优化模型或使用更强大的硬件');
  }
  if (noDetectionCount > frameCount * 0.1) {
    console.log('- 未检测率较高，建议优化手部检测算法或调整摄像头参数');
  }
  if (errorCount > 0) {
    console.log('- 存在请求错误，建议检查网络连接和后端服务稳定性');
  }
  
  console.log('\n' + '=' * 120);
  console.log('实时摄像头测试完成!');
  console.log('=' * 120);
  
  return {
    duration: actualDuration,
    frameCount,
    fps,
    accuracy,
    avgProcessingTime,
    avgCaptureDelay,
    avgFrontendTime,
    avgBackendTime,
    correctCount,
    errorCount,
    noDetectionCount,
    results,
    imageStats,
    gestureStats
  };
}

/**
 * 运行系统状态检查
 */
async function runSystemCheck() {
  console.log('开始系统状态检查...');
  console.log('=' * 80);
  
  // 检查后端服务是否可用
  console.log('检查后端服务...');
  
  return new Promise((resolve) => {
    request({
      url: TEST_CONFIG.backendUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      json: {
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwD3+iiigD//2Q=='
      }
    }, (error, response, body) => {
      if (error) {
        console.log(`❌ 后端服务不可用: ${error.message}`);
        resolve(false);
      } else if (response.statusCode === 200) {
        console.log('✅ 后端服务正常');
        resolve(true);
      } else {
        console.log(`❌ 后端服务返回错误: ${response.statusCode}`);
        resolve(false);
      }
    });
  });
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🚀 实时摄像头全面测试');
  console.log('=' * 120);
  
  // 运行系统检查
  const systemReady = await runSystemCheck();
  if (!systemReady) {
    console.log('\n❌ 系统检查失败，无法继续测试');
    console.log('请确保后端服务正在运行: http://localhost:5000/api/recognize');
    process.exit(1);
  }
  
  // 运行实时摄像头测试
  const testResults = await runRealtimeCameraTest();
  
  // 保存测试结果
  const outputFile = path.join(__dirname, '..', 'results', 'realtime_camera_test_results.json');
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(testResults, null, 2));
  
  console.log(`\n📊 测试结果已保存到: ${outputFile}`);
}

// 运行测试
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 所有测试完成!');
    })
    .catch(error => {
      console.error('测试失败:', error);
      process.exit(1);
    });
}

module.exports = { runRealtimeCameraTest, runSystemCheck };
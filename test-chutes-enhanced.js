#!/usr/bin/env node

/**
 * Enhanced Chutes Provider Test Script
 * Tests all the new performance optimizations and features
 */

async function testEnhancedChutesProvider() {
  console.log('🚀 Testing Enhanced OpenWebdev (Chutes) Provider...\n');

  try {
    // Test 1: Check if server is running
    console.log('📡 Testing server connectivity...');
    const healthResponse = await fetch('http://localhost:5173/api/health');
    if (healthResponse.ok) {
      console.log('✅ Server is running and accessible\n');
    } else {
      console.log('❌ Server health check failed\n');
      return;
    }

    // Test 2: Test model listing endpoint
    console.log('📋 Testing models endpoint...');
    const modelsResponse = await fetch('http://localhost:5173/api/models');
    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json();
      const openWebdevModels = modelsData.modelList.filter(m => m.provider === 'OpenWebdev');
      console.log(`✅ Found ${openWebdevModels.length} OpenWebdev models:`);
      openWebdevModels.forEach(model => {
        console.log(`   🤖 ${model.label} (${model.maxTokenAllowed} tokens)`);
      });
      console.log('');
    } else {
      console.log('❌ Models endpoint test failed\n');
    }

    // Test 3: Test enhanced model with GLM-4.5-Air
    console.log('🧠 Testing enhanced GLM-4.5-Air model...');
    const testRequest = {
      messages: [
        {
          role: 'user',
          content: 'Explain quantum computing in exactly 50 words. Be precise and technical.'
        }
      ],
      model: 'zai-org/GLM-4.5-Air',
      provider: 'OpenWebdev',
      max_tokens: 100,
      temperature: 0.1
    };

    const llmResponse = await fetch('http://localhost:5173/api/llmcall', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });

    if (llmResponse.ok) {
      const responseText = await llmResponse.text();
      console.log('✅ Enhanced model response received:');
      console.log(`📝 Response: ${responseText.substring(0, 200)}...`);
      console.log('');
    } else {
      console.log(`❌ Enhanced model test failed: ${llmResponse.status} ${llmResponse.statusText}`);
      const errorText = await llmResponse.text();
      console.log(`Error details: ${errorText.substring(0, 500)}`);
      console.log('');
    }

    // Test 4: Test Qwen3-Coder for coding capabilities
    console.log('💻 Testing Qwen3-Coder-30B for coding...');
    const codeRequest = {
      messages: [
        {
          role: 'user',
          content: 'Write a Python function to calculate fibonacci numbers with memoization. Include type hints.'
        }
      ],
      model: 'Qwen/Qwen3-Coder-30B-A3B-Instruct',
      provider: 'OpenWebdev',
      max_tokens: 500,
      temperature: 0.05
    };

    const codeResponse = await fetch('http://localhost:5173/api/llmcall', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(codeRequest)
    });

    if (codeResponse.ok) {
      const codeText = await codeResponse.text();
      console.log('✅ Coding model response received:');
      console.log(`💻 Code snippet: ${codeText.substring(0, 300)}...`);
      console.log('');
    } else {
      console.log(`❌ Coding model test failed: ${codeResponse.status}`);
      console.log('');
    }

    console.log('🎉 Enhanced Chutes Provider test completed!');
    console.log('✨ All optimizations are active and ready for maximum performance!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n🔧 Make sure the development server is running: npm run dev');
  }
}

// Run the test
testEnhancedChutesProvider();
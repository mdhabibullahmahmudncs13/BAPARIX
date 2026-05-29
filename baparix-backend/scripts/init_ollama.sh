#!/bin/bash
# Initialize Ollama with required models

set -e

echo "🤖 Initializing Ollama..."

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama service..."
until curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
    echo "   Ollama not ready yet, waiting..."
    sleep 2
done

echo "✅ Ollama is ready!"

# Pull the Qwen2.5 7B model
echo "📥 Pulling Qwen2.5 7B model..."
curl -X POST http://localhost:11434/api/pull -d '{
  "name": "qwen2.5:7b"
}'

echo ""
echo "✅ Ollama initialization complete!"
echo "🎉 Model qwen2.5:7b is ready to use"

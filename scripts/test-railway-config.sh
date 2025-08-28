#!/bin/bash

# Test script for Railway configuration
echo "🧪 Testing Railway Configuration..."

# Check if required files exist
echo "📋 Checking required files..."

files=(
    "Dockerfile.railway"
    "railway.json" 
    "railway.toml"
    "railway-template.json"
    "nginx.railway.conf"
    "scripts/railway-start.sh"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check if directories exist
echo "📁 Checking directory structure..."
dirs=("backend" "frontend-web" "shared" "scripts")

for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/ directory exists"
    else
        echo "❌ $dir/ directory missing"
        exit 1
    fi
done

# Validate JSON files
echo "🔍 Validating JSON configurations..."

if command -v jq &> /dev/null; then
    echo "  - Checking railway.json..."
    jq . railway.json > /dev/null && echo "    ✅ Valid JSON" || echo "    ❌ Invalid JSON"
    
    echo "  - Checking railway-template.json..."
    jq . railway-template.json > /dev/null && echo "    ✅ Valid JSON" || echo "    ❌ Invalid JSON"
else
    echo "  ⚠️ jq not installed, skipping JSON validation"
fi

# Test nginx config syntax
echo "🌐 Testing nginx configuration..."
if command -v nginx &> /dev/null; then
    # Create a test version with a dummy port
    sed 's/\$PORT/8080/g' nginx.railway.conf > /tmp/test-nginx.conf
    if nginx -t -c /tmp/test-nginx.conf 2>/dev/null; then
        echo "✅ Nginx configuration syntax valid"
    else
        echo "❌ Nginx configuration has syntax errors"
    fi
    rm -f /tmp/test-nginx.conf
else
    echo "⚠️ nginx not installed, skipping config validation"
fi

# Check environment template
echo "📧 Checking environment template..."
if [ -f "railway.env.example" ]; then
    if grep -q "SMTP_USER" railway.env.example && grep -q "SMTP_PASS" railway.env.example; then
        echo "✅ Email configuration template present"
    else
        echo "❌ Email configuration missing from template"
    fi
else
    echo "❌ railway.env.example missing"
fi

# Test script executability
echo "🔧 Checking script permissions..."
if [ -x "scripts/railway-start.sh" ]; then
    echo "✅ railway-start.sh is executable"
else
    echo "❌ railway-start.sh is not executable"
    echo "   Run: chmod +x scripts/railway-start.sh"
fi

echo ""
echo "🎉 Railway configuration test complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Push code to GitHub repository"
echo "2. Create Railway template at: https://railway.app/template/new"
echo "3. Test deployment on Railway"
echo "4. Share deploy button with friends"
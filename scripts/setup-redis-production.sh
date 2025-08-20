#!/bin/bash
# Triangle Intelligence Platform - Redis Production Setup Script
# This script sets up Redis for production deployment

echo "🚀 Triangle Intelligence Platform - Redis Production Setup"
echo "========================================================="

# Check if running in WSL/Ubuntu
if grep -q Microsoft /proc/version 2>/dev/null; then
    echo "📋 Detected WSL environment"
    ENVIRONMENT="WSL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "📋 Detected Linux environment"
    ENVIRONMENT="LINUX"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📋 Detected macOS environment"
    ENVIRONMENT="MACOS"
else
    echo "❌ Unsupported environment: $OSTYPE"
    exit 1
fi

# Install Redis based on environment
echo ""
echo "🔧 Installing Redis..."

case $ENVIRONMENT in
    WSL|LINUX)
        echo "Installing Redis on Linux/WSL..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y redis-server redis-tools
        elif command -v yum &> /dev/null; then
            sudo yum install -y redis
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y redis
        else
            echo "❌ Package manager not found. Please install Redis manually."
            exit 1
        fi
        ;;
    MACOS)
        echo "Installing Redis on macOS..."
        if command -v brew &> /dev/null; then
            brew install redis
        else
            echo "❌ Homebrew not found. Please install Homebrew first or install Redis manually."
            exit 1
        fi
        ;;
esac

# Start Redis service
echo ""
echo "🚀 Starting Redis service..."

case $ENVIRONMENT in
    WSL|LINUX)
        sudo systemctl start redis-server
        sudo systemctl enable redis-server
        ;;
    MACOS)
        brew services start redis
        ;;
esac

# Test Redis connection
echo ""
echo "🧪 Testing Redis connection..."
sleep 2

if redis-cli ping &> /dev/null; then
    echo "✅ Redis connection successful!"
    REDIS_VERSION=$(redis-cli --version)
    echo "📊 $REDIS_VERSION"
else
    echo "❌ Redis connection failed. Checking troubleshooting steps..."
    
    # Troubleshooting steps
    echo ""
    echo "🔍 Troubleshooting Redis..."
    echo "Status: $(systemctl is-active redis-server 2>/dev/null || echo 'unknown')"
    echo "Port 6379: $(ss -tlnp | grep :6379 || echo 'not listening')"
    
    # Try alternative Redis configurations
    echo ""
    echo "📋 Attempting Redis configuration fixes..."
    
    # Create Redis configuration if it doesn't exist
    if [ ! -f /etc/redis/redis.conf ]; then
        echo "Creating basic Redis configuration..."
        sudo mkdir -p /etc/redis
        sudo tee /etc/redis/redis.conf > /dev/null <<EOF
# Triangle Intelligence Redis Configuration
bind 127.0.0.1
port 6379
timeout 0
save 900 1
save 300 10
save 60 10000
rdbcompression yes
dbfilename dump.rdb
dir /var/lib/redis/
EOF
    fi
    
    # Restart with proper configuration
    sudo systemctl restart redis-server 2>/dev/null || echo "Manual restart required"
    sleep 2
    
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis connection successful after configuration!"
    else
        echo "❌ Redis setup failed. Manual intervention required."
        echo "📋 Next steps:"
        echo "   1. Check Redis logs: sudo journalctl -u redis-server"
        echo "   2. Verify configuration: sudo redis-server --test-config"
        echo "   3. Check port availability: sudo netstat -tlnp | grep 6379"
        exit 1
    fi
fi

# Configure Redis for Triangle Intelligence
echo ""
echo "⚙️  Configuring Redis for Triangle Intelligence..."

# Test Triangle Intelligence Redis integration
redis-cli <<EOF
# Set test values for Triangle Intelligence
SET triangle:test "production-ready"
SET triangle:rate_limit:test 1
EXPIRE triangle:rate_limit:test 900
# Test sorted sets for sliding window rate limiting
ZADD triangle:rate_limit:sliding_window $(date +%s) "test-request"
ZCOUNT triangle:rate_limit:sliding_window -inf +inf
EOF

# Verify Triangle Intelligence Redis operations
if redis-cli GET triangle:test | grep -q "production-ready"; then
    echo "✅ Triangle Intelligence Redis integration verified!"
else
    echo "⚠️  Redis installed but Triangle Intelligence integration needs verification"
fi

echo ""
echo "🎯 Redis Setup Summary:"
echo "======================"
echo "✅ Redis Server: $(redis-cli ping 2>/dev/null || echo 'FAILED')"
echo "📊 Redis Version: $(redis-cli --version | cut -d' ' -f2 2>/dev/null || echo 'unknown')"
echo "🔗 Connection: 127.0.0.1:6379"
echo "💾 Database: 0 (default)"
echo ""

# Environment variable recommendations
echo "🔧 Environment Configuration:"
echo "Add these to your .env.local:"
echo "ENABLE_REDIS_RATE_LIMITING=true"
echo "REDIS_HOST=localhost"
echo "REDIS_PORT=6379"
echo "REDIS_DB=0"
echo ""

# Production deployment notes
echo "🚀 Production Deployment Notes:"
echo "==============================="
echo "For production deployment, consider:"
echo "1. 📈 Managed Redis service (AWS ElastiCache, Upstash, etc.)"
echo "2. 🔒 Redis AUTH (set REDIS_PASSWORD in production)"
echo "3. 🔐 SSL/TLS connection (use REDIS_URL with redis[s]://)"
echo "4. 📊 Redis monitoring and alerting"
echo "5. 💾 Redis persistence configuration (RDB + AOF)"
echo "6. 🏗️  Redis clustering for high availability"
echo ""

# Test the Triangle Intelligence rate limiting
echo "🧪 Testing Triangle Intelligence Rate Limiting..."
if curl -s http://localhost:3000/api/redis-rate-limit-test &> /dev/null; then
    echo "✅ Rate limiting test endpoint accessible"
    echo "   Test at: http://localhost:3000/api/redis-rate-limit-test"
else
    echo "⚠️  Make sure the development server is running:"
    echo "   npm run dev"
fi

echo ""
echo "🎉 Redis setup complete! Triangle Intelligence Platform is ready for production scaling."
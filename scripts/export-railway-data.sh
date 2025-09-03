#!/bin/bash

# Railway MongoDB Data Export Script
# This script exports data from Railway MongoDB for migration to Atlas

set -e

echo "📦 Railway → MongoDB Atlas Data Export Tool"
echo "=========================================="
echo ""

# Check if mongodump is installed
if ! command -v mongodump &> /dev/null; then
    echo "❌ mongodump is not installed."
    echo "   Install MongoDB Database Tools:"
    echo "   brew install mongodb-database-tools (macOS)"
    echo "   apt-get install mongodb-database-tools (Ubuntu)"
    exit 1
fi

# Get Railway MongoDB URI
if [ -z "$RAILWAY_MONGODB_URI" ]; then
    echo "Enter your Railway MongoDB URI:"
    echo "(You can find this in Railway dashboard → MongoDB → Connect)"
    echo "Format: mongodb://user:pass@containers-us-west-xxx.railway.app:port/railway"
    read -r RAILWAY_MONGODB_URI
fi

# Create backup directory with timestamp
BACKUP_DIR="./railway-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo ""
echo "🔄 Exporting data from Railway MongoDB..."
echo "   Target directory: $BACKUP_DIR"
echo ""

# Export data
mongodump --uri="$RAILWAY_MONGODB_URI" --out="$BACKUP_DIR" || {
    echo "❌ Export failed. Please check your connection string."
    exit 1
}

echo ""
echo "✅ Export completed successfully!"
echo ""

# Show export statistics
echo "📊 Export Statistics:"
find "$BACKUP_DIR" -name "*.bson" | while read -r file; do
    size=$(du -h "$file" | cut -f1)
    collection=$(basename "$file" .bson)
    echo "   - $collection: $size"
done

echo ""
echo "📁 Backup saved to: $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "1. Set up your MongoDB Atlas cluster"
echo "2. Get your Atlas connection string"
echo "3. Run: ./scripts/import-to-atlas.sh $BACKUP_DIR"

# Create import script
cat > ./scripts/import-to-atlas.sh << 'EOF'
#!/bin/bash

# MongoDB Atlas Import Script
set -e

BACKUP_DIR=$1

if [ -z "$BACKUP_DIR" ]; then
    echo "Usage: ./scripts/import-to-atlas.sh <backup-directory>"
    exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup directory not found: $BACKUP_DIR"
    exit 1
fi

echo "📥 MongoDB Atlas Data Import Tool"
echo "================================="
echo ""

if [ -z "$ATLAS_URI" ]; then
    echo "Enter your MongoDB Atlas URI:"
    echo "Format: mongodb+srv://username:password@cluster.mongodb.net/kinect"
    read -r ATLAS_URI
fi

echo "🔄 Importing data to MongoDB Atlas..."
echo ""

# Find the database name from backup
DB_NAME=$(ls -d "$BACKUP_DIR"/*/ | head -1 | xargs basename)

# Import data
mongorestore --uri="$ATLAS_URI" \
    --nsFrom="${DB_NAME}.*" \
    --nsTo="kinect.*" \
    "$BACKUP_DIR" || {
    echo "❌ Import failed. Please check your Atlas connection string."
    exit 1
}

echo ""
echo "✅ Import completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with the Atlas connection string"
echo "2. Run: npm run test:atlas"
echo "3. Verify all data was imported correctly"
EOF

chmod +x ./scripts/import-to-atlas.sh

echo "✨ Import script created: ./scripts/import-to-atlas.sh"
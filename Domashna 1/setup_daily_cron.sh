#!/bin/bash
# Setup cron job for daily crypto data update
# Run this script once to install the cron job

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_PATH=$(which python3 || which python)
DAILY_SCRIPT="$SCRIPT_DIR/daily_update.py"
LOG_FILE="$SCRIPT_DIR/logs/daily_update.log"

# Create logs directory
mkdir -p "$SCRIPT_DIR/logs"

# Cron job entry (runs daily at 00:00)
CRON_JOB="0 0 * * * cd $SCRIPT_DIR && $PYTHON_PATH $DAILY_SCRIPT >> $LOG_FILE 2>&1"

# Check if cron job already exists
crontab -l 2>/dev/null | grep -F "$DAILY_SCRIPT" > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Cron job already exists!"
    echo "Current cron jobs:"
    crontab -l | grep daily_update
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job installed successfully!"
    echo ""
    echo "Cron job will run daily at 00:00 (midnight)"
    echo "Log file: $LOG_FILE"
    echo ""
    echo "To view logs:"
    echo "  tail -f $LOG_FILE"
    echo ""
    echo "To manually run update:"
    echo "  python $DAILY_SCRIPT"
fi

echo ""
echo "Current cron jobs:"
crontab -l

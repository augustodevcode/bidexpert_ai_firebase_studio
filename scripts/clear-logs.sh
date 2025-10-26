#!/bin/bash

# This script clears the content of the firebase-debug.log file.

LOG_FILE="/home/user/studio/firebase-debug.log"

if [ -f "$LOG_FILE" ]; then
  > "$LOG_FILE"
  echo "Cleared $LOG_FILE"
else
  echo "$LOG_FILE not found."
fi

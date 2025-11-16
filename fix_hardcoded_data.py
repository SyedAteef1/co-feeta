#!/usr/bin/env python3
import re

file_path = r'd:\feeta_actuall_work\feeta-rep\co-feeta\frontend\src\app\demodash\page.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern 1: Replace dashboardActivities hardcoded array
pattern1 = r"const \[dashboardActivities, setDashboardActivities\] = useState\(\[[^\]]*\{ time: '2d ago', user: 'Md Suhail', action: 'integrated third-party payment gateway' \}[^\]]*\]\);"
replacement1 = "const [dashboardActivities, setDashboardActivities] = useState([]);\n  const [isLoadingActivities, setIsLoadingActivities] = useState(true);"

content = re.sub(pattern1, replacement1, content, flags=re.DOTALL)

# Pattern 2: Replace pendingTasksForDisplay hardcoded array  
pattern2 = r"const \[pendingTasksForDisplay, setPendingTasksForDisplay\] = useState\(\[[^\]]*priority: 'medium'[^\]]*\]\);"
replacement2 = "const [pendingTasksForDisplay, setPendingTasksForDisplay] = useState([]);\n  const [isLoadingPendingTasks, setIsLoadingPendingTasks] = useState(true);"

content = re.sub(pattern2, replacement2, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully replaced hardcoded data with empty arrays and loading states")

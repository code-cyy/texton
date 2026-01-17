#!/usr/bin/env python3
"""
版本号更新脚本
用法: python scripts/bump-version.py [major|minor|patch]
"""
import json
import sys
from datetime import datetime
from pathlib import Path

VERSION_FILE = Path(__file__).parent.parent / "version.json"

def bump_version(bump_type: str = "patch"):
    # 读取当前版本
    with open(VERSION_FILE, 'r') as f:
        data = json.load(f)
    
    version = data.get("version", "1.0.0")
    major, minor, patch = map(int, version.split('.'))
    
    # 更新版本号
    if bump_type == "major":
        major += 1
        minor = 0
        patch = 0
    elif bump_type == "minor":
        minor += 1
        patch = 0
    else:  # patch
        patch += 1
    
    new_version = f"{major}.{minor}.{patch}"
    
    # 更新文件
    data["version"] = new_version
    data["buildTime"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(VERSION_FILE, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Version bumped: {version} -> {new_version}")
    return new_version

if __name__ == "__main__":
    bump_type = sys.argv[1] if len(sys.argv) > 1 else "patch"
    if bump_type not in ["major", "minor", "patch"]:
        print("Usage: python bump-version.py [major|minor|patch]")
        sys.exit(1)
    bump_version(bump_type)

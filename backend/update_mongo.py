#!/usr/bin/env python3
"""
Simple script to update MONGO_URI in .env file
"""
import os
import sys
from pathlib import Path

def update_mongo_uri(connection_string):
    """Update MONGO_URI in .env file"""
    backend_dir = Path(__file__).parent
    env_file = backend_dir / '.env'
    
    if not env_file.exists():
        print("❌ .env file not found!")
        return False
    
    # Read current content
    with open(env_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Update or add MONGO_URI
    updated = False
    new_lines = []
    
    for line in lines:
        if line.strip().startswith('MONGO_URI='):
            new_lines.append(f'MONGO_URI={connection_string}\n')
            updated = True
        else:
            new_lines.append(line)
    
    if not updated:
        new_lines.append(f'MONGO_URI={connection_string}\n')
    
    # Write back
    with open(env_file, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"✅ Successfully updated MONGO_URI in .env file!")
    print(f"📝 Connection string: {connection_string[:50]}...")
    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("=" * 60)
        print("🔧 MongoDB Connection String Updater")
        print("=" * 60)
        print("\nUsage:")
        print("  python update_mongo.py \"mongodb+srv://user:pass@cluster.mongodb.net/\"")
        print("\nOr run interactively:")
        print("  python update_mongo.py")
        print("\n" + "=" * 60)
        
        # Interactive mode
        print("\n📝 Please enter your MongoDB Atlas connection string:")
        print("   Format: mongodb+srv://username:password@cluster.mongodb.net/")
        print("   (You can find this at https://cloud.mongodb.com)")
        print()
        connection_string = input("MongoDB URI: ").strip()
        
        if not connection_string:
            print("\n❌ No connection string provided. Exiting.")
            sys.exit(1)
    else:
        connection_string = sys.argv[1].strip()
    
    if update_mongo_uri(connection_string):
        print("\n🔄 Please restart your backend server for changes to take effect!")
        print("   Run: python run.py")
    else:
        sys.exit(1)


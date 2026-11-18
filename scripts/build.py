import sys
import subprocess

def main():
    print("Running FinPulse build script via uv...")
    res = subprocess.run(["npm", "run", "build"])
    sys.exit(res.returncode)

if __name__ == "__main__":
    main()

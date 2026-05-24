"""
Generate a secure SECRET_KEY for production deployment.
Run this script and copy the output to your Render environment variables.
"""
import secrets

def generate_secret_key():
    """Generate a cryptographically secure random key."""
    return secrets.token_urlsafe(32)

if __name__ == "__main__":
    print("=" * 60)
    print("🔐 SECRET_KEY Generator for Production")
    print("=" * 60)
    print()
    print("Generated SECRET_KEY:")
    print()
    print(generate_secret_key())
    print()
    print("=" * 60)
    print("Copy this key and set it as SECRET_KEY in Render")
    print("Environment Variables section")
    print("=" * 60)

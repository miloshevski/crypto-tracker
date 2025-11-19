"""
Test script to verify Supabase connection and dependencies
Run this before executing the pipeline
"""

import sys

def test_imports():
    """Test if all required packages are installed"""
    print("\n" + "="*60)
    print("🔍 TESTING IMPORTS")
    print("="*60 + "\n")

    required_packages = [
        ('requests', 'HTTP requests'),
        ('supabase', 'Supabase client'),
        ('ccxt', 'Crypto exchange library'),
        ('dotenv', 'Environment variables'),
        ('tqdm', 'Progress bars'),
        ('dateutil', 'Date utilities')
    ]

    all_ok = True

    for package, description in required_packages:
        try:
            __import__(package)
            print(f"✅ {package:20} - {description}")
        except ImportError:
            print(f"❌ {package:20} - {description} - NOT INSTALLED")
            all_ok = False

    print()
    return all_ok


def test_config():
    """Test if configuration is loaded correctly"""
    print("="*60)
    print("⚙️  TESTING CONFIGURATION")
    print("="*60 + "\n")

    try:
        import config

        print(f"✅ SUPABASE_URL:  {config.SUPABASE_URL}")
        print(f"✅ SUPABASE_KEY:  {config.SUPABASE_KEY[:20]}...")
        print(f"✅ Target cryptos: {config.TOP_CRYPTOS_COUNT}")
        print(f"✅ History years:  {config.YEARS_OF_HISTORY}")
        print()
        return True
    except Exception as e:
        print(f"❌ Error loading config: {e}\n")
        return False


def test_supabase_connection():
    """Test connection to Supabase"""
    print("="*60)
    print("🔗 TESTING SUPABASE CONNECTION")
    print("="*60 + "\n")

    try:
        from supabase import create_client
        import config

        print("Connecting to Supabase...")
        supabase = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)

        # Try to query crypto_metadata table
        print("Querying crypto_metadata table...")
        response = supabase.table('crypto_metadata').select('*').limit(1).execute()

        print(f"✅ Connection successful!")
        print(f"✅ Tables accessible")
        print(f"📊 crypto_metadata has {len(response.data)} records (empty if new database)")
        print()
        return True

    except Exception as e:
        print(f"❌ Connection failed: {e}\n")
        return False


def test_api_access():
    """Test API access to CoinGecko and Binance"""
    print("="*60)
    print("🌐 TESTING API ACCESS")
    print("="*60 + "\n")

    # Test CoinGecko
    try:
        import requests
        import config

        print("Testing CoinGecko API...")
        url = f"{config.COINGECKO_BASE_URL}/ping"
        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            print("✅ CoinGecko API accessible")
        else:
            print(f"⚠️  CoinGecko returned status {response.status_code}")
    except Exception as e:
        print(f"❌ CoinGecko test failed: {e}")

    # Test Binance via CCXT
    try:
        import ccxt

        print("Testing Binance API (via CCXT)...")
        exchange = ccxt.binance()
        markets = exchange.load_markets()

        if 'BTC/USDT' in markets:
            print("✅ Binance API accessible")
            print(f"📊 {len(markets)} trading pairs available")
        else:
            print("⚠️  BTC/USDT pair not found")
    except Exception as e:
        print(f"❌ Binance test failed: {e}")

    print()


def main():
    """Run all tests"""
    print("\n" + "🧪"*30)
    print("  CRYPTO ANALYZER - SYSTEM TEST")
    print("🧪"*30 + "\n")

    results = []

    # Run tests
    results.append(("Imports", test_imports()))
    results.append(("Configuration", test_config()))
    results.append(("Supabase Connection", test_supabase_connection()))
    test_api_access()  # Just informational, doesn't block

    # Summary
    print("="*60)
    print("📋 TEST SUMMARY")
    print("="*60 + "\n")

    all_passed = True
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}  {test_name}")
        if not passed:
            all_passed = False

    print()

    if all_passed:
        print("🎉 All tests passed! You're ready to run the pipeline.")
        print("\nRun: python pipeline.py")
    else:
        print("❌ Some tests failed. Please fix the issues above before running the pipeline.")
        print("\nCommon fixes:")
        print("  - Install dependencies: pip install -r requirements.txt")
        print("  - Check .env file has valid Supabase credentials")
        print("  - Verify database schema is created in Supabase")

    print("\n" + "="*60 + "\n")


if __name__ == "__main__":
    main()

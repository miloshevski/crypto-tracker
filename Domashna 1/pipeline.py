"""
Main Pipeline Orchestrator
Runs all three filters in sequence: Get Symbols → Check Dates → Fill Data
Includes performance timing for the bonus challenge
"""

import json
import time
from datetime import datetime
from supabase import create_client, Client
import config

# Import all filters
from filter1_get_symbols import filter1_get_top_symbols
from filter2_check_last_date import filter2_check_last_date
from filter3_fill_data import filter3_fill_data


def log_pipeline_execution(run_id: str, filter_name: str, status: str, stats: dict, error_message: str = None):
    """
    Log pipeline execution to database

    Args:
        run_id: Unique identifier for this pipeline run
        filter_name: Name of the filter ('filter1', 'filter2', 'filter3', 'full_pipeline')
        status: Execution status ('running', 'success', 'failed')
        stats: Dictionary with execution statistics
        error_message: Error message if failed
    """
    try:
        supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)

        log_entry = {
            'run_id': run_id,
            'filter_name': filter_name,
            'status': status,
            'symbols_processed': stats.get('symbols_processed', 0),
            'records_inserted': stats.get('records_inserted', 0),
            'records_updated': stats.get('records_updated', 0),
            'errors_count': stats.get('errors_count', 0),
            'start_time': stats.get('start_time'),
            'end_time': stats.get('end_time'),
            'error_message': error_message,
            'metadata': json.dumps(stats.get('metadata', {}))
        }

        supabase.table('pipeline_logs').insert(log_entry).execute()

    except Exception as e:
        print(f"⚠️  Warning: Could not log to database: {e}")


def print_banner(text: str):
    """Print a nice banner"""
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70 + "\n")


def format_time(seconds: float) -> str:
    """Format seconds into human-readable time"""
    if seconds < 60:
        return f"{seconds:.2f} seconds"
    elif seconds < 3600:
        minutes = seconds / 60
        return f"{minutes:.2f} minutes ({seconds:.0f} seconds)"
    else:
        hours = seconds / 3600
        minutes = (seconds % 3600) / 60
        return f"{hours:.2f} hours ({minutes:.0f} minutes)"


def run_pipeline():
    """
    Main pipeline function
    Executes all three filters in sequence and measures performance
    """
    # Generate unique run ID
    run_id = datetime.now().strftime('%Y%m%d_%H%M%S')

    print_banner("🚀 CRYPTO EXCHANGE ANALYZER - PIPE & FILTER PIPELINE")
    print(f"📅 Run ID: {run_id}")
    print(f"🎯 Target: {config.TOP_CRYPTOS_COUNT} cryptocurrencies")
    print(f"📊 Historical data: {config.YEARS_OF_HISTORY} years")
    print(f"🔗 Database: {config.SUPABASE_URL}")

    # Start overall timer
    pipeline_start_time = time.time()
    overall_stats = {
        'run_id': run_id,
        'symbols_processed': 0,
        'records_inserted': 0,
        'records_updated': 0,
        'errors_count': 0,
        'filters_completed': [],
        'start_time': datetime.now().isoformat()
    }

    try:
        # ═══════════════════════════════════════════════════════════
        # FILTER 1: Get Top 1000 Crypto Symbols
        # ═══════════════════════════════════════════════════════════
        print_banner("FILTER 1: GET TOP 1000 CRYPTO SYMBOLS")
        filter1_start = time.time()

        symbols = filter1_get_top_symbols()

        filter1_duration = time.time() - filter1_start
        print(f"✅ Filter 1 completed in {format_time(filter1_duration)}")
        print(f"📊 Retrieved {len(symbols)} valid cryptocurrencies\n")

        overall_stats['symbols_processed'] = len(symbols)
        overall_stats['filters_completed'].append('filter1')

        # Log Filter 1
        log_pipeline_execution(
            run_id,
            'filter1',
            'success',
            {
                'symbols_processed': len(symbols),
                'start_time': datetime.fromtimestamp(filter1_start).isoformat(),
                'end_time': datetime.now().isoformat(),
                'metadata': {'duration_seconds': filter1_duration}
            }
        )

        # ═══════════════════════════════════════════════════════════
        # FILTER 2: Check Last Available Date
        # ═══════════════════════════════════════════════════════════
        print_banner("FILTER 2: CHECK LAST AVAILABLE DATE")
        filter2_start = time.time()

        symbols_with_dates = filter2_check_last_date(symbols)

        filter2_duration = time.time() - filter2_start
        print(f"✅ Filter 2 completed in {format_time(filter2_duration)}")
        print(f"📊 Analyzed {len(symbols_with_dates)} symbols\n")

        overall_stats['filters_completed'].append('filter2')

        # Log Filter 2
        log_pipeline_execution(
            run_id,
            'filter2',
            'success',
            {
                'symbols_processed': len(symbols_with_dates),
                'start_time': datetime.fromtimestamp(filter2_start).isoformat(),
                'end_time': datetime.now().isoformat(),
                'metadata': {'duration_seconds': filter2_duration}
            }
        )

        # ═══════════════════════════════════════════════════════════
        # FILTER 3: Fill Missing Data
        # ═══════════════════════════════════════════════════════════
        print_banner("FILTER 3: FILL MISSING DATA")
        filter3_start = time.time()

        filter3_stats = filter3_fill_data(symbols_with_dates)

        filter3_duration = time.time() - filter3_start
        print(f"✅ Filter 3 completed in {format_time(filter3_duration)}")
        print(f"📊 Inserted {filter3_stats['total_records_inserted']:,} records\n")

        overall_stats['records_inserted'] = filter3_stats['total_records_inserted']
        overall_stats['errors_count'] = filter3_stats['failed']
        overall_stats['filters_completed'].append('filter3')

        # Log Filter 3
        log_pipeline_execution(
            run_id,
            'filter3',
            'success',
            {
                'symbols_processed': filter3_stats['successful'],
                'records_inserted': filter3_stats['total_records_inserted'],
                'errors_count': filter3_stats['failed'],
                'start_time': datetime.fromtimestamp(filter3_start).isoformat(),
                'end_time': datetime.now().isoformat(),
                'metadata': {
                    'duration_seconds': filter3_duration,
                    'skipped': filter3_stats['skipped']
                }
            }
        )

        # ═══════════════════════════════════════════════════════════
        # FINAL SUMMARY
        # ═══════════════════════════════════════════════════════════
        pipeline_end_time = time.time()
        total_duration = pipeline_end_time - pipeline_start_time

        overall_stats['end_time'] = datetime.now().isoformat()
        overall_stats['total_duration_seconds'] = total_duration

        print_banner("🎉 PIPELINE EXECUTION COMPLETE!")

        print("⏱️  PERFORMANCE SUMMARY:")
        print(f"   Filter 1 (Get Symbols):     {format_time(filter1_duration)}")
        print(f"   Filter 2 (Check Dates):     {format_time(filter2_duration)}")
        print(f"   Filter 3 (Fill Data):       {format_time(filter3_duration)}")
        print(f"   {'─' * 50}")
        print(f"   TOTAL TIME:                 {format_time(total_duration)}")

        print(f"\n📊 DATA SUMMARY:")
        print(f"   Symbols processed:          {overall_stats['symbols_processed']}")
        print(f"   Records inserted:           {overall_stats['records_inserted']:,}")
        print(f"   Errors:                     {overall_stats['errors_count']}")

        print(f"\n💾 DATABASE:")
        print(f"   URL:                        {config.SUPABASE_URL}")
        print(f"   Tables updated:             crypto_data, crypto_metadata, pipeline_logs")

        print(f"\n🏆 BONUS CHALLENGE:")
        total_minutes = total_duration / 60
        total_hours = total_duration / 3600
        print(f"   Time to populate database:  {total_duration:.2f} seconds")
        print(f"                               = {total_minutes:.2f} minutes")
        print(f"                               = {total_hours:.2f} hours")

        # Log overall pipeline
        log_pipeline_execution(
            run_id,
            'full_pipeline',
            'success',
            {
                'symbols_processed': overall_stats['symbols_processed'],
                'records_inserted': overall_stats['records_inserted'],
                'errors_count': overall_stats['errors_count'],
                'start_time': overall_stats['start_time'],
                'end_time': overall_stats['end_time'],
                'metadata': {
                    'total_duration_seconds': total_duration,
                    'filter1_duration': filter1_duration,
                    'filter2_duration': filter2_duration,
                    'filter3_duration': filter3_duration,
                    'filters_completed': overall_stats['filters_completed']
                }
            }
        )

        # Save final results
        with open('pipeline_results.json', 'w') as f:
            json.dump(overall_stats, f, indent=2)

        print(f"\n💾 Results saved to pipeline_results.json")
        print("="*70 + "\n")

        return overall_stats

    except KeyboardInterrupt:
        print("\n\n⚠️  Pipeline interrupted by user")
        log_pipeline_execution(
            run_id,
            'full_pipeline',
            'failed',
            overall_stats,
            error_message="Interrupted by user"
        )
        return None

    except Exception as e:
        print(f"\n\n❌ Pipeline failed with error: {e}")
        import traceback
        traceback.print_exc()

        log_pipeline_execution(
            run_id,
            'full_pipeline',
            'failed',
            overall_stats,
            error_message=str(e)
        )
        return None


if __name__ == "__main__":
    print("\n" + "🚀" * 35)
    print("  CRYPTO EXCHANGE ANALYZER - HOMEWORK 1")
    print("  Software Design and Architecture - FINKI UKIM")
    print("  Pipe and Filter Architecture Implementation")
    print("🚀" * 35 + "\n")

    input("Press ENTER to start the pipeline... ")

    results = run_pipeline()

    if results:
        print("\n✅ Pipeline executed successfully!")
        print(f"📊 Check your Supabase dashboard to view the data")
        print(f"📁 Results saved to pipeline_results.json")
    else:
        print("\n❌ Pipeline execution failed")
        print("📋 Check the error messages above for details")

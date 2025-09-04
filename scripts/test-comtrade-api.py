#!/usr/bin/env python3
"""
Test UN Comtrade API access and validate HS codes
Using the comtradeapicall package
"""

import comtradeapicall
import json
import pandas as pd
from datetime import datetime

def test_basic_api_access():
    """Test basic API access without subscription key"""
    print("🔍 Testing UN Comtrade API Access...")
    print("="*50)
    
    try:
        # Try to get reference data (doesn't require subscription)
        print("\n1. Testing reference data access (no key required)...")
        
        # List available reference tables
        print("   Available reference tables:")
        refs = comtradeapicall.listReference()
        if refs:
            for ref in refs[:5]:  # Show first 5
                print(f"   - {ref}")
        
        return True
    except Exception as e:
        print(f"❌ Error accessing API: {e}")
        return False

def download_hs_codes():
    """Download HS classification codes"""
    print("\n2. Downloading HS Classification Codes...")
    print("-"*40)
    
    try:
        # Get HS classification reference
        print("   Fetching HS codes from UN Comtrade...")
        
        # Try different methods to get HS codes
        methods = [
            ("getReference('HS')", lambda: comtradeapicall.getReference('HS')),
            ("getReference('cmd')", lambda: comtradeapicall.getReference('cmd')),
            ("getReference('cmdHS6')", lambda: comtradeapicall.getReference('cmdHS6'))
        ]
        
        for method_name, method_func in methods:
            try:
                print(f"   Trying {method_name}...")
                result = method_func()
                
                if result is not None:
                    # Convert to DataFrame if possible
                    if isinstance(result, pd.DataFrame):
                        df = result
                    else:
                        df = pd.DataFrame(result)
                    
                    print(f"   ✅ Success! Got {len(df)} HS codes")
                    return df
            except Exception as e:
                print(f"   ⚠️ {method_name} failed: {str(e)[:100]}")
                continue
        
        print("   ❌ Could not download HS codes with any method")
        return None
        
    except Exception as e:
        print(f"❌ Error downloading HS codes: {e}")
        return None

def validate_hs_codes(df):
    """Validate the downloaded HS codes"""
    print("\n3. Validating HS Codes...")
    print("-"*40)
    
    if df is None or df.empty:
        print("   ❌ No data to validate")
        return None
    
    # Display column information
    print(f"   Columns in dataset: {list(df.columns)}")
    print(f"   Total records: {len(df)}")
    
    # Find the HS code column
    code_columns = ['id', 'code', 'hs_code', 'cmd', 'cmdCode', 'classification']
    code_col = None
    for col in code_columns:
        if col in df.columns:
            code_col = col
            break
    
    if not code_col:
        print(f"   ⚠️ Could not identify HS code column")
        code_col = df.columns[0]  # Use first column as fallback
    
    print(f"   Using column '{code_col}' as HS code")
    
    # Find description column
    desc_columns = ['text', 'description', 'cmdDescE', 'name', 'desc']
    desc_col = None
    for col in desc_columns:
        if col in df.columns:
            desc_col = col
            break
    
    # Analyze HS codes
    stats = {
        'total': len(df),
        'valid': 0,
        'invalid': 0,
        'by_length': {},
        'samples': []
    }
    
    for idx, row in df.iterrows():
        if idx >= 1000:  # Limit analysis to first 1000 for speed
            break
            
        code = str(row[code_col]) if pd.notna(row[code_col]) else ''
        
        # Remove any non-digit characters for validation
        clean_code = ''.join(c for c in code if c.isdigit())
        
        if clean_code:
            stats['valid'] += 1
            code_len = len(clean_code)
            stats['by_length'][code_len] = stats['by_length'].get(code_len, 0) + 1
            
            # Collect samples
            if len(stats['samples']) < 10:
                sample = {'code': code}
                if desc_col and desc_col in row:
                    sample['description'] = str(row[desc_col])[:80]
                stats['samples'].append(sample)
        else:
            stats['invalid'] += 1
    
    # Display validation results
    print("\n   📊 VALIDATION RESULTS:")
    print(f"   Total codes: {stats['total']}")
    print(f"   Valid codes: {stats['valid']} ({stats['valid']/stats['total']*100:.1f}%)")
    print(f"   Invalid codes: {stats['invalid']}")
    
    print("\n   📈 CODE LENGTH DISTRIBUTION:")
    for length, count in sorted(stats['by_length'].items()):
        code_type = {2: 'Chapters', 4: 'Headings', 6: 'Subheadings'}.get(length, 'Other')
        print(f"   {length}-digit ({code_type}): {count}")
    
    print("\n   📝 SAMPLE HS CODES:")
    for sample in stats['samples'][:5]:
        desc = sample.get('description', 'No description')
        print(f"   {sample['code']:10} | {desc}")
    
    return stats

def save_results(df, stats):
    """Save the validated HS codes"""
    print("\n4. Saving Results...")
    print("-"*40)
    
    if df is None:
        print("   ❌ No data to save")
        return
    
    try:
        # Save as JSON
        output_file = 'data/un-comtrade-hs-codes.json'
        df.to_json(output_file, orient='records', indent=2)
        print(f"   ✅ Saved {len(df)} HS codes to {output_file}")
        
        # Save validation report
        report = {
            'timestamp': datetime.now().isoformat(),
            'source': 'UN Comtrade API',
            'package': 'comtradeapicall',
            'stats': stats,
            'data_quality': f"{stats['valid']/stats['total']*100:.1f}%" if stats else "N/A"
        }
        
        report_file = 'data/hs-validation-report.json'
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"   ✅ Saved validation report to {report_file}")
        
    except Exception as e:
        print(f"   ❌ Error saving results: {e}")

def main():
    """Main execution"""
    print("🚀 UN COMTRADE HS CODE VALIDATION TOOL")
    print("="*50)
    
    # Test API access
    if not test_basic_api_access():
        print("\n❌ Could not access UN Comtrade API")
        return
    
    # Download HS codes
    df = download_hs_codes()
    
    # Validate the codes
    stats = validate_hs_codes(df)
    
    # Save results
    save_results(df, stats)
    
    # Final summary
    print("\n" + "="*50)
    print("🎯 VALIDATION COMPLETE!")
    if stats and stats['total'] > 0:
        quality = stats['valid'] / stats['total'] * 100
        if quality >= 95:
            print(f"✅ EXCELLENT: Data quality {quality:.1f}% exceeds 95% threshold!")
        elif quality >= 90:
            print(f"✅ GOOD: Data quality {quality:.1f}% is acceptable")
        else:
            print(f"⚠️ WARNING: Data quality {quality:.1f}% needs review")

if __name__ == "__main__":
    main()
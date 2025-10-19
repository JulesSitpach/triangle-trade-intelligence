"""
Extract Canadian tariff data from CBSA Access database
Converts .accdb to CSV for database import
"""

import pyodbc
import csv
import sys
import os

def extract_canadian_tariffs():
    """Extract tariff data from Access database"""

    db_path = os.path.join(os.path.dirname(__file__), '..', '01-99-2025-0-eng.accdb')
    db_path = os.path.abspath(db_path)

    print(f"Reading Access database: {db_path}")

    try:
        # Connect to Access database
        conn_str = (
            r'DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};'
            f'DBQ={db_path};'
        )
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()

        # List all tables
        print("\nAvailable tables:")
        for table in cursor.tables(tableType='TABLE'):
            print(f"  - {table.table_name}")

        # Try to find the main tariff table
        # Common names: tblTariff, Tariff, Rates, TariffSchedule
        cursor.execute("SELECT * FROM tblTariff LIMIT 10")

        columns = [column[0] for column in cursor.description]
        print(f"\nColumns found: {', '.join(columns)}")

        rows = cursor.fetchall()
        print(f"\nSample data (first 5 rows):")
        for i, row in enumerate(rows[:5]):
            print(f"\nRow {i+1}:")
            for col, val in zip(columns, row):
                print(f"  {col}: {val}")

        cursor.close()
        conn.close()

    except pyodbc.Error as e:
        print(f"Database error: {e}")
        print("\nTrying to list tables without connecting...")

        # Try alternative approach
        try:
            conn = pyodbc.connect(conn_str)
            cursor = conn.cursor()

            print("\nTables found:")
            for table in cursor.tables(tableType='TABLE'):
                print(f"  - {table.table_name}")

        except Exception as e2:
            print(f"Failed: {e2}")

if __name__ == '__main__':
    extract_canadian_tariffs()

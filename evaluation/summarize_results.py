#!/usr/bin/env python3
"""Summarize a completed Bill Snap 20-image evaluation CSV."""
import csv
import sys
from pathlib import Path

path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name('20-image-results-template.csv')
with path.open(newline='', encoding='utf-8-sig') as handle:
    rows = list(csv.DictReader(handle))


def truth(value):
    return str(value or '').strip().lower() in {'true', 'yes', '1', 'correct'}


def report(label, values):
    completed = [value for value in values if str(value or '').strip()]
    correct = sum(truth(value) for value in completed)
    if not completed:
        print(f'{label}: not recorded yet')
    else:
        print(f'{label}: {correct}/{len(completed)} ({correct / len(completed) * 100:.1f}%)')

print(f'Rows: {len(rows)} (expected 20)')
report('Classification accuracy', [row.get('classification_correct') for row in rows])
bill_rows = [row for row in rows if truth(row.get('expected_is_bill'))]
nonbill_rows = [row for row in rows if not truth(row.get('expected_is_bill'))]
report('Bill recall', [row.get('classification_correct') for row in bill_rows])
report('Non-bill rejection rate', [row.get('classification_correct') for row in nonbill_rows])
for field, column in [('Merchant', 'merchant_correct'), ('Date', 'date_correct'), ('Total amount', 'total_correct'), ('Category', 'category_correct')]:
    report(f'{field} extraction accuracy', [row.get(column) for row in bill_rows])

notes = [f"{row.get('test_id')}: {row.get('failure_notes')}" for row in rows if row.get('failure_notes', '').strip()]
print('\nRecorded failure notes:')
print('\n'.join(notes) if notes else 'None recorded yet')

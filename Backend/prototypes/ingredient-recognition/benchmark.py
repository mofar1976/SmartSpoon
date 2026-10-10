"""Run repeatable local photo experiments, without claiming recognition accuracy."""
import argparse
import json
import sys
from pathlib import Path

from recognize import MODEL, local_url, recognize


def main():
    parser = argparse.ArgumentParser(description='Fotos mehrfach lokal analysieren und Laufzeiten vergleichen.')
    parser.add_argument('images', nargs='+', type=Path)
    parser.add_argument('--repeat', type=int, default=2)
    parser.add_argument('--url', type=local_url, default='http://127.0.0.1:11434')
    args = parser.parse_args()
    if not 1 <= args.repeat <= 5:
        parser.error('--repeat muss zwischen 1 und 5 liegen.')
    runs = []
    for path in args.images:
        for index in range(args.repeat):
            print(f'{path.name}: Durchlauf {index + 1}/{args.repeat}', file=sys.stderr)
            runs.append({'image': path.name, 'run': index + 1,
                         'result': recognize(path, args.url, MODEL, 180)})
    print(json.dumps({'runs': runs}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

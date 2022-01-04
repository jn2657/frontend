import fileinput
from os import walk


def start() -> None:
    target_path: str = './src/App/component'
    replace_from: str = 'http://localhost:9100'
    replace_to: str = ''

    filenames = next(walk(target_path), (None, None, []))[2]
    for filename in filenames:
        with fileinput.FileInput(filename, inplace=True) as file:
            for line in file:
                line.replace(replace_from, replace_to)


if __name__ == '__main__':
    start()

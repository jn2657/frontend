from os import walk


def start() -> None:
    target_paths: [str] = [
        './src/App/component/',
        './src/App/component/DashBoardComponent/'
    ]

    replace_from: str = 'http://localhost:9100'
    replace_to: str = ''

    for path in target_paths:
        filenames = next(walk(path), (None, None, []))[2]
        for filename in filenames:
            with open(path + filename, 'r') as file:
                file_data = file.read().replace(replace_from, replace_to)
                with open(path + filename, 'w') as new_file:
                    new_file.write(file_data)


if __name__ == '__main__':
    start()

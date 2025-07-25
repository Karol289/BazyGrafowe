#!/usr/bin/env python3
import argparse

from gui_app import gui_mode
from tui_app import repl_mode, process_description
from util import MODEL_PATH
from llama_cpp import Llama


def main():
    parser = argparse.ArgumentParser(
        prog='Ekstraktor danych',
        description='Program służący do konwersji danych tekstowych na bazę danych Neo4j.',
        epilog='Stworzony przez Jacka Wieczorka i Wojciecha Ptasia @2025'
    )

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('-d', '--description', type=str, help='Opis wodociągu')
    group.add_argument('-s', '--sourcefile', type=str, help='Plik z opisem')
    group.add_argument('-r', '--repl', action='store_true', help='Tryb repl')
    group.add_argument('--gui', action='store_true', help='Tryb graficzny (GUI)')

    parser.add_argument('-p', '--prompt', type=str, help='Opcjonalny prompt')
    parser.add_argument('--llm-path', type=str, default='models/mistral-7b-instruct-v0.2.Q5_K_M.gguf', help='Plik z modelem (domyślnie: models/mistral-7b-instruct-v0.2.Q5_K_M.gguf)')
    parser.add_argument('--save-json', type=str, help='Opcjonalna ścieżka do pliku, gdzie zostanie zapisany JSON z odpowiedzi LLM (tylko tryb TUI)')

    args = parser.parse_args()

    llm = Llama(model_path=args.llm_path, n_ctx=2048)

    if getattr(args, 'gui', False):
        gui_mode(llm)
        return
    if args.repl:
        repl_mode(llm)
    else:
        opis = None
        if args.description:
            opis = args.description
        elif args.sourcefile:
            with open(args.sourcefile, 'rt', encoding="utf-8") as file:
                opis = file.read()
        assert opis is not None
        process_description(opis, llm, json_save_path=args.save_json)

if __name__ == "__main__":
    main()

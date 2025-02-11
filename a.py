import os

def compile_src_contents(src_folder, output_file):
    with open(output_file, 'w', encoding='utf-8') as output:
        for root, _, files in os.walk(src_folder):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        output.write(f"=== {file_path} ===\n")
                        output.write(content + "\n\n")
                except Exception as e:
                    output.write(f"=== {file_path} (ERROR: {e}) ===\n\n")

if __name__ == "__main__":
    src_folder = "./src"  # Caminho da pasta src
    output_file = "compiled_contents.txt"  # Nome do arquivo de saída
    compile_src_contents(src_folder, output_file)
    print(f"Conteúdo compilado em {output_file}")

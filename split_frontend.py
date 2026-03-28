import os

input_file = r'C:\Users\USER\.gemini\antigravity\brain\f2012d3e-d262-4ce4-b566-d9e087f034b8\Frontend_GAS_Fixed.html'
output_dir = r'C:\Users\USER\.gemini\antigravity\brain\f2012d3e-d262-4ce4-b566-d9e087f034b8'

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

total_len = len(content)
num_parts = 6
part_size = (total_len + num_parts - 1) // num_parts

for i in range(num_parts):
    start = i * part_size
    end = min(start + part_size, total_len)
    part_content = content[start:end]
    output_file = os.path.join(output_dir, f'Frontend_Part_Fixed_{i+1}.txt')
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        f.write(part_content)

print(f"Successfully split into {num_parts} parts.")

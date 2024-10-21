import random
import os
import shutil
from io import BytesIO
from PyPDF2 import PdfWriter
import mimetypes
print("All imports done, Pyodide is running")


def main():
    global download_location,not_merged
    download_location,not_merged=pdf_merger('pdf-merger',mergable)
    not_merged=not_convertable.to_py()+not_merged
    print(type(download_location),type(not_merged))
    if download_location:
        mime=mimetypes.guess_type(download_location)[0]
        print(mime)
        with open(download_location,"rb") as f:
            file_content=f.read()
        downloadFile(file_content,download_location.split('/')[-1],mime)


def empty_root_folder():
    for item in os.listdir():
        if os.path.isfile(item):
            os.remove(item)
        else:
            shutil.rmtree(item)

def pdf_merger(folder_name,files):
    empty_root_folder()
    os.makedirs(f'{folder_name}')
    not_merged=[]
    print(len(files))
    # timer

    merger=PdfWriter()

    for file_name,bin_str in files:
        #file.seek(0)
        bytes_obj=BytesIO(bytes(bin_str,encoding="raw_unicode_escape"))
        try:

            merger.append(bytes_obj)          

        except Exception as e:
            print("entered exception")
            not_merged.append(f"{file_name}")
            print(e)
            continue
    
    try:
        if len(merger.pages)>0: merger.write(f"{folder_name}/merged.pdf")
    except Exception as e:
        print("second try-except block: ",e)

        
    files_in_dir=[f for f in os.listdir(f"{folder_name}") if f"{f}"[0].isalnum()]
    print(files_in_dir)
    total_files=len(files_in_dir)
    downloadable_location=None
    if total_files>1:
        shutil.make_archive(f"{folder_name}","zip",f"{folder_name}")
        shutil.rmtree(f"{folder_name}")
        downloadable_location=f"{folder_name}.zip"
    elif total_files==1:
        downloadable_location=f"{folder_name}/{files_in_dir[0]}"
    else:
        shutil.rmtree(f"{folder_name}")
    print("not_converted: ",not_merged)
    return [downloadable_location,not_merged]

main()
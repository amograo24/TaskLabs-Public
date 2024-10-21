import random
import os
import shutil
from io import BytesIO
from PyPDF2 import PdfReader, PdfWriter
import mimetypes
print("All imports done, Pyodide is running")


def main():
    global download_location,not_split
    download_location,not_split=pdf_splitter('pdf-splitter',splitable, split_pages_list)
    not_split=not_convertable.to_py()+not_split
    print(type(download_location),type(not_split))
    if download_location:
        mime=mimetypes.guess_type(download_location)[0]
        print(mime)
        with open(download_location,"rb") as f:
            file_content=f.read()
        downloadFile(file_content,download_location.split('/')[-1],mime)

def file_uid_generator(path_name,destination_type):
    charset='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    while True:
        fuid=''
        for i in range(5):
            fuid+=random.choice(charset)
        if not os.path.exists(f"{path_name}_{fuid}.{destination_type}"):
            return fuid

def empty_root_folder():
    for item in os.listdir():
        if os.path.isfile(item):
            os.remove(item)
        else:
            shutil.rmtree(item)

def pdf_splitter(folder_name,files,split_pages_list):
    empty_root_folder()
    os.makedirs(f'{folder_name}')
    not_split=[]
    print(len(files))
    # timer
    if len(files)==len(split_pages_list):
        length=len(files)
        for i in range(length):
            file_name,bin_str=files[i]
            split_page=int(split_pages_list[i]) if int(split_pages_list[i])>=0 else 0 #what if it is negative?
        # for file_name,bin_str in files:
            #file.seek(0)
            bytes_obj=BytesIO(bytes(bin_str,encoding="raw_unicode_escape"))
            try:
                # use PyPDF2 to remove the password from the PDF file

                reader=PdfReader(bytes_obj)
                paritioned=[reader.pages[:split_page],reader.pages[split_page:]]
                filename=file_name[::-1].split('.',maxsplit=1)[-1][::-1]
                path_without_extension=f"{folder_name}/{filename}"
                fuid='' if not os.path.exists(path_without_extension+".pdf") else '_'+file_uid_generator(path_without_extension,"pdf")

                for i in range(2):
                    part=paritioned[i]
                    writer=PdfWriter()
                    for page in part:
                        writer.add_page(page)
                    
                    part_id='_'+str(i)
                    with open(f'{path_without_extension+fuid+part_id}.pdf', "wb") as f:
                        writer.write(f)

            except Exception as e:
                print("entered exception")
                not_split.append(f"{file_name}")
                print(e)
                continue
    else:
        not_split=[file_name for file_name,bin_str in files]
        print("length mismatch")
        
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
    print("not_converted: ",not_split)
    return [downloadable_location,not_split]

main()
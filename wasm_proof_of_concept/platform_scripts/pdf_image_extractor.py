import random
import os
import shutil
from io import BytesIO
from PyPDF2 import PdfReader
import mimetypes
print("All imports done, Pyodide is running")


def main():
    global download_location,not_extracted
    print("about to execute")
    download_location,not_extracted=pdf_image_extractor('pdf-image-extractor',extractable)
    not_extracted=not_convertable.to_py()+not_extracted
    print(type(download_location),type(not_extracted))
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

def pdf_image_extractor(folder_name,files):
    empty_root_folder()
    os.makedirs(f'{folder_name}')
    not_extracted=[]
    print(len(files))
    # timer

    count=0

    for file_name,bin_str in files:
        #file.seek(0)
        bytes_obj=BytesIO(bytes(bin_str,encoding="raw_unicode_escape"))
        try:
            reader=PdfReader(bytes_obj)   
            for page in reader.pages:
                print("images: ",page.images)
                for image_obj in page.images:
                    print("image name: ",image_obj.name)
                    with open(folder_name+"/"+str(count+1)+"_"+ image_obj.name, "wb") as fp: # we can make it uid wise here
                        fp.write(image_obj.data)
                        count += 1

        except Exception as e:
            print("entered exception")
            not_extracted.append(f"{file_name}")
            print(e)
            continue

        
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
    print("not_converted: ",not_extracted)
    return [downloadable_location,not_extracted]

main()
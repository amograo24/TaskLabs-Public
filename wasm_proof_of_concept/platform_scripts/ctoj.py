import random
import os
import shutil
from io import BytesIO
import pandas
import mimetypes
print("All imports done, Pyodide is running")

def main():
    global download_location,not_converted
    download_location,not_converted=csv_to_json('csv-to-json',convertable,orientation)
    not_converted=not_convertable.to_py()+not_converted
    print(type(download_location),type(not_converted))
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

def csv_to_json(folder_name,files,orientation):
    empty_root_folder()
    os.makedirs(f'{folder_name}')
    not_converted=[]
    print(len(files))
    # timer
    orientation='records' if orientation.lower() not in ['split', 'records', 'index', 'columns', 'values', 'table'] else orientation.lower()
    for file_name,bin_str in files:
        #file.seek(0)
        bytes_obj=BytesIO(bytes(bin_str,encoding="raw_unicode_escape"))
        try:
            df=pandas.read_csv(bytes_obj)
            filename=file_name[::-1].split('.',maxsplit=1)[-1][::-1]
            print("Filename: ",filename)
            path_without_extension=f"{folder_name}/{filename}" # over here, we can make it slash
            fuid='' if not os.path.exists(path_without_extension+".json") else '_'+file_uid_generator(path_without_extension,"json")
            with open(f'{path_without_extension+fuid}.json','w') as f:
                f.write(df.to_json(orient=orientation))
        except Exception as e:
            print("entered exception")
            not_converted.append(f"{file_name}")
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
    print("not_converted: ",not_converted)
    return [downloadable_location,not_converted]

main()
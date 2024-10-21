import os
import shutil
from io import BytesIO
import qrcode
from PIL import Image
import mimetypes
print("All imports done, Pyodide is running")

print("All packages installed")

def main():
    global download_location,not_converted
    download_location,not_converted=generate_qr('qrcode',convertable,fcolour,bcolour,text_content)
    not_converted=not_convertable.to_py()+not_converted
    print(type(download_location),type(not_converted))
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

def generate_qr(folder_name,files,fcolour,bcolour,qrcontent):
    empty_root_folder()
    os.makedirs(f'{folder_name}')
    not_converted=[]
    print(len(files))
    # timer
    try:
        qr = qrcode.QRCode(version=None,error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10)
        qr.add_data(qrcontent) # add data to qr code
        qr.make(fit=True)
        print("bcolour: ",bcolour)
        # bcolour="#FFFFFF" if not bcolour else bcolour
        qrimg = qr.make_image(fill_color=fcolour, back_color=bcolour).convert('RGBA') # add colour too convert to image
        if len(files)==1:
            try:
                file_name,bin_str=files[0]
                filename=file_name[::-1].split('.',maxsplit=1)[-1][::-1]
                print("Filename: ",filename)
                path_without_extension=f"{folder_name}/{filename}"
                bytes_obj=BytesIO(bytes(bin_str,encoding="raw_unicode_escape"))
                icon = Image.open(bytes_obj)
                icon_size = (qrimg.size[0] // 5, qrimg.size[1] // 5)
                icon = icon.resize(icon_size)
                center = ((qrimg.size[0] - icon_size[0]) // 2, (qrimg.size[1] - icon_size[1]) // 2)
                qrimg.paste(icon, center)
                print("image added")
            except Exception as e:
                print("entered exception for icon")
                print(e)
                not_converted.append(f"{file_name}")
        qrimg.save(f"{folder_name}/qrcode.png")
        print("qr image saved")
            
    except Exception as e:
        print("entered exception for main qr")
        print(e)
    
    
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
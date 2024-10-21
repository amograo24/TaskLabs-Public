from PIL import Image
import random
import os
import shutil
from io import BytesIO
import mimetypes
print("All imports done, Pyodide is running")

# https://pillow.readthedocs.io/en/stable/handbook/concepts.html
# https://pillow.readthedocs.io/en/stable/handbook/tutorial.html
# https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html

def main():
    global download_location,not_converted
    download_location,not_converted=convert_type_to_static_image('convert',convertable,destination_type)
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

def convert_type_to_static_image(folder_name,files,destination_type):
    empty_root_folder()
    os.makedirs(f'{folder_name}')
    writing_modes=__writing_modes__[destination_type]
    not_converted=[]
    print(len(files))
    # timer
    for file_name,bin_str in files:
        #file.seek(0)
        converted_flag=False
        bytes_obj=BytesIO(bytes(bin_str,encoding="raw_unicode_escape"))
        try:
            obj=Image.open(bytes_obj)
            print("opened")
        except Exception as e:
            print("Exception 0: ",e)
            not_converted.append(file_name)
            continue
        try:
            filename=file_name[::-1].split('.',maxsplit=1)[-1][::-1]
            print("Filename: ",filename)
            path_without_extension=f"{folder_name}/{filename}"
            print(path_without_extension)
            fuid='' if not os.path.exists(path_without_extension+"."+destination_type.lower()) else '_'+file_uid_generator(path_without_extension,destination_type.lower())
            obj.save(f"{path_without_extension+fuid}.{destination_type.lower()}",destination_type)
            converted_flag=True
            print("converted_flag: ",converted_flag)
        except Exception as e:
            print("Exception 1: ",e)
            obj_mode=obj.mode
            index=None
            for group_index in range(len(available_modes)):
                if obj_mode in available_modes[group_index]:
                    index=group_index
                if index!=None:
                    break
            index=index if index!=None else 0
            writing_modes=writing_modes[index:]+writing_modes[:index][::-1]
            writing_modes_ungrouped=[j for group in writing_modes for j in group]
            for i in writing_modes_ungrouped:
                print("Mode: ",i)
                try:
                    fuid='' if not os.path.exists(path_without_extension+"."+destination_type.lower()) else '_'+file_uid_generator(path_without_extension,destination_type.lower())
                    obj.convert(i).save(f"{path_without_extension+fuid}.{destination_type.lower()}",destination_type)
                    converted_flag=True
                    break
                except Exception as e:
                    print("Exception 2", e)
                    converted_flag=False

        if not converted_flag:
            not_converted.append(f"{file_name}")

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

__max_uploadable_size_in_mb__=20
__uploadable_formats__=[
    ['BLP','BMP','DDS','GIF','JPEG','PCX','PNG','PPM','SGI','TGA','TIFF','XBM','DCX','PCD','XPM','IMAGE'],
    ['image/blp','image/bmp','image/vnd.ms-dds','image/gif','image/jpeg',
    'image/x-pcx','image/png','image/x-portable-pixmap','image/x-sgi','mage/x-targa','image/tiff','image/x-xbitmap',
    'image/x-dcx','image/x-photo-cd','image/x-xpm']
    ]
__downloadable_formats__=['BLP','BMP','DDS','EPS','IM','JPEG','PCX','PNG','PPM','SGI','TGA','XBM','PDF']
available_modes=[['P','PA','L','LA','La','1'],['RGB','RGBA','RGBX','RGBa'],
                ['CMYK','YCbCr','LAB','HSV'],['I','F','I;16','I;16L','I;16B','I;16N','BGR;15','BGR;16','BGR;24','BGR;32']]
__writing_modes__={
    'BLP':available_modes,
    'BLP2':available_modes,
    'BMP':[['P','L','1'],['RGB'],[],[]],
    'DDS':[[],['RGB','RGBA'],[],[]],
    'EPS':[['L'],['RGB'],['CMYK'],[]],
    'IM':available_modes,
    'JPEG':[['L','LA'],['RGB','RGBA'],[],[]],
    'PCX':[['P','L','1'],['RGB'],[],[]],
    'PNG':[['P','L','LA','1'],['RGB','RGBA'],[],['I']],
    'PPM':[['L','1'],['RGB'],[],['I']],
    'SGI':[['L'],['RGB','RGBA'],[],[]],
    'TGA':[['P','L','LA',],['RGB','RGBA'],[],[]],
    'XBM':[['1'],[],[],[]],
    'PDF':available_modes,
    }

# excluded for writeable formats: GIF, ICNS, ICO, SPI, WebP
# .im (application/octet-stream) is removed from readable formats for security purposes

main()
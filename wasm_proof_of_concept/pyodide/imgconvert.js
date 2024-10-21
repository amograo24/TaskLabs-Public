// all the code should not be in the main function
document.querySelector('#upload-form').addEventListener("submit",async function(e) {
    e.preventDefault();
    let pyodide = await pyodideReadyPromise;
    console.log('Entered Event Listener')
  //   remove the form
    var convertable=[];
    var not_convertable=[];
    var destination_type=document.querySelector("#destination_type").value
    var max_allowable_size_in_mb=20;
    var inputFiles=document.querySelector("#file-field").files
    console.log(inputFiles)
    if(!validateFileSizes(inputFiles)) {return} else {/* remove the error message (html element)  or just delete the form bro */}
    for(let i=0; i<inputFiles.length; i++) {
      await convertToBinaryString(inputFiles[i])
    }
    console.log('all files read')
  function convertToBinaryString(file){
      console.log("Entered convertToBinaryString Function")
      return new Promise((resolve, reject) => {
          var fr = new FileReader();  
          fr.onload = () => {
              data = fr.result;
              convertable.push([file.name,data]);
              resolve(data) // what does this do
          };
          fr.onerror = () => {
              not_convertable.push(file.name);
              reject(`'${file.name}' cannot be read!`)
          }
          fr.readAsBinaryString(file);            
      });
  }
  // convertable.push('d')
  //////////////
  function validateFileSizes(fileList) {
      const error_div=document.querySelector('#error-message')
      if(fileList.length>10){
        error_div.innerHTML=`You can upload only 10 files at once!`
        error_div.hidden=false;
        return 0;
      }
      for(let i=0; i<fileList.length; i++) {
          if(fileList[i].size>(max_allowable_size_in_mb*1048576)) {
              error_div.innerHTML=`Max upload size per file is ${max_allowable_size_in_mb}mb!`
              error_div.hidden=false;
              // do changes here
              // as in add form
              // add message
              return 0;
          }
      }
      const form=document.querySelector('#upload-form')
      form.remove()
      // here should we remove the form?
      return 1;
  }
  function downloadFile(content,filename,mime_type){
      const blob = new Blob([content.toJs()], { type: mime_type })
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      const button = document.createElement('button')
      button.type="button";
      button.innerHTML="Download";
      a.appendChild(button)
      document.body.appendChild(a);
      button.addEventListener('click',() => {
          console.log('clicked')
      })
      // a.click();
      // document.body.removeChild(a);
      // URL.revokeObjectURL(url);
    
  }
  pyodide.globals.set('downloadFile',downloadFile)
  //////////////
  // should we make inputFiles=null?
  console.log(convertable)
  console.log(not_convertable)

  pyodide.globals.set("convertable",convertable)
  pyodide.globals.set("not_convertable",not_convertable)
  pyodide.globals.set("destination_type",destination_type)

  pyodide.runPython(`
    import js
    convertable=convertable.to_py()
    print(destination_type)
    print("pyodide running again")
    print("pyodide convertable: ",len(convertable),type(convertable))
    download_location,not_converted=convert_type_to_static_image(convertable,destination_type,'convert')
    not_converted=not_convertable.to_py()+not_converted
    ul=js.document.querySelector('#not-converted')
    if not_converted:
      print('not_converted running now')
      h3=js.document.createElement("h3")
      h3.innerHTML="The following files couldn\'t be converted:"
      ul.appendChild(h3)
      for i in not_converted:
          li=js.document.createElement("li")
          li.innerHTML=f'{i}'
          ul.appendChild(li)
    if download_location:
      mime=mimetypes.guess_type(download_location)[0]
      print(mime)
      with open(download_location,"rb") as f:
          file_content=f.read()
      downloadFile(file_content,download_location.split('/')[-1],mime)
  `)
});
async function main() {
    let pyodide = await loadPyodide();
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");
    await micropip.install('pillow')
    pyodide.runPython(`
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
        
        
        def file_uid_generator(path_name,destination_type):
            charset='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            while True:
                fuid=''
                for i in range(5):
                    fuid+=random.choice(charset)
                if not os.path.exists(f"{path_name}_{fuid}.{destination_type}"):
                    return fuid
        
        def convert_type_to_static_image(files,destination_type,folder_name):
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
                    filename=file_name[::-1].split('.',maxsplit=1)[-1][::-1]
                    print("Filename: ",filename)
                    path_without_extension=f"{folder_name}/{filename}"
                    print(path_without_extension)
                    fuid='' if not os.path.exists(path_without_extension+"."+destination_type.lower()) else '_'+file_uid_generator(path_without_extension,destination_type.lower())
                    obj.save(f"{path_without_extension+fuid}.{destination_type.lower()}",destination_type)
                    converted_flag=True
                    print("converted_flag: ",converted_flag)
                except:
                    print("Entered except")
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
                            print("Exception", e)
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
                # downloadable_location.extend(['convert',f'{uid}.zip','zip_folder'])
                downloadable_location=f"{folder_name}.zip"
            elif total_files==1:
                # downloadable_location.extend(['convert',uid,f'{files_in_dir[0]}'])
                downloadable_location=f"{folder_name}/{files_in_dir[0]}"
            else:
                pass
                shutil.rmtree(f"{folder_name}")
                # downloadable_location.extend([0,0,0])
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
    `)
    return pyodide;
  }
let pyodideReadyPromise = main();
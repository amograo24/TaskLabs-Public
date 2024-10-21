// all the code should not be in the main function
document.querySelector('#upload-form').addEventListener("submit",async function(e) {
    e.preventDefault();
    let pyodide = await pyodideReadyPromise;
    console.log('Entered Event Listener')
  //   remove the form
    var convertable=[];
    var not_convertable=[];
    var max_allowable_size_in_mb=20;
    var inputFiles=document.querySelector("#file-field").files
    var fcolour = document.querySelector("#qr_colour").value;
    var bcolour = document.querySelector("#qr_background").value;
    var text_content = document.querySelector("#qr_text").value;
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
  pyodide.globals.set("fcolour",fcolour)
  pyodide.globals.set("bcolour",bcolour)
  pyodide.globals.set("text_content",text_content)

  pyodide.runPython(`
    import js
    convertable=convertable.to_py()
    # fcolour=fcolour.to_py()
    # bcoulour=bcolour.to_py()
    # text_content=text_content.to_py()
    print("pyodide running again")
    print("pyodide convertable: ",len(convertable),type(convertable))
    download_location,not_converted=generate_qr(convertable,fcolour,bcolour,text_content,'convert')
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
    await micropip.install('qrcode')
    // await micropip.install('pyqrcode',keep_going=true)
    pyodide.runPython(`
        import os
        import shutil
        from io import BytesIO
        import qrcode
        from PIL import Image
        import mimetypes
        print("All imports done, Pyodide is running")
        
        print("All packages installed")
        
        def generate_qr(files,fcolour,bcolour,qrcontent,folder_name):
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
                        # qrimg.save(f"{path_without_extension}.png")
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
    `)
    return pyodide;
  }
let pyodideReadyPromise = main();
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
    var all_in_one=document.querySelector("#all_in_one").checked
    console.log('all_in_one: ',all_in_one)
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
  pyodide.globals.set("all_in_one",all_in_one)

  pyodide.runPython(`
    import js
    convertable=convertable.to_py()
    print("pyodide running again")
    print("all_in_one: ",all_in_one,type(all_in_one))
    print("pyodide convertable: ",len(convertable),type(convertable))
    download_location,not_converted=csv_to_excel(convertable,all_in_one,'csv_to_excel')
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
    await micropip.install('pandas')
    await micropip.install('openpyxl')
    pyodide.runPython(`
        import random
        import os
        import shutil
        from io import BytesIO
        import pandas
        import mimetypes
        print("All imports done, Pyodide is running")
        
        
        def file_uid_generator(path_name, destination_type):
            charset='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            while True:
                fuid=''
                for i in range(5):
                    fuid+=random.choice(charset)
                if not os.path.exists(f"{path_name}_{fuid}.{destination_type}"):
                    return fuid
        
        def file_uid_generator_all_in_one(sheetname,excel_obj):
            charset='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            sheetname=sheetname[:25] if len(sheetname)>=31 else sheetname
            while True:
                fuid=''
                for i in range(5):
                    fuid+=random.choice(charset)
                if f'{sheetname}_{fuid}' not in excel_obj.book.sheetnames:
                    return fuid
        
        def csv_to_excel(files,all_in_one,folder_name):
            os.makedirs(f'{folder_name}')
            not_converted=[]
            print(len(files))
            # timer

            if all_in_one: writer = pandas.ExcelWriter(f'{folder_name}/taskbot_{folder_name}.xlsx')
            for file_name,bin_str in files:
                bytes_obj=BytesIO(bytes(bin_str,encoding="raw_unicode_escape"))
                try:
                    df=pandas.read_csv(bytes_obj)
                    filename=file_name[::-1].split('.',maxsplit=1)[-1][::-1]
                    print("Filename: ",filename)
                    if not all_in_one:
                        path_without_extension=f"{folder_name}/{filename}"
                        fuid='' if not os.path.exists(path_without_extension+".xlsx") else '_'+file_uid_generator(path_without_extension,"xlsx")
                        df.to_excel(f'{path_without_extension+fuid}.xlsx', index=False)
                    else:
                        # here do fuid stuff
                        filename=filename[:31]
                        fuid='' if filename not in writer.book.sheetnames else '_'+file_uid_generator_all_in_one(filename,writer)
                        df.to_excel(writer, sheet_name=filename+fuid, index=False)
                except Exception as e:
                    print("entered exception")
                    not_converted.append(f"{file_name}")
                    print(e)
                    continue
            if all_in_one: writer.save()

            files_in_dir=[f for f in os.listdir(f"{folder_name}") if f"{f}"[0].isalnum()]
            print(files_in_dir)
            total_files=len(files_in_dir)
            downloadable_location=None
            if total_files>1:
                shutil.make_archive(f"{folder_name}","zip",f"{folder_name}")
                shutil.rmtree(f"{folder_name}l")
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
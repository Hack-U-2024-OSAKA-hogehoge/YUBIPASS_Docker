const updateSerialPort = async () => {
    try {
      let updateport = await navigator.serial.requestPort();
    } catch (e) {

    }
  }

function createWindow () {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
      width: 450,
      height:300,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    })

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    // Open the DevTools.
    // デバッグツールをつかう
    // mainWindow.webContents.openDevTools()

    mainWindow.webContents.session.on('select-serial-port', (event, portList, webContents, callback) => {
      // console.log('SELECT-SERIAL-PORT FIRED WITH', portList);

      //レンダラープロセスに、送信
      webContents.send('get_serialport_p5',JSON.stringify(portList));
      event.preventDefault();

      let selectedPort = portList.find((device) => {
        //ipcRendererから送られてきた、
        //選択したポートのJSONをチェックする
        //シリアル番号、USBベンダーID、プロダクトIDが一致するものがあれば、true
        if(selectedPortInfo!=null){
          if( device.serialNumber == selectedPortInfo.serialNumber &&
              device.vendorId == selectedPortInfo.vendorId &&
              device.productId == selectedPortInfo.productId) {
                return true
          }
        }
      });
      if (!selectedPort) {
        // 何もコールバックしない
        callback('')
      } else {
        // シリアルポートのIDをコールバック
        callback(selectedPort.portId)
      }
    });
  }


window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }

    for (const type of ['chrome', 'node', 'electron']) {
      replaceText(`${type}-version`, process.versions[type])
    }
  })

const {contextBridge, ipcRenderer} = require('electron')
contextBridge.exposeInMainWorld(
    "api", {
      // シリアルポートの番号を送る
      SetPort: (data) => ipcRenderer.send("set_serialport_p5", data),

      // シリアルポートの情報を受け取る
      // ipcRendererが受信したら、
      // その引数を、GetPortの引数にある関数に送る
      GetPort: (f) => {
        ipcRenderer.on("get_serialport_p5", (event, arg) => f(arg));
      }
  })

const getSerialList = (port_info) =>{
    serialPortList = JSON.parse(port_info);
    console.log(serialPortList);
    portCustomNameList = [];

      for(let i=0; i<serialPortList.length; i++){
          let sp = '';
          sp += serialPortList[i].portName ;
          if(serialPortList[i].displayName != null){
              sp +=(' ('+serialPortList[i].displayName+')');
          }
          //app.setDropdownOption(sp);
          portCustomNameList[i] = sp;
          console.log("port " + i + ":" + sp);
      }

  }

//window.api.GetPort((arg) => getSerialList(arg));

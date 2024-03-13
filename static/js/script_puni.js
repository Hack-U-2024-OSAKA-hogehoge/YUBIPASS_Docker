const IMAGE_WIDTH = 256;
const IMAGE_HEIGHT = 288;
const IMAGE_DEPTH = 8;
const IMAGE_START_SIGNATURE = new Uint8Array([0xAA]);

async function assembleBMPHeader(width, height, depth, includePalette = false) {
    const BMP_HEADER_SIZE = 54;
    const TYPICAL_PIXELS_PER_METER = 2835;

    const fileSize = includePalette ? BMP_HEADER_SIZE + (4 * Math.pow(2, depth)) + (Math.ceil((depth * width + 31) / 32) * 4 * height) :
        BMP_HEADER_SIZE + (Math.ceil((depth * width + 31) / 32) * 4 * height);
    const rasterOffset = includePalette ? BMP_HEADER_SIZE + (4 * Math.pow(2, depth)) : BMP_HEADER_SIZE;

    const bmpHeader = new Uint8Array(BMP_HEADER_SIZE);
    const headerView = new DataView(bmpHeader.buffer);
    headerView.setUint8(0, 0x42); // "B"
    headerView.setUint8(1, 0x4D); // "M"
    headerView.setUint32(2, fileSize, true);
    headerView.setUint32(10, rasterOffset, true);
    headerView.setUint32(14, 40, true);
    headerView.setUint32(18, width, true);
    headerView.setInt32(22, -height, true);
    headerView.setUint16(26, 1, true);
    headerView.setUint16(28, depth, true);
    headerView.setUint32(34, Math.ceil((depth * width + 31) / 32) * 4 * height, true);
    headerView.setUint32(38, TYPICAL_PIXELS_PER_METER, true);
    headerView.setUint32(42, TYPICAL_PIXELS_PER_METER, true);

    if (includePalette) {
        const bmpPalette = new Uint8Array(4 * Math.pow(2, depth));
        for (let index = 0; index < Math.pow(2, depth); index++) {
            bmpPalette[index * 4] = index;
            bmpPalette[index * 4 + 1] = index;
            bmpPalette[index * 4 + 2] = index;
            bmpPalette[index * 4 + 3] = index;
        }
        return [bmpHeader, bmpPalette];
    }

    return bmpHeader;
}


// async function requestSerialPortAndFetchImage(outputFileName) {
//     try {
//         // Get serial port somehow
//         const port = await navigator.serial.requestPort();
//         await port.open({ baudRate: 115200 });
//         await getFingerprintImage(port, outputFileName);
//     } catch (error) {
//         console.error('Error:', error);
//     }
// }

// async function requestSerialPortAndFetchImage(outputFileName) {
//     try {
//         // Get serial port somehow
//         const port = await navigator.serial.requestPort();
//         await port.open({ baudRate: 57600 });

//         // Set up reader to receive data from Arduino
//         const reader = port.readable.getReader();

//         // Function to add Arduino output to textarea
//         async function addArduinoOutput(msg) {
//             var textarea = document.getElementById('outputArea');
//             textarea.value += msg;
//             textarea.scrollTop = textarea.scrollHeight;
//         }

//         // Listen for data from Arduino
//         while (true) {
//             const { value, done } = await reader.read();
//             if (done) break;
//             const inputValue = new TextDecoder().decode(value);
//             addArduinoOutput(inputValue);

//             // 受信したバイナリデータがあれば、ファイルとして保存する
//             const signature = new Uint8Array([0xAA]);
//             if (value.length > 0 && value[0] === signature[0]) {
//                 // バイナリデータの保存処理
//                 const blob = new Blob([value], { type: 'application/octet-stream' });
//                 const url = URL.createObjectURL(blob);

//                 // ダウンロード用リンクを生成して自動クリックする
//                 const a = document.createElement('a');
//                 a.href = url;
//                 a.download = outputFileName; // ダウンロード時のファイル名を指定
//                 document.body.appendChild(a);
//                 a.click();
//                 document.body.removeChild(a);
//                 URL.revokeObjectURL(url);

//                 // ファイル保存後にループを抜ける
//                 break;
//             }
//         }
//         // Fetch image from Arduino
//         await getFingerprintImage(port, outputFileName);
//     } catch (error) {
//         console.error('Error:', error);
//     }
// }

async function requestSerialPortAndFetchImage(outputFileName) {
    try {
        // シリアルポートを取得
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 57600 });

        const writer = port.writable.getWriter();
        // const fileStream = await window.showSaveFilePicker();
        // const outFileWriter = fileStream.getWriter();

        await writer.write(IMAGE_START_SIGNATURE);

        let receivedHeader = false;
        let totalBytesExpected = 0;
        let imageData = [];

        // textareaにArduinoからの出力を表示するための関数
        function addArduinoOutput(msg) {
            var textarea = document.getElementById('outputArea');
            textarea.value += msg;
            textarea.scrollTop = textarea.scrollHeight;
        }

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            addArduinoOutput(new TextDecoder().decode(value));

            if (!receivedHeader) {
                if (value.length > 0 && value[0] === IMAGE_START_SIGNATURE[0]) {
                    const header = assembleBMPHeader(IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_DEPTH, true);
                    await outFileWriter.write(header);
                    receivedHeader = true;
                    totalBytesExpected = Math.ceil((IMAGE_WIDTH * IMAGE_HEIGHT) / 2);
                }
            } else {
                imageData.push(value);
                totalBytesExpected -= value.length;
                if (totalBytesExpected <= 0) {
                    await writer.releaseLock();
                    await outFileWriter.write(new Blob(imageData, { type: 'application/octet-stream' }));
                    await outFileWriter.close();
                    console.log(`Image saved to ${outputFileName}`);
                    
                    // 自動でダウンロードする
                    const blob = new Blob(imageData, { type: 'application/octet-stream' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = outputFileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    break;
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}




// Usage: requestSerialPortAndFetchImage('print.bmp');

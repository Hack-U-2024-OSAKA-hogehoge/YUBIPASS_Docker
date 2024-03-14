const IMAGE_WIDTH = 256;
const IMAGE_HEIGHT = 288;
const IMAGE_DEPTH = 8;
const IMAGE_START_SIGNATURE = new Uint8Array([0xAA]);

// Assemble BMP header for a grayscale image
function assembleBMPHeader(width, height, depth, includePalette = false) {
    // Define constants
    const BMP_HEADER_SIZE = 54;
    const BMP_INFOHEADER_SIZE = 40;
    const TYPICAL_PIXELS_PER_METER = 2835; // 72 DPI, boiler-plate
    
    // Calculate header sizes
    const byteWidth = Math.ceil((depth * width + 31) / 32 | 0) * 4;
    console.log(`Byte width: ${byteWidth}`);
    const imageSize = byteWidth * height;
    console.log(`Image size: ${imageSize} bytes`);
    
    let fileSize, rasterOffset,numColours, bmpPaletteSize;
    
    if (includePalette) {
        numColours = Math.pow(2, depth);
        bmpPaletteSize = numColours * 4; // Each palette entry is 4 bytes
        fileSize = BMP_HEADER_SIZE + bmpPaletteSize + imageSize;
        rasterOffset = BMP_HEADER_SIZE + bmpPaletteSize;
    } else {
        fileSize = BMP_HEADER_SIZE + BMP_INFOHEADER_SIZE + imageSize;
        console.log('else fileSize: ', fileSize);
        rasterOffset = BMP_HEADER_SIZE + BMP_INFOHEADER_SIZE;
        console.log('else rasterOffset: ', rasterOffset);
    }
    console.log(`Number of colours: ${numColours}`);
    console.log(`Palette size: ${bmpPaletteSize} bytes`);
    console.log(`File size: ${fileSize} bytes`);
    console.log(`Raster offset: ${rasterOffset} bytes`);
    // Create BMP header as ArrayBuffer
    const bmpHeader = new ArrayBuffer(BMP_HEADER_SIZE);
    // console.log('bmpHeader: ', bmpHeader);
    const dv = new DataView(bmpHeader);
    
    // BMP File Header
    dv.setUint8(0, 0x42); // "B"
    dv.setUint8(1, 0x4D); // "M"
    dv.setUint32(2, fileSize, true); // Total File size
    dv.setUint32(10, rasterOffset, true); // Offset to image data
    
    // BMP Info Header
    dv.setUint32(14, BMP_INFOHEADER_SIZE, true); // Info header size
    dv.setInt32(18, width, true); // Image width
    dv.setInt32(22, height, true); // Image height (negative to indicate top-down)
    dv.setUint16(26, 1, true); // Number of color planes
    dv.setUint16(28, depth, true); // Bits per pixel
    dv.setUint32(34, imageSize, true); // Image size
    dv.setUint32(38, TYPICAL_PIXELS_PER_METER, true); // Horizontal resolution (pixels per meter)
    dv.setUint32(42, TYPICAL_PIXELS_PER_METER, true); // Vertical resolution (pixels per meter)

    // console.log('bmpHeader: ', bmpHeader);
    // console.log('dv: ', dv);
    
    // if (includePalette) {
    //     const bmpPaletteBytes = [];
    //     console.log("includePalette=" + includePalette);
    
    //     // Equal measures of each colour component yields a scale
    //     // of grays, from black to white
    //     for (let index = 0; index < numColours; index++) {
    //         const R = G = B = A = index;
    //         const paletteEntry = new Uint8Array([R, G, B, A]);
    //         bmpPaletteBytes.push(paletteEntry);
    //     }
    //     console.log('bmpPaletteBytes: ', bmpPaletteBytes);
    
    //     return bmpHeader.concat(...bmpPaletteBytes);
    // }

    if (includePalette) {
        const bmpPaletteBytes = [];
        console.log("includePalette=" + includePalette);
    
        // Equal measures of each colour component yields a scale
        // of grays, from black to white
        for (let index = 0; index < numColours; index++) {
            const R = G = B = A = index;
            const paletteEntry = new Uint8Array([R, G, B, A]);
            bmpPaletteBytes.push(paletteEntry);
        }
        // console.log('bmpPaletteBytes: ', bmpPaletteBytes);
    
        // bmpHeaderをバイト列に変換
        const headerBytes = new Uint8Array(bmpHeader.buffer);
    
        // bmpPaletteBytesを一つの配列に結合
        const paletteBytes = Uint8Array.from(bmpPaletteBytes.flat());
    
        // headerBytesとpaletteBytesを結合して新しいバイト列を作成
        const combinedBytes = new Uint8Array(headerBytes.length + paletteBytes.length);
        combinedBytes.set(headerBytes, 0);
        combinedBytes.set(paletteBytes, headerBytes.length);
    
        return combinedBytes.buffer; // DataViewに戻す前にArrayBufferに変換して返す
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
//         await port.open({ baudRate: 115200 });

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

// async function getFingerprintImage(outputFileName) {
//     try {
//         const port = await navigator.serial.requestPort();
//         await port.open({ baudRate: 115200 });
        
//         const writer = port.writable.getWriter();
//         const reader = port.readable.getReader();
        
//         const signatureBuffer = new Uint8Array([0xAA]);
        
//         // Open output file
//         const fileStream = await fetch(outputFileName, { method: 'PUT' });
//         const outFileStream = fileStream.body;
        
//         // Write BMP header
//         const bmpHeader = assembleBMPHeader(IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_DEPTH, true);
//         await outFileStream.write(bmpHeader);
        
//         // Give some time for the Arduino reset
//         await new Promise(resolve => setTimeout(resolve, 1000));
        
//         let currByte = new Uint8Array(1);
        
//         // Read data until start signature is received
//         while (true) {
//             await reader.read(currByte);
//             if (currByte[0] === signatureBuffer[0]) {
//                 break;
//             }
//             console.log(String.fromCharCode(currByte[0])); // Assuming printable characters
//         }
        
//         // The datasheet says the sensor sends 1 byte for every 2 pixels
//         const totalBytesExpected = (IMAGE_WIDTH * IMAGE_HEIGHT) / 2;
        
//         for (let i = 0; i < totalBytesExpected; i++) {
//             await reader.read(currByte);
//             if (!currByte) {
//                 console.log("Read timed out.");
//                 return false;
//             }
//             // Write received byte for 2 adjacent pixels
//             await outFileStream.write(new Uint8Array([currByte[0], currByte[0]]));
//         }
        
//         // Read and print remaining data until inter-byte timeout fires
//         while (true) {
//             const { value, done } = await reader.read();
//             if (done) break;
//             console.log(String.fromCharCode(value[0])); // Assuming printable characters
//         }
        
//         console.log(`[Image saved to ${outputFileName}]`);
//         return true;
        
//     } catch (error) {
//         console.error("getFingerprint() failed: ", error);
//         return false;
//     }
// }

async function getFingerprintImage(outputFileName) {
    try {
        // Request access to the serial port
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });
        
        // Get writable and readable streams from the serial port
        const writer = port.writable.getWriter();
        const reader = port.readable.getReader();

        // Function to add Arduino output to textarea
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
        
        const signatureBuffer = new Uint8Array([0xAA]);
        
        // Open output file
        const fileStream = new WritableStream();
        const writerStream = fileStream.getWriter();
        
        // Write BMP header
        const bmpHeader = assembleBMPHeader(IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_DEPTH, true);
        console.log('bmpHeader: ', bmpHeader);
        await writerStream.write(bmpHeader);
        
        // Give some time for the Arduino reset
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let currByte = new Uint8Array(1);
        
        // Read data until start signature is received
        while (true) {
            await reader.read(currByte);
            if (currByte[0] === signatureBuffer[0]) {
                console.log("Start signature received.");
                break;
            }
            // console.log(String.fromCharCode(currByte[0])); // Assuming printable characters
        }
        
        // The datasheet says the sensor sends 1 byte for every 2 pixels
        const totalBytesExpected = (IMAGE_WIDTH * IMAGE_HEIGHT) / 2;
        
        for (let i = 0; i < totalBytesExpected; i++) {
            await reader.read(currByte);
            if (!currByte) {
                console.log("Read timed out.");
                return false;
            }
            // Write received byte for 2 adjacent pixels
            await writerStream.write(new Uint8Array([currByte[0], currByte[0]]));
        }
        
        // Read and print remaining data until inter-byte timeout fires
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            console.log(String.fromCharCode(value[0])); // Assuming printable characters
        }
        
        await writerStream.close();
        
        // Convert the WritableStream to a Blob
        const blob = await fileStream.toBlob();
        
        // Create a download link for the Blob
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = outputFileName;
        document.body.appendChild(link);
        
        // Trigger the download
        link.click();
        
        console.log(`[Image saved to ${outputFileName}]`);
        return true;
        
    } catch (error) {
        console.error("getFingerprint() failed: ", error);
        return false;
    }
}

// Usage: requestSerialPortAndFetchImage('print.bmp');